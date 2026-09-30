import { getAdmin, sameOrigin } from "../../../../admin/auth";
import { deleteProduct, listProducts } from "../../../../../db/catalog";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!await getAdmin()) return Response.json({ error: "Akses admin ditolak." }, { status: 403 });
  if (!sameOrigin(request)) return Response.json({ error: "Permintaan tidak valid." }, { status: 403 });
  const { id } = await context.params;
  try {
    const products = await listProducts(true);
    if (!products.some(p => p.id === id)) return Response.json({ error: "Produk tidak ditemukan." }, { status: 404 });
    await deleteProduct(id);
    return Response.json({ ok: true });
  } catch (error) { console.error(error); return Response.json({ error: "Produk belum terhapus." }, { status: 503 }); }
}
