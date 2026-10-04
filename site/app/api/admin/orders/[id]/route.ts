import { requirePermissionOrResponse } from "../../../../../lib/auth/permissions";
import { sameOrigin } from "../../../../../lib/auth/session";
import { getOrder, updateOrderStatus } from "../../../../../db/orders";

const ALLOWED_STATUSES = new Set(["shipped", "completed", "cancelled"]);

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { response } = await requirePermissionOrResponse("orders.manage");
  if (response) return response;
  if (!sameOrigin(request)) return Response.json({ error: "Permintaan tidak valid." }, { status: 403 });
  const { id } = await context.params;
  let body: { status?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Data tidak valid." }, { status: 400 });
  }
  if (!body.status || !ALLOWED_STATUSES.has(body.status)) {
    return Response.json({ error: "Status tidak valid." }, { status: 400 });
  }
  try {
    const existing = await getOrder(id);
    if (!existing) return Response.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
    await updateOrderStatus(id, body.status as "shipped" | "completed" | "cancelled");
    return Response.json({ ok: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Status gagal diperbarui." }, { status: 503 });
  }
}
