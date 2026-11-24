import { requirePermissionOrResponse } from "../../../../../lib/auth/permissions";
import { sameOrigin } from "../../../../../lib/auth/session";
import { getOrder, setTrackingNumber, updateOrderStatus } from "../../../../../db/orders";

const ALLOWED_STATUSES = new Set(["shipped", "completed", "cancelled"]);

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { response } = await requirePermissionOrResponse("orders.manage");
  if (response) return response;
  if (!sameOrigin(request)) return Response.json({ error: "Permintaan tidak valid." }, { status: 403 });
  const { id } = await context.params;
  let body: { status?: string; trackingNumber?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Data tidak valid." }, { status: 400 });
  }
  if (body.status !== undefined && !ALLOWED_STATUSES.has(body.status)) {
    return Response.json({ error: "Status tidak valid." }, { status: 400 });
  }
  if (body.trackingNumber !== undefined && (typeof body.trackingNumber !== "string" || body.trackingNumber.length > 80)) {
    return Response.json({ error: "Nomor resi tidak valid." }, { status: 400 });
  }
  if (body.status === undefined && body.trackingNumber === undefined) {
    return Response.json({ error: "Tidak ada yang diubah." }, { status: 400 });
  }
  try {
    const existing = await getOrder(id);
    if (!existing) return Response.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
    if (body.status !== undefined) {
      await updateOrderStatus(id, body.status as "shipped" | "completed" | "cancelled");
    }
    if (body.trackingNumber !== undefined) {
      await setTrackingNumber(id, body.trackingNumber.trim());
    }
    return Response.json({ ok: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Pesanan gagal diperbarui." }, { status: 503 });
  }
}
