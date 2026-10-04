import { requirePermissionOrResponse } from "../../../../../lib/auth/permissions";
import { sameOrigin } from "../../../../../lib/auth/session";
import { listCategories, saveCategory } from "../../../../../db/catalog";

export const dynamic = "force-dynamic";

export async function GET() {
  const { response } = await requirePermissionOrResponse("products.manage");
  if (response) return response;
  try {
    return Response.json({ categories: await listCategories() }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Kategori gagal dimuat." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const { response } = await requirePermissionOrResponse("products.manage");
  if (response) return response;
  if (!sameOrigin(request)) return Response.json({ error: "Permintaan tidak valid." }, { status: 403 });
  let body: { name?: string; position?: number };
  try { body = await request.json(); } catch { return Response.json({ error: "Data tidak valid." }, { status: 400 }); }
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name || name.length > 120) {
    return Response.json({ error: "Nama kategori wajib diisi, maksimal 120 karakter." }, { status: 400 });
  }
  try {
    const existing = await listCategories();
    const category = await saveCategory({
      name,
      position: Number.isInteger(body.position) ? body.position! : existing.length,
    });
    return Response.json({ category }, { status: 201 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Kategori belum tersimpan. Coba lagi." }, { status: 503 });
  }
}
