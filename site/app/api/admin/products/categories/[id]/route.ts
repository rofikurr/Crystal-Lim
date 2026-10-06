import { requirePermissionOrResponse } from "../../../../../../lib/auth/permissions";
import { sameOrigin } from "../../../../../../lib/auth/session";
import { deleteCategory, updateCategory } from "../../../../../../db/catalog";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { response } = await requirePermissionOrResponse("products.manage");
  if (response) return response;
  if (!sameOrigin(request)) return Response.json({ error: "Permintaan tidak valid." }, { status: 403 });
  const { id } = await context.params;
  const categoryId = Number(id);
  if (!Number.isInteger(categoryId)) return Response.json({ error: "Kategori tidak ditemukan." }, { status: 404 });
  let body: { name?: string; position?: number };
  try { body = await request.json(); } catch { return Response.json({ error: "Data tidak valid." }, { status: 400 }); }
  if (typeof body.name === "string" && body.name.trim().length > 120) {
    return Response.json({ error: "Nama kategori maksimal 120 karakter." }, { status: 400 });
  }
  try {
    await updateCategory(categoryId, body);
    return Response.json({ ok: true });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Kategori gagal diperbarui.";
    return Response.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const { response } = await requirePermissionOrResponse("products.manage");
  if (response) return response;
  if (!sameOrigin(request)) return Response.json({ error: "Permintaan tidak valid." }, { status: 403 });
  const { id } = await context.params;
  const categoryId = Number(id);
  if (!Number.isInteger(categoryId)) return Response.json({ error: "Kategori tidak ditemukan." }, { status: 404 });
  try {
    await deleteCategory(categoryId);
    return Response.json({ ok: true });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Kategori gagal dihapus.";
    return Response.json({ error: message }, { status: 400 });
  }
}
