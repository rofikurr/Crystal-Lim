import { formatRupiah } from "../../../../lib/format";

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

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Menunggu bayar",
  paid: "Dibayar",
  shipped: "Dikirim",
  completed: "Selesai",
  cancelled: "Dibatalkan",
  expired: "Kedaluwarsa",
};

export const money = { format: formatRupiah };
