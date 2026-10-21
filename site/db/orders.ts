import { and, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { db } from "./index";
import { categories, orderItems, orders, productCategories } from "./schema";
import { decrementStock, listProducts, restoreStock } from "./catalog";
import { nowForDb } from "../lib/db-time";

export type OrderStatus = (typeof orders.$inferSelect)["status"];

export type OrderItem = {
  productId: string;
  productName: string;
  productImage: string;
  unitPrice: number;
  quantity: number;
};

export type Order = {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  notes: string;
  subtotal: number;
  shippingFee: number;
  total: number;
  status: OrderStatus;
  xenditInvoiceId: string;
  xenditInvoiceUrl: string;
  trackingNumber: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
};

export class CheckoutError extends Error {}

export async function listOrders(): Promise<Order[]> {
  const orderRows = await db.select().from(orders).orderBy(desc(orders.createdAt));
  if (orderRows.length === 0) return [];
  const itemRows = await db
    .select()
    .from(orderItems)
    .where(inArray(orderItems.orderId, orderRows.map((o) => o.id)));
  const itemsByOrder = new Map<string, OrderItem[]>();
  for (const row of itemRows) {
    const list = itemsByOrder.get(row.orderId) ?? [];
    list.push({
      productId: row.productId,
      productName: row.productName,
      productImage: row.productImage,
      unitPrice: row.unitPrice,
      quantity: row.quantity,
    });
    itemsByOrder.set(row.orderId, list);
  }
  return orderRows.map((row) => ({ ...row, items: itemsByOrder.get(row.id) ?? [] }));
}

export async function listOrdersForCustomer(email: string, phone: string): Promise<Order[]> {
  const orderRows = await db
    .select()
    .from(orders)
    .where(and(eq(orders.customerEmail, email), eq(orders.customerPhone, phone)))
    .orderBy(desc(orders.createdAt));
  if (orderRows.length === 0) return [];
  const itemRows = await db
    .select()
    .from(orderItems)
    .where(inArray(orderItems.orderId, orderRows.map((o) => o.id)));
  const itemsByOrder = new Map<string, OrderItem[]>();
  for (const row of itemRows) {
    const list = itemsByOrder.get(row.orderId) ?? [];
    list.push({
      productId: row.productId,
      productName: row.productName,
      productImage: row.productImage,
      unitPrice: row.unitPrice,
      quantity: row.quantity,
    });
    itemsByOrder.set(row.orderId, list);
  }
  return orderRows.map((row) => ({ ...row, items: itemsByOrder.get(row.id) ?? [] }));
}

export async function getOrder(id: string): Promise<Order | null> {
  const [row] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!row) return null;
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
  return {
    ...row,
    items: items.map((row2) => ({
      productId: row2.productId,
      productName: row2.productName,
      productImage: row2.productImage,
      unitPrice: row2.unitPrice,
      quantity: row2.quantity,
    })),
  };
}

export async function createOrder(input: {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  notes: string;
  items: { productId: string; quantity: number }[];
  shippingFee: number;
}): Promise<Order> {
  if (input.items.length === 0) throw new CheckoutError("Keranjang kosong.");
  const catalog = await listProducts();
  const byId = new Map(catalog.map((p) => [p.id, p]));
  const items: OrderItem[] = [];
  for (const { productId, quantity } of input.items) {
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
      throw new CheckoutError("Jumlah produk tidak valid.");
    }
    const product = byId.get(productId);
    if (!product) throw new CheckoutError("Salah satu produk sudah tidak tersedia.");
    items.push({
      productId: product.id,
      productName: product.name,
      productImage: product.image,
      unitPrice: product.price,
      quantity,
    });
  }
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const shippingFee = input.shippingFee;
  const total = subtotal + shippingFee;
  const now = nowForDb();
  const id = `pesanan-${crypto.randomUUID()}`;

  await db.transaction(async (tx) => {
    for (const item of items) {
      const ok = await decrementStock(tx, item.productId, item.quantity);
      if (!ok) {
        throw new CheckoutError(`Stok ${item.productName} tidak cukup. Kurangi jumlahnya dulu.`);
      }
    }
    await tx.insert(orders).values({
      id,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone,
      shippingAddress: input.shippingAddress,
      notes: input.notes,
      subtotal,
      shippingFee,
      total,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });
    await tx.insert(orderItems).values(
      items.map((item) => ({
        orderId: id,
        productId: item.productId,
        productName: item.productName,
        productImage: item.productImage,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
      })),
    );
  });

  return {
    id,
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    customerPhone: input.customerPhone,
    shippingAddress: input.shippingAddress,
    notes: input.notes,
    subtotal,
    shippingFee,
    total,
    status: "pending",
    xenditInvoiceId: "",
    xenditInvoiceUrl: "",
    trackingNumber: "",
    createdAt: now,
    updatedAt: now,
    items,
  };
}

export async function setOrderInvoice(id: string, invoice: { invoiceId: string; invoiceUrl: string }) {
  await db
    .update(orders)
    .set({
      xenditInvoiceId: invoice.invoiceId,
      xenditInvoiceUrl: invoice.invoiceUrl,
      updatedAt: nowForDb(),
    })
    .where(eq(orders.id, id));
}

