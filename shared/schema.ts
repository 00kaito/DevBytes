import { sql, relations } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
// export const sessions = pgTable(
//   "sessions",
//   {
//     sid: varchar("sid").primaryKey(),
//     sess: jsonb("sess").notNull(),
//     expire: timestamp("expire").notNull(),
//   },
//   (table) => [index("IDX_session_expire").on(table.expire)],
// );

// User storage table with email/password authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  passwordHash: varchar("password_hash").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  stripeCustomerId: varchar("stripe_customer_id"),
  isAdmin: boolean("is_admin").default(false),
  isEmailVerified: boolean("is_email_verified").default(false),
  emailVerificationToken: varchar("email_verification_token"),
  emailVerificationExpires: timestamp("email_verification_expires"),
  passwordResetToken: varchar("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Podcast categories
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  icon: varchar("icon", { length: 100 }),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Individual podcasts/episodes
export const podcasts = pgTable("podcasts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  description: text("description"),
  duration: integer("duration"), // in minutes
  price: integer("price").notNull(), // in cents (Polish grosze)
  categoryId: varchar("category_id").notNull().references(() => categories.id),
  audioObjectPath: varchar("audio_object_path"), // path to audio file in object storage
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User purchases
export const purchases = pgTable("purchases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  podcastId: varchar("podcast_id").notNull().references(() => podcasts.id),
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  amount: integer("amount").notNull(), // amount paid in cents
  status: varchar("status", { length: 50 }).notNull().default("completed"),
  purchasedAt: timestamp("purchased_at").defaultNow(),
});

// Relations
export const categoriesRelations = relations(categories, ({ many }) => ({
  podcasts: many(podcasts),
}));

export const podcastsRelations = relations(podcasts, ({ one, many }) => ({
  category: one(categories, {
    fields: [podcasts.categoryId],
    references: [categories.id],
  }),
  purchases: many(purchases),
}));

export const usersRelations = relations(users, ({ many }) => ({
  purchases: many(purchases),
}));

export const purchasesRelations = relations(purchases, ({ one }) => ({
  user: one(users, {
    fields: [purchases.userId],
    references: [users.id],
  }),
  podcast: one(podcasts, {
    fields: [purchases.podcastId],
    references: [podcasts.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
});

// Registration schema for new users
export const registerUserSchema = z.object({
  email: z.string().email("Podaj prawidłowy adres email"),
  password: z.string().min(8, "Hasło musi mieć co najmniej 8 znaków"),
  firstName: z.string().min(2, "Imię musi mieć co najmniej 2 znaki"),
  lastName: z.string().min(2, "Nazwisko musi mieć co najmniej 2 znaki"),
});

// Login schema
export const loginUserSchema = z.object({
  email: z.string().email("Podaj prawidłowy adres email"),
  password: z.string().min(1, "Hasło jest wymagane"),
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export const insertPodcastSchema = createInsertSchema(podcasts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPurchaseSchema = createInsertSchema(purchases).omit({
  id: true,
  purchasedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type RegisterUser = z.infer<typeof registerUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Podcast = typeof podcasts.$inferSelect;
export type InsertPodcast = z.infer<typeof insertPodcastSchema>;
export type Purchase = typeof purchases.$inferSelect;
export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;

// Extended types with relations
export type PodcastWithCategory = Podcast & {
  category: Category;
};

export type PurchaseWithPodcast = Purchase & {
  podcast: PodcastWithCategory;
};
