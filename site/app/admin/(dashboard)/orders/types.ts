import { formatRupiah } from "../../../../lib/format";
import type { TranslationKey } from "../../../../lib/i18n/translations";

export type OrderStatus = "pending" | "paid" | "shipped" | "completed" | "cancelled" | "expired";

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

export const STATUS_KEYS: Record<OrderStatus, TranslationKey> = {
  pending: "orderStatus.pending",
  paid: "orderStatus.paid",
  shipped: "orderStatus.shipped",
  completed: "orderStatus.completed",
  cancelled: "orderStatus.cancelled",
  expired: "orderStatus.expired",
};

export const money = { format: formatRupiah };
