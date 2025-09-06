import {
  users,
  categories,
  podcasts,
  purchases,
  waitlist,
  podcastParts,
  podcastBundles,
  bundlePodcasts,
  type UpsertUser,
  type User,
  type Category,
  type InsertCategory,
  type Podcast,
  type InsertPodcast,
  type PodcastPart,
  type InsertPodcastPart,
  type PodcastBundle,
  type InsertPodcastBundle,
  type BundlePodcast,
  type InsertBundlePodcast,
  type Purchase,
  type InsertPurchase,
  type Waitlist,
  type InsertWaitlist,
  type PodcastWithCategory,
  type PodcastWithParts,
  type PodcastBundleWithPodcasts,
  type PurchaseWithPodcast,
  type PurchaseWithBundle,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, or, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (supports both Replit Auth and email/password auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, user: Partial<UpsertUser>): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateStripeCustomerId(userId: string, stripeCustomerId: string): Promise<User>;
  updateUserAdminStatus(userId: string, isAdmin: boolean): Promise<User>;

  // Category operations
  getCategories(): Promise<Category[]>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  deleteCategory(id: string): Promise<boolean>;

  // Podcast operations
  getPodcastsByCategory(categoryId: string): Promise<Podcast[]>;
  getPodcastBySlug(slug: string): Promise<PodcastWithCategory | undefined>;
  getPodcast(id: string): Promise<PodcastWithCategory | undefined>;
  getAllPodcasts(): Promise<Podcast[]>;
  createPodcast(podcast: InsertPodcast): Promise<Podcast>;
  updatePodcast(id: string, podcast: Partial<InsertPodcast>): Promise<Podcast | undefined>;
  deletePodcast(id: string): Promise<boolean>;

  // Purchase operations
  createPurchase(purchase: InsertPurchase): Promise<Purchase>;
  getUserPurchases(userId: string): Promise<PurchaseWithPodcast[]>;
  checkUserPurchase(userId: string, podcastId: string): Promise<Purchase | undefined>;
  getPurchasesByUser(userId: string): Promise<Purchase[]>;
  addPodcastToUserLibrary(userId: string, podcastId: string): Promise<Purchase>;
  removePodcastFromUserLibrary(userId: string, podcastId: string): Promise<boolean>;

  // Waitlist operations
  addToWaitlist(waitlistData: InsertWaitlist): Promise<Waitlist>;
  checkWaitlistEntry(email: string, podcastId: string): Promise<boolean>;

  // Podcast parts operations
  createPodcastPart(partData: InsertPodcastPart): Promise<PodcastPart>;
  getPodcastParts(podcastId: string): Promise<PodcastPart[]>;
  deletePodcastPart(id: string): Promise<boolean>;
  getPodcastWithParts(id: string): Promise<PodcastWithParts | undefined>;

  // Podcast bundle operations
  createPodcastBundle(bundleData: InsertPodcastBundle): Promise<PodcastBundle>;
  getAllPodcastBundles(): Promise<PodcastBundle[]>;
  getPodcastBundle(id: string): Promise<PodcastBundle | undefined>;
  getPodcastBundleWithPodcasts(id: string): Promise<PodcastBundleWithPodcasts | undefined>;
  updatePodcastBundle(id: string, bundleData: Partial<InsertPodcastBundle>): Promise<PodcastBundle | undefined>;
  deletePodcastBundle(id: string): Promise<boolean>;
  addPodcastToBundle(bundleId: string, podcastId: string, orderIndex?: number): Promise<BundlePodcast>;
  removePodcastFromBundle(bundleId: string, podcastId: string): Promise<boolean>;

  // Enhanced purchase operations for bundles
  addBundleToUserLibrary(userId: string, bundleId: string): Promise<Purchase>;
  checkUserBundlePurchase(userId: string, bundleId: string): Promise<Purchase | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateStripeCustomerId(userId: string, stripeCustomerId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ stripeCustomerId, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserAdminStatus(userId: string, isAdmin: boolean): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ isAdmin, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(asc(categories.name));
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.slug, slug));
    return category;
  }

  async createCategory(categoryData: InsertCategory): Promise<Category> {
    const [category] = await db
      .insert(categories)
      .values(categoryData)
      .returning();
    return category;
  }

  async deleteCategory(id: string): Promise<boolean> {
    // First check if any podcasts use this category
    const podcastsInCategory = await db
      .select({ count: sql<number>`count(*)` })
      .from(podcasts)
      .where(eq(podcasts.categoryId, id));
    
    if (podcastsInCategory[0]?.count > 0) {
      throw new Error("Cannot delete category with associated podcasts");
    }

    const result = await db
      .delete(categories)
      .where(eq(categories.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getPodcastsByCategory(categoryId: string): Promise<PodcastWithCategory[]> {
    console.log(`[DB] Fetching podcasts for categoryId: ${categoryId}`);
    
    try {
      const results = await db
        .select()
        .from(podcasts)
        .leftJoin(categories, eq(podcasts.categoryId, categories.id))
        .where(and(
          eq(podcasts.categoryId, categoryId), 
          or(eq(podcasts.status, "public"), eq(podcasts.status, "coming_soon"))
        ));

      console.log(`[DB] Raw query results count: ${results.length}`);
      console.log(`[DB] Sample result structure:`, results[0] ? {
        podcastsKeys: Object.keys(results[0].podcasts || {}),
        categoriesKeys: Object.keys(results[0].categories || {})
      } : 'No results');

      const mappedResults = results.map(result => ({
        ...result.podcasts,
        category: result.categories!,
        // imageUrl is not part of PodcastWithCategory type - removed
      }));

      console.log(`[DB] Successfully mapped ${mappedResults.length} podcasts`);
      return mappedResults;
    } catch (error: any) {
      console.error(`[DB] Error in getPodcastsByCategory:`, {
        categoryId,
        message: error.message,
        code: error.code,
        detail: error.detail,
        stack: error.stack
      });
      throw error;
    }
  }

  async getPodcastBySlug(slug: string): Promise<PodcastWithCategory | undefined> {
    const result = await db
      .select()
      .from(podcasts)
      .leftJoin(categories, eq(podcasts.categoryId, categories.id))
      .where(and(
        eq(podcasts.slug, slug), 
        or(eq(podcasts.status, "public"), eq(podcasts.status, "coming_soon"))
      ))
      .limit(1);

    if (result.length === 0) return undefined;

    return {
      ...result[0].podcasts,
      category: result[0].categories!,
    };
  }

  async getPodcast(id: string): Promise<PodcastWithCategory | undefined> {
    const [result] = await db
      .select()
      .from(podcasts)
      .innerJoin(categories, eq(podcasts.categoryId, categories.id))
      .where(eq(podcasts.id, id));

    if (!result) return undefined;

    return {
      ...result.podcasts,
      category: result.categories,
    };
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(asc(users.email));
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUser(id: string, userData: Partial<UpsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getAllPodcasts(): Promise<Podcast[]> {
    console.log("[DB] Fetching all podcasts...");
    
    try {
      const results = await db.select().from(podcasts).orderBy(desc(podcasts.createdAt));
      console.log(`[DB] Successfully fetched ${results.length} podcasts`);
      console.log(`[DB] Sample podcast structure:`, results[0] ? Object.keys(results[0]) : 'No podcasts found');
      return results;
    } catch (error: any) {
      console.error(`[DB] Error in getAllPodcasts:`, {
        message: error.message,
        code: error.code,
        detail: error.detail,
        stack: error.stack
      });
      throw error;
    }
  }

  async createPodcast(podcastData: InsertPodcast): Promise<Podcast> {
    console.log("[DB] Creating podcast with data:", {
      title: podcastData.title,
      categoryId: podcastData.categoryId,
      dataKeys: Object.keys(podcastData)
    });
    
    try {
      const [podcast] = await db
        .insert(podcasts)
        .values(podcastData)
        .returning();
      
      console.log(`[DB] Successfully created podcast: ${podcast.title} (ID: ${podcast.id})`);
      return podcast;
    } catch (error: any) {
      console.error(`[DB] Error in createPodcast:`, {
        podcastData,
        message: error.message,
        code: error.code,
        detail: error.detail,
        stack: error.stack
      });
      throw error;
    }
  }

  async updatePodcast(id: string, podcastData: Partial<InsertPodcast>): Promise<Podcast | undefined> {
    console.log(`[DB UPDATE] Updating podcast ${id} with:`, {
      podcastData,
      hasStatus: 'status' in podcastData,
      statusValue: podcastData.status
    });
    
    const [podcast] = await db
      .update(podcasts)
      .set({ ...podcastData, updatedAt: new Date() })
      .where(eq(podcasts.id, id))
      .returning();
      
    console.log(`[DB UPDATE] After update, podcast status: ${podcast?.status}`);
    return podcast;
  }

  async deletePodcast(id: string): Promise<boolean> {
    const result = await db
      .delete(podcasts)
      .where(eq(podcasts.id, id));
    return (result.rowCount || 0) > 0;
  }

  async createPurchase(purchaseData: InsertPurchase): Promise<Purchase> {
    const [purchase] = await db
      .insert(purchases)
      .values(purchaseData)
      .returning();
    return purchase;
  }

  async addPodcastToUserLibrary(userId: string, podcastId: string): Promise<Purchase> {
    // Get podcast to check price
    const podcast = await this.getPodcast(podcastId);
    if (!podcast) {
      throw new Error("Podcast not found");
    }

    // Check if user already has this podcast
    const existingPurchase = await this.checkUserPurchase(userId, podcastId);
    if (existingPurchase) {
      throw new Error("User already owns this podcast");
    }

    // Create purchase record without payment (admin action)
    const [purchase] = await db
      .insert(purchases)
      .values({
        userId,
        podcastId,
        amount: podcast.price,
        status: "completed",
        stripePaymentIntentId: null, // No payment required for admin action
      })
      .returning();
    
    return purchase;
  }

  async removePodcastFromUserLibrary(userId: string, podcastId: string): Promise<boolean> {
    const result = await db
      .delete(purchases)
      .where(and(eq(purchases.userId, userId), eq(purchases.podcastId, podcastId)));
    return (result.rowCount || 0) > 0;
  }

  async getUserPurchases(userId: string): Promise<PurchaseWithPodcast[]> {
    const results = await db
      .select()
      .from(purchases)
      .innerJoin(podcasts, eq(purchases.podcastId, podcasts.id))
      .innerJoin(categories, eq(podcasts.categoryId, categories.id))
      .where(eq(purchases.userId, userId))
      .orderBy(desc(purchases.purchasedAt));

    return results.map(result => ({
      ...result.purchases,
      podcast: {
        ...result.podcasts,
        category: result.categories,
      },
    }));
  }

  async checkUserPurchase(userId: string, podcastId: string): Promise<Purchase | undefined> {
    const [purchase] = await db
      .select()
      .from(purchases)
      .where(and(eq(purchases.userId, userId), eq(purchases.podcastId, podcastId)));
    return purchase;
  }

  async getPurchasesByUser(userId: string): Promise<Purchase[]> {
    return await db
      .select()
      .from(purchases)
      .where(eq(purchases.userId, userId))
      .orderBy(desc(purchases.purchasedAt));
  }

  async addToWaitlist(waitlistData: InsertWaitlist): Promise<Waitlist> {
    const [entry] = await db
      .insert(waitlist)
      .values(waitlistData)
      .returning();
    return entry;
  }

  async checkWaitlistEntry(email: string, podcastId: string): Promise<boolean> {
    const result = await db
      .select()
      .from(waitlist)
      .where(and(eq(waitlist.email, email), eq(waitlist.podcastId, podcastId)))
      .limit(1);
    return result.length > 0;
  }

  // Seed default admin user
  // Podcast parts functions
  async createPodcastPart(partData: InsertPodcastPart): Promise<PodcastPart> {
    const [part] = await db
      .insert(podcastParts)
      .values(partData)
      .returning();
    return part;
  }

  async getPodcastParts(podcastId: string): Promise<PodcastPart[]> {
    return await db
      .select()
      .from(podcastParts)
      .where(eq(podcastParts.podcastId, podcastId))
      .orderBy(asc(podcastParts.partNumber));
  }

  async deletePodcastPart(id: string): Promise<boolean> {
    const result = await db
      .delete(podcastParts)
      .where(eq(podcastParts.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getPodcastWithParts(id: string): Promise<PodcastWithParts | undefined> {
    const podcast = await this.getPodcast(id);
    if (!podcast) return undefined;

    const parts = await this.getPodcastParts(id);
    return {
      ...podcast,
      parts,
    };
  }

  // Podcast bundle functions
  async createPodcastBundle(bundleData: InsertPodcastBundle): Promise<PodcastBundle> {
    const [bundle] = await db
      .insert(podcastBundles)
      .values(bundleData)
      .returning();
    return bundle;
  }

  async getAllPodcastBundles(): Promise<PodcastBundle[]> {
    return await db
      .select()
      .from(podcastBundles)
      .where(eq(podcastBundles.isActive, true))
      .orderBy(desc(podcastBundles.createdAt));
  }

  async getPodcastBundle(id: string): Promise<PodcastBundle | undefined> {
    const [bundle] = await db
      .select()
      .from(podcastBundles)
      .where(eq(podcastBundles.id, id));
    return bundle;
  }

  async getPodcastBundleWithPodcasts(id: string): Promise<PodcastBundleWithPodcasts | undefined> {
    const bundle = await this.getPodcastBundle(id);
    if (!bundle) return undefined;

    const bundlePodcastsData = await db
      .select()
      .from(bundlePodcasts)
      .innerJoin(podcasts, eq(bundlePodcasts.podcastId, podcasts.id))
      .innerJoin(categories, eq(podcasts.categoryId, categories.id))
      .where(eq(bundlePodcasts.bundleId, id))
      .orderBy(asc(bundlePodcasts.orderIndex));

    return {
      ...bundle,
      bundlePodcasts: bundlePodcastsData.map(result => ({
        ...result.bundle_podcasts,
        podcast: {
          ...result.podcasts,
          category: result.categories,
        },
      })),
    };
  }

  async updatePodcastBundle(id: string, bundleData: Partial<InsertPodcastBundle>): Promise<PodcastBundle | undefined> {
    const [bundle] = await db
      .update(podcastBundles)
      .set({ ...bundleData, updatedAt: new Date() })
      .where(eq(podcastBundles.id, id))
      .returning();
    return bundle;
  }

  async deletePodcastBundle(id: string): Promise<boolean> {
    const result = await db
      .delete(podcastBundles)
      .where(eq(podcastBundles.id, id));
    return (result.rowCount || 0) > 0;
  }

  async addPodcastToBundle(bundleId: string, podcastId: string, orderIndex: number = 0): Promise<BundlePodcast> {
    const [bundlePodcast] = await db
      .insert(bundlePodcasts)
      .values({
        bundleId,
        podcastId,
        orderIndex,
      })
      .returning();
    return bundlePodcast;
  }

  async removePodcastFromBundle(bundleId: string, podcastId: string): Promise<boolean> {
    const result = await db
      .delete(bundlePodcasts)
      .where(and(eq(bundlePodcasts.bundleId, bundleId), eq(bundlePodcasts.podcastId, podcastId)));
    return (result.rowCount || 0) > 0;
  }

  // Enhanced purchase functions for bundles
  async addBundleToUserLibrary(userId: string, bundleId: string): Promise<Purchase> {
    const bundle = await this.getPodcastBundle(bundleId);
    if (!bundle) {
      throw new Error("Bundle not found");
    }

    // Check if user already has this bundle
    const existingPurchase = await this.checkUserBundlePurchase(userId, bundleId);
    if (existingPurchase) {
      throw new Error("User already owns this bundle");
    }

    const [purchase] = await db
      .insert(purchases)
      .values({
        userId,
        bundleId,
        amount: bundle.price,
        status: "completed",
        stripePaymentIntentId: null,
      })
      .returning();
    
    return purchase;
  }

  async checkUserBundlePurchase(userId: string, bundleId: string): Promise<Purchase | undefined> {
    const [purchase] = await db
      .select()
      .from(purchases)
      .where(and(eq(purchases.userId, userId), eq(purchases.bundleId, bundleId)));
    return purchase;
  }

  async seedDefaultAdmin(): Promise<void> {
    const adminEmail = "admin@admin.com";
    const adminPassword = "admin@admin.com"; // Same as email as requested
    
    // Check if admin already exists
    const existingAdmin = await this.getUserByEmail(adminEmail);
    if (existingAdmin) {
      console.log("[SEED] Default admin user already exists");
      return;
    }

    try {
      // Import bcrypt here to avoid circular dependencies
      const bcrypt = await import('bcrypt');
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      await this.createUser({
        email: adminEmail,
        passwordHash: hashedPassword,
        firstName: "Admin",
        lastName: "User",
        isAdmin: true
      });
      
      console.log("[SEED] Default admin user created successfully");
      console.log("[SEED] Email: admin@admin.com");
      console.log("[SEED] Password: admin@admin.com");
    } catch (error) {
      console.error("[SEED] Error creating default admin user:", error);
    }
  }
}

export const storage = new DatabaseStorage();