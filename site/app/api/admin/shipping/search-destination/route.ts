import { requirePermissionOrResponse } from "../../../../../lib/auth/permissions";
import { RajaOngkirError, searchDestination } from "../../../../../lib/rajaongkir";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { response } = await requirePermissionOrResponse("orders.manage");
  if (response) return response;

  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 3) {
    return Response.json({ error: "Ketik minimal 3 huruf." }, { status: 400 });
  }

  try {
    const results = await searchDestination(query);
    return Response.json({ results }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error(error);
    const message = error instanceof RajaOngkirError ? error.message : "Pencarian lokasi gagal.";
    return Response.json({ error: message }, { status: 503 });
  }
}
