import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isAdmin } from "./replitAuth";
import {
  ObjectStorageService,
  ObjectNotFoundError,
} from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import { insertPurchaseSchema } from "@shared/schema";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-07-30.basil",
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Registration route (simple version - in production use proper auth)
  // SECURITY: Registration endpoint removed - using secure Replit Auth (OpenID Connect)
  // Users register through Replit's secure authentication system instead of manual registration

  // Categories routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Podcasts routes
  app.get("/api/categories/:slug/podcasts", async (req, res) => {
    try {
      const category = await storage.getCategoryBySlug(req.params.slug);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      const podcasts = await storage.getPodcastsByCategory(category.id);
      res.json(podcasts);
    } catch (error) {
      console.error("Error fetching podcasts:", error);
      res.status(500).json({ message: "Failed to fetch podcasts" });
    }
  });

  app.get("/api/podcasts/:slug", async (req, res) => {
    try {
      const podcast = await storage.getPodcastBySlug(req.params.slug);
      if (!podcast) {
        return res.status(404).json({ message: "Podcast not found" });
      }
      res.json(podcast);
    } catch (error) {
      console.error("Error fetching podcast:", error);
      res.status(500).json({ message: "Failed to fetch podcast" });
    }
  });

  // Individual podcast by ID (for checkout)
  app.get("/api/podcasts/by-id/:id", async (req, res) => {
    try {
      const podcast = await storage.getPodcast(req.params.id);
      if (!podcast) {
        return res.status(404).json({ message: "Podcast not found" });
      }
      res.json(podcast);
    } catch (error) {
      console.error("Error fetching podcast:", error);
      res.status(500).json({ message: "Failed to fetch podcast" });
    }
  });

  // Promote user to admin (temporary endpoint for initial setup)
  // IMPORTANT: This should be removed or secured further in production
  app.post("/api/admin/promote/:userId", isAuthenticated, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const currentUserId = req.user.claims.sub;
      
      // Only allow self-promotion for initial setup, or if already admin
      const currentUser = await storage.getUser(currentUserId);
      if (userId !== currentUserId && !currentUser?.isAdmin) {
        return res.status(403).json({ 
          message: "Access Denied: Cannot promote other users unless you are admin" 
        });
      }
      
      const user = await storage.updateUserAdminStatus(userId, true);
      res.json({ 
        message: "User promoted to administrator", 
        user: { id: user.id, email: user.email, isAdmin: user.isAdmin }
      });
    } catch (error) {
      console.error("Error promoting user to admin:", error);
      res.status(500).json({ message: "Failed to promote user" });
    }
  });

  // Admin routes - SECURED: Only authenticated administrators can access
  app.get("/api/admin/podcasts", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const podcasts = await storage.getAllPodcasts();
      res.json(podcasts);
    } catch (error) {
      console.error("Error fetching admin podcasts:", error);
      res.status(500).json({ message: "Failed to fetch podcasts" });
    }
  });

  app.post("/api/admin/podcasts", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const podcast = await storage.createPodcast(req.body);
      res.json(podcast);
    } catch (error) {
      console.error("Error creating podcast:", error);
      res.status(500).json({ message: "Failed to create podcast" });
    }
  });

  app.put("/api/admin/podcasts/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const podcast = await storage.updatePodcast(req.params.id, req.body);
      if (!podcast) {
        return res.status(404).json({ message: "Podcast not found" });
      }
      res.json(podcast);
    } catch (error) {
      console.error("Error updating podcast:", error);
      res.status(500).json({ message: "Failed to update podcast" });
    }
  });

  app.delete("/api/admin/podcasts/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const deleted = await storage.deletePodcast(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Podcast not found" });
      }
      res.json({ message: "Podcast deleted successfully" });
    } catch (error) {
      console.error("Error deleting podcast:", error);
      res.status(500).json({ message: "Failed to delete podcast" });
    }
  });

  // Purchase routes
  app.post("/api/create-payment-intent", isAuthenticated, async (req: any, res) => {
    try {
      const { podcastId } = req.body;
      const userId = req.user.claims.sub;

      // Check if already purchased
      const existingPurchase = await storage.checkUserPurchase(userId, podcastId);
      if (existingPurchase) {
        return res.status(400).json({ message: "Podcast already purchased" });
      }

      // Get podcast details
      const podcast = await storage.getPodcast(podcastId);
      if (!podcast) {
        return res.status(404).json({ message: "Podcast not found" });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: podcast.price,
        currency: "pln",
        metadata: {
          userId,
          podcastId,
        },
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  app.post("/api/purchases", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const purchaseData = insertPurchaseSchema.parse({
        ...req.body,
        userId,
      });

      // Verify payment with Stripe
      if (purchaseData.stripePaymentIntentId) {
        const paymentIntent = await stripe.paymentIntents.retrieve(purchaseData.stripePaymentIntentId);
        if (paymentIntent.status !== 'succeeded') {
          return res.status(400).json({ message: "Payment not successful" });
        }
      }

      const purchase = await storage.createPurchase(purchaseData);
      res.status(201).json(purchase);
    } catch (error) {
      console.error("Error creating purchase:", error);
      res.status(500).json({ message: "Failed to create purchase" });
    }
  });

  // User library routes
  app.get("/api/user/purchases", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const purchases = await storage.getUserPurchases(userId);
      res.json(purchases);
    } catch (error) {
      console.error("Error fetching user purchases:", error);
      res.status(500).json({ message: "Failed to fetch purchases" });
    }
  });

  // Protected audio file serving
  app.get("/objects/:objectPath(*)", isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub;
    const objectStorageService = new ObjectStorageService();
    
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
        requestedPermission: ObjectPermission.READ,
      });
      
      if (!canAccess) {
        return res.sendStatus(401);
      }
      
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Public assets serving
  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
