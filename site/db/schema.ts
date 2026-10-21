import {
  boolean,
  datetime,
  index,
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
  // Default tinggi (bukan 0) supaya produk lama yang belum pernah di-set stoknya
  // tidak langsung tampil "habis" begitu kolom ini ditambahkan.
  stock: int("stock").notNull().default(9999),
  // Gram. netWeight = produk saja; packedWeight = produk + dus/bubble wrap —
  // packedWeight yang dipakai hitung ongkir (itu yang ditimbang kurir).
  // Default 500 cuma placeholder aman untuk produk lama, bukan nilai akurat.
  netWeight: int("net_weight").notNull().default(500),
  packedWeight: int("packed_weight").notNull().default(500),
  // Sentimeter. Dipakai hitung berat volumetrik (P×L×T/5000, standar JNE) —
  // kurir menagih berdasarkan MANA YANG LEBIH BESAR antara berat aktual vs
  // volumetrik, supaya barang besar-tapi-ringan tidak salah dapat ongkir
  // murah dan toko tidak rugi selisih ke kurir. Default dus kado kecil wajar.
  netLength: int("net_length").notNull().default(10),
  netWidth: int("net_width").notNull().default(10),
  netHeight: int("net_height").notNull().default(5),
  packedLength: int("packed_length").notNull().default(15),
  packedWidth: int("packed_width").notNull().default(10),
  packedHeight: int("packed_height").notNull().default(8),
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

export const orders = mysqlTable(
  "orders",
  {
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
    // Diisi manual oleh admin setelah serah terima paket ke kurir — tidak ada
    // resi otomatis (akun RajaOngkir Starter tidak kasih fitur buat resi).
    trackingNumber: varchar("tracking_number", { length: 80 }).notNull().default(""),
    createdAt: datetime("created_at", { mode: "string" }).notNull(),
    updatedAt: datetime("updated_at", { mode: "string" }).notNull(),
  },
  (table) => [index("orders_customer_idx").on(table.customerEmail, table.customerPhone)],
);

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

// --- Broadcast email (newsletter, dikirim lewat SMTP sendiri) ---

export const newsletterSubscribers = mysqlTable("newsletter_subscribers", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  unsubscribeToken: varchar("unsubscribe_token", { length: 64 }).notNull().unique(),
  subscribedAt: datetime("subscribed_at", { mode: "string" }).notNull(),
  unsubscribedAt: datetime("unsubscribed_at", { mode: "string" }),
});

export const broadcasts = mysqlTable("broadcasts", {
  id: int("id").autoincrement().primaryKey(),
  subject: varchar("subject", { length: 200 }).notNull(),
  body: text("body").notNull(),
  recipientCount: int("recipient_count").notNull().default(0),
  failedCount: int("failed_count").notNull().default(0),
  createdAt: datetime("created_at", { mode: "string" }).notNull(),
});
