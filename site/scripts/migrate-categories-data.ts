import mysql from "mysql2/promise";
import { db } from "../db";
import { productCategories } from "../db/schema";
import { BEST_SELLER_SLUG, listCategories } from "../db/catalog";

type OldProductRow = { id: string; category: string; best_seller: number };

/**
 * One-off: pindahkan `products.category` (varchar tunggal) dan
 * `products.best_seller` (boolean) lama ke tabel relasi `product_categories`.
 * Jalankan SETELAH migrasi tahap 1 (nambah tabel categories/product_categories)
 * dan SEBELUM migrasi tahap 2 (drop kolom category/best_seller dari products).
 * Query kolom lama lewat SQL mentah (bukan skema Drizzle `products`) karena
 * skema saat ini sudah tidak lagi mendeklarasikan kolom tersebut.
 */
async function main() {
  const allCategories = await listCategories(); // lazy-seed kategori default kalau masih kosong
  const bySlug = new Map(allCategories.map((c) => [c.slug, c]));
  const bestSeller = bySlug.get(BEST_SELLER_SLUG);
  if (!bestSeller) throw new Error("Kategori Best Seller belum ada.");

  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  const [rows] = await connection.query<(OldProductRow & mysql.RowDataPacket)[]>(
    "SELECT id, category, best_seller FROM products",
  );
  await connection.end();
  let linked = 0;
  for (const row of rows) {
    const links: { productId: string; categoryId: number }[] = [];
    const category = bySlug.get(row.category);
    if (category) links.push({ productId: row.id, categoryId: category.id });
    if (row.best_seller) links.push({ productId: row.id, categoryId: bestSeller.id });
    if (links.length > 0) {
      await db.insert(productCategories).ignore().values(links);
      linked += links.length;
    }
  }
  console.log(`Selesai. ${rows.length} produk diperiksa, ${linked} relasi kategori dibuat.`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
