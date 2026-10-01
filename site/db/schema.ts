import {
  boolean,
  datetime,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  primaryKey,
  varchar,
  text,
} from "drizzle-orm/mysql-core";

export const products = mysqlTable("products", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 140 }).notNull(),
  description: text("description").notNull(),
  price: int("price").notNull(),
  category: varchar("category", { length: 32 }).notNull(),
  image: varchar("image", { length: 800 }).notNull(),
  images: json("images").$type<string[]>().notNull().default([]),
  sourceUrl: varchar("source_url", { length: 800 }).notNull().default(""),
  bestSeller: boolean("best_seller").notNull().default(false),
  published: boolean("published").notNull().default(true),
  position: int("position").notNull().default(0),
  createdAt: datetime("created_at", { mode: "string" }).notNull(),
  updatedAt: datetime("updated_at", { mode: "string" }).notNull(),
});

export const catalogMeta = mysqlTable("catalog_meta", {
  id: varchar("id", { length: 32 }).primaryKey(),
  seeded: boolean("seeded").notNull().default(false),
});

// --- RBAC: role & permission dinamis ---

export const roles = mysqlTable("roles", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 120 }).notNull(),
  // Role sistem (superadmin): implicit full-access, tidak bisa dihapus/diubah permission-nya.
  isSystem: boolean("is_system").notNull().default(false),
  createdAt: datetime("created_at", { mode: "string" }).notNull(),
});

export const permissions = mysqlTable("permissions", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 96 }).notNull().unique(),
  label: varchar("label", { length: 160 }).notNull(),
  group: varchar("group", { length: 64 }).notNull(),
});

export const rolePermissions = mysqlTable(
  "role_permissions",
  {
    roleId: int("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permissionId: int("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.roleId, table.permissionId] })],
);

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 140 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  phone: varchar("phone", { length: 32 }),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  roleId: int("role_id")
    .notNull()
    .references(() => roles.id),
  status: mysqlEnum("status", ["active", "suspended"]).notNull().default("active"),
  createdAt: datetime("created_at", { mode: "string" }).notNull(),
  updatedAt: datetime("updated_at", { mode: "string" }).notNull(),
});