export async function setTrackingNumber(id: string, trackingNumber: string): Promise<void> {
  const result = await db
    .update(orders)
    .set({ trackingNumber, updatedAt: nowForDb() })
    .where(eq(orders.id, id));
  if (result[0].affectedRows === 0) throw new Error("Pesanan tidak ditemukan.");
}

const STOCK_RESTORED_STATUSES: OrderStatus[] = ["cancelled", "expired"];

const REVENUE_STATUSES: OrderStatus[] = ["paid", "shipped", "completed"];

function toDbDateTime(date: Date): string {
  return date.toISOString().replace("T", " ").replace(/\.\d+Z$/, "");
}

export type DailyRevenuePoint = { date: string; revenue: number; orderCount: number };

/** Pendapatan (status lunas ke atas) per hari, `days` hari terakhir sampai hari ini, urut kronologis. */
export async function getDailyRevenue(days: number): Promise<DailyRevenuePoint[]> {
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCDate(since.getUTCDate() - (days - 1));

  const rows = await db
    .select({ createdAt: orders.createdAt, total: orders.total })
    .from(orders)
    .where(and(inArray(orders.status, REVENUE_STATUSES), gte(orders.createdAt, toDbDateTime(since))));

  const byDay = new Map<string, { revenue: number; orderCount: number }>();
  for (const row of rows) {
    const day = row.createdAt.slice(0, 10);
    const entry = byDay.get(day) ?? { revenue: 0, orderCount: 0 };
    entry.revenue += row.total;
    entry.orderCount += 1;
    byDay.set(day, entry);
  }

  const points: DailyRevenuePoint[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setUTCDate(since.getUTCDate() + i);
    const key = d.toISOString().slice(0, 10);
    const entry = byDay.get(key);
    points.push({ date: key, revenue: entry?.revenue ?? 0, orderCount: entry?.orderCount ?? 0 });
  }
  return points;
}

export type TopProductPoint = { productId: string; productName: string; quantity: number; revenue: number };

