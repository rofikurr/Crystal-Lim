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
  image: varchar("image", { length: 800 }).notNull(),
  images: json("images").$type<string[]>().notNull().default([]),
  sourceUrl: varchar("source_url", { length: 800 }).notNull().default(""),
  published: boolean("published").notNull().default(true),
  position: int("position").notNull().default(0),
  createdAt: datetime("created_at", { mode: "string" }).notNull(),
  updatedAt: datetime("updated_at", { mode: "string" }).notNull(),
});

export const catalogMeta = mysqlTable("catalog_meta", {
  id: varchar("id", { length: 32 }).primaryKey(),
  seeded: boolean("seeded").notNull().default(false),
});

export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 120 }).notNull(),
  // Kategori sistem (Best Seller): tidak bisa diubah/dihapus lewat UI kategori.
  isSystem: boolean("is_system").notNull().default(false),
  position: int("position").notNull().default(0),
});

export const productCategories = mysqlTable(
  "product_categories",
  {
    productId: varchar("product_id", { length: 64 })
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    categoryId: int("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.productId, table.categoryId] })],
);

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

// --- Checkout: pesanan & pembayaran (Xendit) ---

export const orders = mysqlTable("orders", {
  id: varchar("id", { length: 64 }).primaryKey(),
  customerName: varchar("customer_name", { length: 140 }).notNull(),
  customerEmail: varchar("customer_email", { length: 255 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 32 }).notNull(),
  shippingAddress: text("shipping_address").notNull(),
  notes: varchar("notes", { length: 200 }).notNull().default(""),
  subtotal: int("subtotal").notNull(),
  shippingFee: int("shipping_fee").notNull(),
  total: int("total").notNull(),
  status: mysqlEnum("status", [
    "pending",
    "paid",
    "shipped",
    "completed",
    "cancelled",
    "expired",
  ])
    .notNull()
    .default("pending"),
  xenditInvoiceId: varchar("xendit_invoice_id", { length: 120 }).notNull().default(""),
  xenditInvoiceUrl: varchar("xendit_invoice_url", { length: 800 }).notNull().default(""),
  createdAt: datetime("created_at", { mode: "string" }).notNull(),
  updatedAt: datetime("updated_at", { mode: "string" }).notNull(),
});

export const orderItems = mysqlTable("order_items", {
  id: int("id").autoincrement().primaryKey(),
  orderId: varchar("order_id", { length: 64 })
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: varchar("product_id", { length: 64 }).notNull(),
  productName: varchar("product_name", { length: 140 }).notNull(),
  productImage: varchar("product_image", { length: 800 }).notNull(),
  unitPrice: int("unit_price").notNull(),
  quantity: int("quantity").notNull(),
});

export const settings = mysqlTable("settings", {
  key: varchar("key", { length: 64 }).primaryKey(),
  value: text("value").notNull(),
});

// --- Akun pelanggan: alamat tersimpan & wishlist ---

export const addresses = mysqlTable("addresses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  label: varchar("label", { length: 40 }).notNull(),
  recipientName: varchar("recipient_name", { length: 140 }).notNull(),
  phone: varchar("phone", { length: 32 }).notNull(),
  province: varchar("province", { length: 80 }).notNull(),
  city: varchar("city", { length: 80 }).notNull(),
  district: varchar("district", { length: 80 }).notNull(),
  village: varchar("village", { length: 80 }).notNull(),
  address: text("address").notNull(),
  postal: varchar("postal", { length: 5 }).notNull(),
  isDefault: boolean("is_default").notNull().default(false),
});

export const wishlistItems = mysqlTable(
  "wishlist_items",
  {
    userId: int("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productId: varchar("product_id", { length: 64 }).notNull(),
    createdAt: datetime("created_at", { mode: "string" }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.productId] })],
);
