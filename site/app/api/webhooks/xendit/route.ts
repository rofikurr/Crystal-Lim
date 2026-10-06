import { updateOrderStatus } from "../../../../db/orders";
import { verifyCallbackToken } from "../../../../lib/xendit";

export const dynamic = "force-dynamic";

const STATUS_MAP: Record<string, "paid" | "expired"> = {
  PAID: "paid",
  SETTLED: "paid",
  EXPIRED: "expired",
};

export async function POST(request: Request) {
  if (!verifyCallbackToken(request)) {
    return Response.json({ error: "Token tidak valid." }, { status: 401 });
  }
  let body: { external_id?: string; status?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Data tidak valid." }, { status: 400 });
  }
  const mapped = body.status ? STATUS_MAP[body.status] : undefined;
  if (body.external_id && mapped) {
    try {
      await updateOrderStatus(body.external_id, mapped);
    } catch (error) {
      console.error(error);
    }
  }
  return Response.json({ ok: true });
}