/** Produk terlaris (berdasar qty) dari pesanan berstatus lunas ke atas dalam `days` hari terakhir. */
export async function getTopProducts(days: number, limit = 5): Promise<TopProductPoint[]> {
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCDate(since.getUTCDate() - (days - 1));

  const rows = await db
    .select({
      productId: orderItems.productId,
      productName: orderItems.productName,
      quantity: orderItems.quantity,
      unitPrice: orderItems.unitPrice,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(and(inArray(orders.status, REVENUE_STATUSES), gte(orders.createdAt, toDbDateTime(since))));

  const byProduct = new Map<string, TopProductPoint>();
  for (const row of rows) {
    const entry = byProduct.get(row.productId) ?? {
      productId: row.productId,
      productName: row.productName,
      quantity: 0,
      revenue: 0,
    };
    entry.quantity += row.quantity;
    entry.revenue += row.quantity * row.unitPrice;
    byProduct.set(row.productId, entry);
  }
  return [...byProduct.values()].sort((a, b) => b.quantity - a.quantity).slice(0, limit);
}

async function attachOrderItems(orderRows: (typeof orders.$inferSelect)[]): Promise<Order[]> {
  if (orderRows.length === 0) return [];
  const itemRows = await db
    .select()
    .from(orderItems)
    .where(inArray(orderItems.orderId, orderRows.map((o) => o.id)));
  const itemsByOrder = new Map<string, OrderItem[]>();
  for (const row of itemRows) {
    const list = itemsByOrder.get(row.orderId) ?? [];
    list.push({
      productId: row.productId,
      productName: row.productName,
      productImage: row.productImage,
      unitPrice: row.unitPrice,
      quantity: row.quantity,
    });
    itemsByOrder.set(row.orderId, list);
  }
  return orderRows.map((row) => ({ ...row, items: itemsByOrder.get(row.id) ?? [] }));
}

function revenueRangeWhere(from: Date, to: Date) {
  return and(
    inArray(orders.status, REVENUE_STATUSES),
    gte(orders.createdAt, toDbDateTime(from)),
    lte(orders.createdAt, toDbDateTime(to)),
  );
}

export type RevenueSummary = {
  revenue: number;
  orderCount: number;
  averageOrderValue: number;
  previousRevenue: number;
  previousOrderCount: number;
};

/** Ringkasan pendapatan untuk rentang [from, to], dibandingkan rentang sebelumnya dengan panjang yang sama. */
export async function getRevenueSummary(from: Date, to: Date): Promise<RevenueSummary> {
  const spanMs = to.getTime() - from.getTime();
  const previousTo = new Date(from.getTime() - 1000);
  const previousFrom = new Date(previousTo.getTime() - spanMs);

  const [current, previous] = await Promise.all([
    db.select({ total: orders.total }).from(orders).where(revenueRangeWhere(from, to)),
    db.select({ total: orders.total }).from(orders).where(revenueRangeWhere(previousFrom, previousTo)),
  ]);

  const revenue = current.reduce((sum, row) => sum + row.total, 0);
  const orderCount = current.length;
  const previousRevenue = previous.reduce((sum, row) => sum + row.total, 0);
  return {
    revenue,
    orderCount,
    averageOrderValue: orderCount > 0 ? Math.round(revenue / orderCount) : 0,
    previousRevenue,
    previousOrderCount: previous.length,
  };
}

/** Pendapatan harian untuk rentang [from, to] bebas (bukan cuma N hari terakhir seperti getDailyRevenue). */
export async function getRevenueTimeSeries(from: Date, to: Date): Promise<DailyRevenuePoint[]> {
  const rows = await db
    .select({ createdAt: orders.createdAt, total: orders.total })
    .from(orders)
    .where(revenueRangeWhere(from, to));

  const byDay = new Map<string, { revenue: number; orderCount: number }>();
  for (const row of rows) {
    const day = row.createdAt.slice(0, 10);
    const entry = byDay.get(day) ?? { revenue: 0, orderCount: 0 };
    entry.revenue += row.total;
    entry.orderCount += 1;
    byDay.set(day, entry);
  }

  const points: DailyRevenuePoint[] = [];
  const cursor = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  const endDay = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()));
  while (cursor.getTime() <= endDay.getTime()) {
    const key = cursor.toISOString().slice(0, 10);
    const entry = byDay.get(key);
    points.push({ date: key, revenue: entry?.revenue ?? 0, orderCount: entry?.orderCount ?? 0 });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return points;
}

export type CategoryRevenuePoint = { categoryId: number; categoryName: string; quantity: number; revenue: number };

/** Breakdown pendapatan per kategori produk (kategori sistem seperti Best Seller tidak dihitung). */
export async function getRevenueByCategory(from: Date, to: Date): Promise<CategoryRevenuePoint[]> {
  const rows = await db
    .select({
      categoryId: categories.id,
      categoryName: categories.name,
      quantity: orderItems.quantity,
      unitPrice: orderItems.unitPrice,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .innerJoin(productCategories, eq(productCategories.productId, orderItems.productId))
    .innerJoin(categories, eq(categories.id, productCategories.categoryId))
    .where(and(revenueRangeWhere(from, to), eq(categories.isSystem, false)));

  const byCategory = new Map<number, CategoryRevenuePoint>();
  for (const row of rows) {
    const entry = byCategory.get(row.categoryId) ?? {
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      quantity: 0,
      revenue: 0,
    };
    entry.quantity += row.quantity;
    entry.revenue += row.quantity * row.unitPrice;
    byCategory.set(row.categoryId, entry);
  }
  return [...byCategory.values()].sort((a, b) => b.revenue - a.revenue);
}

export type PaginatedOrders = { orders: Order[]; total: number; page: number; pageSize: number };

/** Daftar pesanan (lunas ke atas) dalam rentang [from, to], dipaginasi untuk tabel laporan. */
export async function listOrdersInRange(
  from: Date,
  to: Date,
  page: number,
  pageSize: number,
): Promise<PaginatedOrders> {
  const where = revenueRangeWhere(from, to);
  const [countRow] = await db.select({ count: sql<number>`count(*)` }).from(orders).where(where);
  const total = Number(countRow?.count ?? 0);
  const orderRows = await db
    .select()
    .from(orders)
    .where(where)
    .orderBy(desc(orders.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);
  return { orders: await attachOrderItems(orderRows), total, page, pageSize };
}

/** Semua pesanan (lunas ke atas) dalam rentang [from, to], tanpa paginasi — dipakai untuk export CSV. */
export async function listAllOrdersInRange(from: Date, to: Date): Promise<Order[]> {
  const orderRows = await db
    .select()
    .from(orders)
    .where(revenueRangeWhere(from, to))
    .orderBy(desc(orders.createdAt));
  return attachOrderItems(orderRows);
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  await db.transaction(async (tx) => {
    // Kunci baris pesanan ini supaya webhook Xendit dan admin yang mengubah
    // status bersamaan tidak bisa dua-duanya lolos cek "belum di-restore" dan
    // mengembalikan stok dua kali untuk pesanan yang sama.
    const [current] = await tx
      .select({ status: orders.status })
      .from(orders)
      .where(eq(orders.id, id))
      .for("update")
      .limit(1);
    if (!current) throw new Error("Pesanan tidak ditemukan.");

    // Kembalikan stok hanya sekali, saat pesanan PERTAMA KALI masuk status
    // cancelled/expired — supaya pindah status berkali-kali tidak dobel restore.
    const enteringRestorableState =
      STOCK_RESTORED_STATUSES.includes(status) && !STOCK_RESTORED_STATUSES.includes(current.status);
    if (enteringRestorableState) {
      const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, id));
      for (const item of items) {
        await restoreStock(tx, item.productId, item.quantity);
      }
    }

    await tx.update(orders).set({ status, updatedAt: nowForDb() }).where(eq(orders.id, id));
  });
}
