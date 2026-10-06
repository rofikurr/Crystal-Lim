import { requirePermissionOrResponse } from "../../../../lib/auth/permissions";
import { sameOrigin } from "../../../../lib/auth/session";
import { getSetting, setSetting } from "../../../../db/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const { response } = await requirePermissionOrResponse("orders.manage");
  if (response) return response;
  try {
    const shippingFlatFee = Number(await getSetting("shipping_flat_fee", "0"));
    return Response.json({ shippingFlatFee }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Pengaturan gagal dimuat." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const { response } = await requirePermissionOrResponse("orders.manage");
  if (response) return response;
  if (!sameOrigin(request)) return Response.json({ error: "Permintaan tidak valid." }, { status: 403 });
  let body: { shippingFlatFee?: number };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Data tidak valid." }, { status: 400 });
  }
  if (!Number.isInteger(body.shippingFlatFee) || body.shippingFlatFee! < 0 || body.shippingFlatFee! > 10000000) {
    return Response.json({ error: "Nominal ongkir tidak valid." }, { status: 400 });
  }
  try {
    await setSetting("shipping_flat_fee", String(body.shippingFlatFee));
    return Response.json({ ok: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Pengaturan gagal disimpan." }, { status: 503 });
  }
}
