import type { Express, Request } from "express";
import { createServer, type Server } from "http";

// Extend the session interface to include userId
declare module 'express-session' {
  interface SessionData {
    userId?: string;
  }
}
import Stripe from "stripe";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { AuthService } from "./authService";
import { sendPasswordReset } from "./emailService";
import {
  ObjectStorageService,
  ObjectNotFoundError,
} from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import { 
  insertPurchaseSchema, 
  registerUserSchema, 
  loginUserSchema,
  type RegisterUser,
  type LoginUser 
} from "@shared/schema";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-07-30.basil",
});

// Middleware for checking if user is authenticated
const isAuthenticated = (req: any, res: any, next: any) => {
  if (req.session?.userId) {
    next();
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
};

// Middleware for checking if user is admin
const isAdmin = async (req: any, res: any, next: any) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const user = await storage.getUser(req.session.userId);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    next();
  } catch (error) {
    console.error("Error checking admin status:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Session setup
  const PostgresSessionStore = connectPg(session);
  const sessionStore = new PostgresSessionStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false, // Don't try to create table, it already exists
  });

  app.set("trust proxy", 1);
  app.use(
    session({
      store: sessionStore,
      secret: process.env.SESSION_SECRET || "dev-secret-change-in-production",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false, // Set to true in production with HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    })
  );

  // Registration endpoint
  app.post('/api/register', async (req, res) => {
    try {
      const validatedData: RegisterUser = registerUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Użytkownik z tym emailem już istnieje" });
      }

      // Hash password
      const passwordHash = await AuthService.hashPassword(validatedData.password);

      // Create user with verified email
      const user = await storage.createUser({
        email: validatedData.email,
        passwordHash,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        emailVerificationToken: null,
        emailVerificationExpires: null,
        isEmailVerified: true,
      });

      res.status(201).json({ 
        message: "Konto zostało utworzone pomyślnie. Możesz się teraz zalogować.",
        userId: user.id
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          message: "Nieprawidłowe dane", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Błąd podczas rejestracji" });
    }
  });

  // Logout endpoint
  app.post('/api/logout', (req: any, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Błąd podczas wylogowania" });
      }
      res.clearCookie('connect.sid');
      res.json({ message: "Wylogowano pomyślnie" });
    });
  });

  // Login endpoint
  app.post('/api/login', async (req, res) => {
    try {
      const validatedData: LoginUser = loginUserSchema.parse(req.body);
      
      // Find user by email
      const user = await storage.getUserByEmail(validatedData.email);
      if (!user) {
        return res.status(401).json({ message: "Nieprawidłowy email lub hasło" });
      }

      // Verify password
      const passwordValid = await AuthService.verifyPassword(validatedData.password, user.passwordHash!);
      if (!passwordValid) {
        return res.status(401).json({ message: "Nieprawidłowy email lub hasło" });
      }

      // Create session
      req.session.userId = user.id;
      
      // Return user data (without password hash)
      const { passwordHash, emailVerificationToken, passwordResetToken, ...userResponse } = user;
      res.json(userResponse);
    } catch (error: any) {
      console.error("Login error:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          message: "Nieprawidłowe dane", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Błąd podczas logowania" });
    }
  });

  // Logout endpoint
  app.post('/api/logout', (req: any, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Błąd podczas wylogowywania" });
      }
      res.clearCookie('connect.sid');
      res.json({ message: "Wylogowano pomyślnie" });
    });
  });

  // Get current user endpoint
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "Użytkownik nie znaleziony" });
      }
      
      // Return user data (without sensitive fields)
      const { passwordHash, emailVerificationToken, passwordResetToken, ...userResponse } = user;
      res.json(userResponse);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Błąd podczas pobierania danych użytkownika" });
    }
  });


  // Password reset request endpoint
  app.post('/api/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email jest wymagany" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if email exists
        return res.json({ 
          message: "Jeśli email istnieje w naszej bazie, wysłaliśmy link resetowania hasła." 
        });
      }

      const { token: resetToken, expires: resetExpires } = AuthService.generatePasswordResetToken();
      
      // Update user with reset token
      await storage.updateUser(user.id, {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      });

      // Send reset email
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const emailSent = await sendPasswordReset({
        to: user.email!,
        firstName: user.firstName || 'Użytkowniku',
        resetToken,
        baseUrl,
      });

      if (!emailSent) {
        console.error('Failed to send password reset email');
      }

      res.json({ 
        message: "Jeśli email istnieje w naszej bazie, wysłaliśmy link resetowania hasła." 
      });
    } catch (error) {
      console.error("Password reset request error:", error);
      res.status(500).json({ message: "Błąd podczas wysyłania emaila resetowania hasła" });
    }
  });

  // Password reset endpoint
  app.post('/api/reset-password', async (req, res) => {
    try {
      const { token, password } = req.body;
      if (!token || !password) {
        return res.status(400).json({ message: "Token i nowe hasło są wymagane" });
      }

      if (password.length < 8) {
        return res.status(400).json({ message: "Hasło musi mieć co najmniej 8 znaków" });
      }

      const result = await AuthService.resetPassword(token, password);
      if (result.success) {
        res.json({ message: result.message });
      } else {
        res.status(400).json({ message: result.message });
      }
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({ message: "Błąd podczas resetowania hasła" });
    }
  });

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

  // Admin routes (protected)
  app.get("/api/admin/podcasts", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const podcasts = await storage.getAllPodcasts();
      res.json(podcasts);
    } catch (error) {
      console.error("Error fetching admin podcasts:", error);
      res.status(500).json({ message: "Failed to fetch podcasts" });
    }
  });

  app.post("/api/admin/podcasts", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const podcast = await storage.createPodcast(req.body);
      res.status(201).json(podcast);
    } catch (error) {
      console.error("Error creating podcast:", error);
      res.status(500).json({ message: "Failed to create podcast" });
    }
  });

  app.put("/api/admin/podcasts/:id", isAuthenticated, isAdmin, async (req, res) => {
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

  app.delete("/api/admin/podcasts/:id", isAuthenticated, isAdmin, async (req, res) => {
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
      const userId = req.session.userId;

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
      const userId = req.session.userId;
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
      const userId = req.session.userId;
      const purchases = await storage.getUserPurchases(userId);
      res.json(purchases);
    } catch (error) {
      console.error("Error fetching user purchases:", error);
      res.status(500).json({ message: "Failed to fetch purchases" });
    }
  });

  // Protected audio file serving
  app.get("/objects/:objectPath(*)", isAuthenticated, async (req: any, res) => {
    const userId = req.session.userId;
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