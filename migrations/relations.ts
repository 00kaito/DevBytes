import { relations } from "drizzle-orm/relations";
import { categories, podcasts, users, purchases } from "./schema";

export const podcastsRelations = relations(podcasts, ({one, many}) => ({
	category: one(categories, {
		fields: [podcasts.categoryId],
		references: [categories.id]
	}),
	purchases: many(purchases),
}));

export const categoriesRelations = relations(categories, ({many}) => ({
	podcasts: many(podcasts),
}));

export const purchasesRelations = relations(purchases, ({one}) => ({
	user: one(users, {
		fields: [purchases.userId],
		references: [users.id]
	}),
	podcast: one(podcasts, {
		fields: [purchases.podcastId],
		references: [podcasts.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	purchases: many(purchases),
}));