import { pgTable, index, varchar, jsonb, timestamp, unique, text, foreignKey, integer, boolean } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const sessions = pgTable("sessions", {
	sid: varchar().primaryKey().notNull(),
	sess: jsonb().notNull(),
	expire: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	index("IDX_session_expire").using("btree", table.expire.asc().nullsLast().op("timestamp_ops")),
]);

export const categories = pgTable("categories", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	slug: varchar({ length: 100 }).notNull(),
	icon: varchar({ length: 100 }),
	description: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("categories_slug_unique").on(table.slug),
]);

export const podcasts = pgTable("podcasts", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	title: varchar({ length: 200 }).notNull(),
	slug: varchar({ length: 200 }).notNull(),
	description: text(),
	duration: integer(),
	price: integer().notNull(),
	categoryId: varchar("category_id").notNull(),
	audioObjectPath: varchar("audio_object_path"),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [categories.id],
			name: "podcasts_category_id_categories_id_fk"
		}),
	unique("podcasts_slug_unique").on(table.slug),
]);

export const users = pgTable("users", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	email: varchar().notNull(),
	passwordHash: varchar("password_hash").notNull(),
	firstName: varchar("first_name"),
	lastName: varchar("last_name"),
	profileImageUrl: varchar("profile_image_url"),
	stripeCustomerId: varchar("stripe_customer_id"),
	isAdmin: boolean("is_admin").default(false),
	isEmailVerified: boolean("is_email_verified").default(false),
	emailVerificationToken: varchar("email_verification_token"),
	emailVerificationExpires: timestamp("email_verification_expires", { mode: 'string' }),
	passwordResetToken: varchar("password_reset_token"),
	passwordResetExpires: timestamp("password_reset_expires", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("users_email_unique").on(table.email),
]);

export const purchases = pgTable("purchases", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	podcastId: varchar("podcast_id").notNull(),
	stripePaymentIntentId: varchar("stripe_payment_intent_id"),
	amount: integer().notNull(),
	status: varchar({ length: 50 }).default('completed').notNull(),
	purchasedAt: timestamp("purchased_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "purchases_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.podcastId],
			foreignColumns: [podcasts.id],
			name: "purchases_podcast_id_podcasts_id_fk"
		}),
]);
