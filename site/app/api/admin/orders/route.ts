import { requirePermissionOrResponse } from "../../../../lib/auth/permissions";
import { listOrders } from "../../../../db/orders";

export const dynamic = "force-dynamic";

export async function GET() {
  const { response } = await requirePermissionOrResponse("orders.manage");
  if (response) return response;
  try {
    return Response.json({ orders: await listOrders() }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Pesanan gagal dimuat." }, { status: 503 });
  }
}
