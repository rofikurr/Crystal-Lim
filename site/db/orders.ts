import { desc, eq, inArray } from "drizzle-orm";
import { db } from "./index";
import { orderItems, orders } from "./schema";
import { listProducts } from "./catalog";
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

export async function updateOrderStatus(id: string, status: OrderStatus) {
  await db.update(orders).set({ status, updatedAt: nowForDb() }).where(eq(orders.id, id));
}
