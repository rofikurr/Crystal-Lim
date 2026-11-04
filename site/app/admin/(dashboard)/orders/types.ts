import { formatRupiah } from "../../../../lib/format";
import type { TranslationKey } from "../../../../lib/i18n/translations";

export type OrderStatus = "pending" | "paid" | "shipped" | "completed" | "cancelled" | "expired";
export type ShippingMethod = "domestic" | "intl_standard" | "intl_express";
export type PaymentMethod = "qris" | "va" | "ewallet" | "card" | "";

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
  paymentMethod: PaymentMethod;
  paymentFee: number;
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

export const STATUS_KEYS: Record<OrderStatus, TranslationKey> = {
  pending: "orderStatus.pending",
  paid: "orderStatus.paid",
  shipped: "orderStatus.shipped",
  completed: "orderStatus.completed",
  cancelled: "orderStatus.cancelled",
  expired: "orderStatus.expired",
};

export const SHIPPING_METHOD_KEYS: Record<ShippingMethod, TranslationKey> = {
  domestic: "orders.shippingMethod.domestic",
  intl_standard: "orders.shippingMethod.intlStandard",
  intl_express: "orders.shippingMethod.intlExpress",
};

export const PAYMENT_METHOD_KEYS: Record<Exclude<PaymentMethod, "">, TranslationKey> = {
  qris: "orders.paymentMethod.qris",
  va: "orders.paymentMethod.va",
  ewallet: "orders.paymentMethod.ewallet",
  card: "orders.paymentMethod.card",
};

export const money = { format: formatRupiah };
