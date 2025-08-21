import {
  users,
  categories,
  podcasts,
  purchases,
  type User,
  type UpsertUser,
  type Category,
  type InsertCategory,
  type Podcast,
  type InsertPodcast,
  type Purchase,
  type InsertPurchase,
  type PodcastWithCategory,
  type PurchaseWithPodcast,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
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

  async getPodcastsByCategory(categoryId: string): Promise<Podcast[]> {
    return await db
      .select()
      .from(podcasts)
      .where(and(eq(podcasts.categoryId, categoryId), eq(podcasts.isActive, true)))
      .orderBy(asc(podcasts.title));
  }

  async getPodcastBySlug(slug: string): Promise<PodcastWithCategory | undefined> {
    const [result] = await db
      .select()
      .from(podcasts)
      .innerJoin(categories, eq(podcasts.categoryId, categories.id))
      .where(eq(podcasts.slug, slug));
    
    if (!result) return undefined;
    
    return {
      ...result.podcasts,
      category: result.categories,
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
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async getAllPodcasts(): Promise<Podcast[]> {
    return await db.select().from(podcasts).orderBy(desc(podcasts.createdAt));
  }

  async createPodcast(podcastData: InsertPodcast): Promise<Podcast> {
    const [podcast] = await db
      .insert(podcasts)
      .values(podcastData)
      .returning();
    return podcast;
  }

  async updatePodcast(id: string, podcastData: Partial<InsertPodcast>): Promise<Podcast | undefined> {
    const [podcast] = await db
      .update(podcasts)
      .set({ ...podcastData, updatedAt: new Date() })
      .where(eq(podcasts.id, id))
      .returning();
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
}

export const storage = new DatabaseStorage();
