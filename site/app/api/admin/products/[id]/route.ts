import { requirePermissionOrResponse } from "../../../../../lib/auth/permissions";
import { sameOrigin } from "../../../../../lib/auth/session";
import { deleteProduct, listProducts } from "../../../../../db/catalog";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const { response } = await requirePermissionOrResponse("products.manage");
  if (response) return response;
  if (!sameOrigin(request)) return Response.json({ error: "Permintaan tidak valid." }, { status: 403 });
  const { id } = await context.params;
  try {
    const products = await listProducts(true);
    if (!products.some(p => p.id === id)) return Response.json({ error: "Produk tidak ditemukan." }, { status: 404 });
    await deleteProduct(id);
    return Response.json({ ok: true });
  } catch (error) { console.error(error); return Response.json({ error: "Produk belum terhapus." }, { status: 503 }); }
}
