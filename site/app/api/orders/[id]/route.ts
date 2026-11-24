import { getOrder } from "../../../../db/orders";
import { getEffectiveUser } from "../../../../lib/auth/permissions";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getEffectiveUser().catch(() => null);
  if (!user) return Response.json({ error: "Belum masuk." }, { status: 401 });

  const { id } = await context.params;
  const order = await getOrder(id).catch(() => null);
  if (!order || order.customerEmail.toLowerCase() !== user.email.toLowerCase()) {
    return Response.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
  }

  return Response.json({
    id: order.id,
    status: order.status,
    customerName: order.customerName,
    paymentMethod: order.paymentMethod,
    subtotal: order.subtotal,
    shippingFee: order.shippingFee,
    paymentFee: order.paymentFee,
    total: order.total,
    createdAt: order.createdAt,
    items: order.items.map((item) => ({
      productName: item.productName,
      variantLabel: item.variantLabel,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
  });
}
