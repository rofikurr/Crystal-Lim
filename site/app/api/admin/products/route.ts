import { requirePermissionOrResponse } from "../../../../lib/auth/permissions";
import { sameOrigin } from "../../../../lib/auth/session";
import { nowForDb } from "../../../../lib/db-time";
import { listCategories, listProducts, saveProduct, type Product } from "../../../../db/catalog";

export const dynamic = "force-dynamic";
const validImage = (value: unknown): value is string => typeof value === "string" &&
  value.length <= 800 && (/^https:\/\//.test(value) || /^\/(assets|media)\/[a-zA-Z0-9._/-]+$/.test(value) || /^assets\/[a-zA-Z0-9._/-]+$/.test(value));

export async function GET() {
  const { response } = await requirePermissionOrResponse("products.manage");
  if (response) return response;
  try {
    const [products, categories] = await Promise.all([listProducts(true), listCategories()]);
    return Response.json({ products, categories }, { headers: { "cache-control": "no-store" } });
  }
  catch (error) { console.error(error); return Response.json({ error: "Katalog gagal dimuat." }, { status: 503 }); }
}

export async function POST(request: Request) {
  const { response } = await requirePermissionOrResponse("products.manage");
  if (response) return response;
  if (!sameOrigin(request)) return Response.json({ error: "Permintaan tidak valid." }, { status: 403 });
  let body: Partial<Product> & { categoryIds?: unknown };
  try { body = await request.json(); } catch { return Response.json({ error: "Data tidak valid." }, { status: 400 }); }
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const price = Number(body.price);
  const images = Array.isArray(body.images) ? body.images : [];
  const categoryIdsInput = Array.isArray(body.categoryIds) ? body.categoryIds : [];
  const categoryIds: number[] = categoryIdsInput.every((id) => Number.isInteger(id))
    ? categoryIdsInput
    : [];
  if (!name || name.length > 140 || description.length > 3000 ||
    !Number.isSafeInteger(price) || price < 0 || price > 1000000000 ||
    categoryIds.length !== categoryIdsInput.length ||
    !validImage(body.image) ||
    images.length > 12 || images.some(image => !validImage(image)) ||
    (body.url && (typeof body.url !== "string" || !/^https:\/\//.test(body.url) || body.url.length > 800))) {
    return Response.json({ error: "Periksa nama, harga, kategori, foto, dan deskripsi produk." }, { status: 400 });
  }
  try {
    const validCategoryIds = new Set((await listCategories()).map((c) => c.id));
    if (categoryIds.some((id) => !validCategoryIds.has(id))) {
      return Response.json({ error: "Kategori tidak valid." }, { status: 400 });
    }
    const existing = await listProducts(true);
    const old = existing.find(p => p.id === body.id);
    if (body.id && !old) return Response.json({ error: "Produk tidak ditemukan." }, { status: 404 });
    const now = nowForDb();
    const id = old?.id || `produk-${crypto.randomUUID()}`;
    await saveProduct({
      id, name, description, price,
      image: body.image!, images: [...new Set([body.image!, ...images])],
      url: body.url || "", published: body.published !== false,
      position: Number.isInteger(body.position) && body.position! >= 0 && body.position! <= 10000
        ? body.position! : existing.length,
      createdAt: old?.createdAt || now, updatedAt: now,
      categoryIds,
    });
    const [product] = (await listProducts(true)).filter((p) => p.id === id);
    return Response.json({ product }, { status: old ? 200 : 201 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Produk belum tersimpan. Coba lagi." }, { status: 503 });
  }
}
