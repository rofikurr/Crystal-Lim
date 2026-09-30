import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  price: integer("price").notNull(),
  category: text("category").notNull(),
  image: text("image").notNull(),
  images: text("images").notNull().default("[]"),
  sourceUrl: text("source_url").notNull().default(""),
  bestSeller: integer("best_seller", { mode: "boolean" }).notNull().default(false),
  published: integer("published", { mode: "boolean" }).notNull().default(true),
  position: integer("position").notNull().default(0),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const catalogMeta = sqliteTable("catalog_meta", {
  id: text("id").primaryKey(),
  seeded: integer("seeded", { mode: "boolean" }).notNull().default(false),
});
