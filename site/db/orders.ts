import { and, desc, eq, gte, inArray } from "drizzle-orm";
import { db } from "./index";
import { orderItems, orders } from "./schema";
import {
  decrementStock,
  decrementVariantStock,
  listProducts,
  restoreStock,
  restoreVariantStock,
} from "./catalog";
import { nowForDb } from "../lib/db-time";

export type OrderStatus = (typeof orders.$inferSelect)["status"];
export type ShippingMethod = (typeof orders.$inferSelect)["shippingMethod"];

export type OrderItem = {
  productId: string;
  productName: string;
  productImage: string;
  unitPrice: number;
  quantity: number;
  variantId: number | null;
  variantLabel: string;
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
  shippingMethod: ShippingMethod;
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
      variantId: row.variantId,
      variantLabel: row.variantLabel,
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
      variantId: row.variantId,
      variantLabel: row.variantLabel,
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
      variantId: row2.variantId,
      variantLabel: row2.variantLabel,
    })),
  };
}

export async function createOrder(input: {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  notes: string;
  items: { productId: string; quantity: number; variantId?: number | null }[];
  shippingFee: number;
  shippingMethod?: ShippingMethod;
}): Promise<Order> {
  if (input.items.length === 0) throw new CheckoutError("Keranjang kosong.");
  const catalog = await listProducts();
  const byId = new Map(catalog.map((p) => [p.id, p]));
  const items: OrderItem[] = [];
  for (const { productId, quantity, variantId } of input.items) {
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
      throw new CheckoutError("Jumlah produk tidak valid.");
    }
    const product = byId.get(productId);
    if (!product) throw new CheckoutError("Salah satu produk sudah tidak tersedia.");
    const variant = variantId ? product.variants.find((v) => v.id === variantId) : undefined;
    if (variantId && !variant) throw new CheckoutError(`Varian produk ${product.name} sudah tidak tersedia.`);
    items.push({
      productId: product.id,
      productName: product.name,
      productImage: product.image,
      unitPrice: variant ? variant.price : product.price,
      quantity,
      variantId: variant?.id ?? null,
      variantLabel: variant?.label ?? "",
    });
  }
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const shippingFee = input.shippingFee;
  const total = subtotal + shippingFee;
  const now = nowForDb();
  const id = `pesanan-${crypto.randomUUID()}`;

  await db.transaction(async (tx) => {
    for (const item of items) {
      const ok = item.variantId
        ? await decrementVariantStock(tx, item.productId, item.variantId, item.quantity)
        : await decrementStock(tx, item.productId, item.quantity);
      if (!ok) {
        const label = item.variantId ? `${item.productName} (${item.variantLabel})` : item.productName;
        throw new CheckoutError(`Stok ${label} tidak cukup. Kurangi jumlahnya dulu.`);
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
      shippingMethod: input.shippingMethod ?? "domestic",
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
        variantId: item.variantId,
        variantLabel: item.variantLabel,
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
    shippingMethod: input.shippingMethod ?? "domestic",
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
      variantId: row.variantId,
      variantLabel: row.variantLabel,
    });
    itemsByOrder.set(row.orderId, list);
  }
  return orderRows.map((row) => ({ ...row, items: itemsByOrder.get(row.id) ?? [] }));
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
        if (item.variantId) await restoreVariantStock(tx, item.productId, item.variantId, item.quantity);
        else await restoreStock(tx, item.productId, item.quantity);
      }
    }

    await tx.update(orders).set({ status, updatedAt: nowForDb() }).where(eq(orders.id, id));
  });
}
