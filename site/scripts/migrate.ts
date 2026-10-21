import { mkdtempSync, copyFileSync, writeFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import mysql from "mysql2/promise";
import { productCategories } from "../db/schema";

/**
 * Migrasi 0001 bikin tabel categories/product_categories, migrasi 0002 langsung
 * DROP COLUMN products.category/best_seller setelahnya. Kalau dijalankan apa
 * adanya lewat `migrate()` (yang menerapkan semua migrasi pending sekaligus),
 * database yang masih punya data kategori lama akan kehilangan data itu
 * permanen sebelum sempat dipindahkan ke tabel baru.
 *
 * Guard di bawah mendeteksi kondisi itu dan, kalau perlu, menjalankan migrasi
 * 0000-0001 dulu (lewat folder migrasi sementara), lalu backfill kategori lama
 * secara otomatis, baru melanjutkan sisa migrasi — jadi aman dijalankan tanpa
 * langkah manual tambahan.
 */
async function categoriesBackfillNeeded(connection: mysql.Connection): Promise<boolean> {
  const [dbRows] = await connection.query<mysql.RowDataPacket[]>("SELECT DATABASE() AS db");
  const dbName = dbRows[0]?.db;
  if (!dbName) return false;

  const [columnRows] = await connection.query<mysql.RowDataPacket[]>(
    `SELECT COUNT(*) AS count FROM information_schema.columns
     WHERE table_schema = ? AND table_name = 'products' AND column_name = 'category'`,
    [dbName],
  );
  if (Number(columnRows[0]?.count ?? 0) === 0) return false; // migrasi 0002 sudah pernah jalan -> aman

  const [legacyRows] = await connection.query<mysql.RowDataPacket[]>(
    `SELECT COUNT(*) AS count FROM products WHERE (category IS NOT NULL AND category <> '') OR best_seller = 1`,
  );
  return Number(legacyRows[0]?.count ?? 0) > 0;
}

/** Jalankan migrasi 0000 & 0001 saja (lewat folder sementara berisi subset journal). */
async function migrateUpToCategoriesTables(connection: mysql.Connection) {
  const tmpDir = mkdtempSync(path.join(os.tmpdir(), "crystal-lim-migrate-stage1-"));
  const tmpMetaDir = path.join(tmpDir, "meta");
  try {
    const fs = await import("node:fs");
    fs.mkdirSync(tmpMetaDir, { recursive: true });
    copyFileSync("drizzle/0000_redundant_killraven.sql", path.join(tmpDir, "0000_redundant_killraven.sql"));
    copyFileSync("drizzle/0001_light_machine_man.sql", path.join(tmpDir, "0001_light_machine_man.sql"));
    writeFileSync(
      path.join(tmpMetaDir, "_journal.json"),
      JSON.stringify({
        version: "7",
        dialect: "mysql",
        entries: [
          { idx: 0, version: "5", when: 1790785998559, tag: "0000_redundant_killraven", breakpoints: true },
          { idx: 1, version: "5", when: 1791115823902, tag: "0001_light_machine_man", breakpoints: true },
        ],
      }),
    );
    const db = drizzle(connection);
    await migrate(db, { migrationsFolder: tmpDir });
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

/** Pindahkan products.category/best_seller lama ke product_categories (idempotent). */
async function backfillLegacyCategories() {
  const { db } = await import("../db");
  const { BEST_SELLER_SLUG, listCategories } = await import("../db/catalog");

  const allCategories = await listCategories(); // sekalian seed kategori default kalau masih kosong
  const bySlug = new Map(allCategories.map((c) => [c.slug, c]));
  const bestSeller = bySlug.get(BEST_SELLER_SLUG);
  if (!bestSeller) throw new Error("Kategori Best Seller belum ada.");

  const url = process.env.DATABASE_URL!;
  const legacyConnection = await mysql.createConnection(url);
  type OldProductRow = { id: string; category: string; best_seller: number };
  const [rows] = await legacyConnection.query<(OldProductRow & mysql.RowDataPacket)[]>(
    "SELECT id, category, best_seller FROM products",
  );
  await legacyConnection.end();

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
  console.log(`Backfill kategori lama: ${rows.length} produk diperiksa, ${linked} relasi dibuat.`);
}

/**
 * Produk dari seed awal (sebelum upload foto lewat admin ada) menyimpan path
 * gambar lokal tanpa "/" di depan (mis. "assets/x.jpg"). Itu kebetulan masih
 * tampil benar di storefront (karena halamannya di root "/"), tapi patah di
 * halaman manapun yang bukan root seperti /admin/products. Perbaiki otomatis
 * & idempotent setiap migrate — aman dipanggil berkali-kali, tidak menyentuh
 * URL eksternal (https://...) atau yang sudah benar.
 */
async function fixLegacyImagePaths() {
  const { db } = await import("../db");
  const { products } = await import("../db/schema");

  const needsSlash = (value: string) => value.length > 0 && !value.startsWith("/") && !value.startsWith("http");
  const fixed = (value: string) => (needsSlash(value) ? `/${value}` : value);

  const rows = await db.select({ id: products.id, image: products.image, images: products.images }).from(products);
  let updated = 0;
  for (const row of rows) {
    const imageNeedsFix = needsSlash(row.image);
    const imagesNeedFix = row.images.some(needsSlash);
    if (!imageNeedsFix && !imagesNeedFix) continue;
    await db
      .update(products)
      .set({ image: fixed(row.image), images: row.images.map(fixed) })
      .where(eq(products.id, row.id));
    updated += 1;
  }
  if (updated > 0) console.log(`Perbaikan path gambar lama: ${updated} produk diperbaiki.`);
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL belum diset.");

  const connection = await mysql.createConnection(url);

  if (await categoriesBackfillNeeded(connection)) {
    console.log("Data kategori lama terdeteksi — menjalankan migrasi tabel kategori dan backfill dulu...");
    await migrateUpToCategoriesTables(connection);
    await backfillLegacyCategories();
  }

  const db = drizzle(connection);
  console.log("Menjalankan migrasi database...");
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Migrasi selesai.");

  await connection.end();
  await fixLegacyImagePaths();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
