import {
  users,
  categories,
  podcasts,
  purchases,
  waitlist,
  type UpsertUser,
  type User,
  type Category,
  type InsertCategory,
  type Podcast,
  type InsertPodcast,
  type Purchase,
  type InsertPurchase,
  type Waitlist,
  type InsertWaitlist,
  type PodcastWithCategory,
  type PurchaseWithPodcast,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc } from "drizzle-orm";

export interface IStorage {
  // User operations (supports both Replit Auth and email/password auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, user: Partial<UpsertUser>): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateStripeCustomerId(userId: string, stripeCustomerId: string): Promise<User>;
  updateUserAdminStatus(userId: string, isAdmin: boolean): Promise<User>;

  // Category operations
  getCategories(): Promise<Category[]>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;

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

  // Waitlist operations
  addToWaitlist(waitlistData: InsertWaitlist): Promise<Waitlist>;
  checkWaitlistEntry(email: string, podcastId: string): Promise<boolean>;
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

  async getPodcastsByCategory(categoryId: string): Promise<PodcastWithCategory[]> {
    console.log(`[DB] Fetching podcasts for categoryId: ${categoryId}`);
    
    try {
      const results = await db
        .select()
        .from(podcasts)
        .leftJoin(categories, eq(podcasts.categoryId, categories.id))
        .where(and(
          eq(podcasts.categoryId, categoryId), 
          eq(podcasts.isActive, true),
          eq(podcasts.status, "public")
        ));

      console.log(`[DB] Raw query results count: ${results.length}`);
      console.log(`[DB] Sample result structure:`, results[0] ? {
        podcastsKeys: Object.keys(results[0].podcasts || {}),
        categoriesKeys: Object.keys(results[0].categories || {})
      } : 'No results');

      const mappedResults = results.map(result => ({
        ...result.podcasts,
        category: result.categories!,
        imageUrl: result.podcasts.imageObjectPath ? `/public-objects/${result.podcasts.imageObjectPath}` : null,
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

  async getPodcastBySlug(slug: string): Promise<PodcastWithCategory | null> {
    const result = await db
      .select()
      .from(podcasts)
      .leftJoin(categories, eq(podcasts.categoryId, categories.id))
      .where(and(eq(podcasts.slug, slug), eq(podcasts.isActive, true)))
      .limit(1);

    if (result.length === 0) return null;

    return {
      ...result[0].podcasts,
      category: result[0].categories!,
      imageUrl: result[0].podcasts.imageObjectPath ? `/public-objects/${result[0].podcasts.imageObjectPath}` : null,
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
}

export const storage = new DatabaseStorage();