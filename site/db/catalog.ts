import { env } from "cloudflare:workers";
import seedSource from "./seed-products.js?raw";

export type Product = {
  id: string; name: string; description: string; price: number; category: string;
  image: string; images: string[]; url: string; bestSeller: boolean;
  published: boolean; position: number; createdAt: string; updatedAt: string;
};

type ProductRow = {
  id: string; name: string; description: string; price: number; category: string;
  image: string; images: string; source_url: string; best_seller: number;
  published: number; position: number; created_at: string; updated_at: string;
};

function database() {
  if (!env.DB) throw new Error("Penyimpanan katalog belum tersedia.");
  return env.DB;
}

function toProduct(row: ProductRow): Product {
  let images: string[] = [];
  try { images = JSON.parse(row.images); } catch {}
  return {
    id: row.id, name: row.name, description: row.description, price: row.price,
    category: row.category, image: row.image, images, url: row.source_url,
    bestSeller: Boolean(row.best_seller), published: Boolean(row.published),
    position: row.position, createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

async function ensureSeed() {
  const db = database();
  const meta = await db.prepare("SELECT seeded FROM catalog_meta WHERE id = 'catalog'").first<{ seeded: number }>();
  if (meta?.seeded) return;
  const match = seedSource.match(/const crystalCatalog = (\[[\s\S]*?\]);\s*if \(typeof module/);
  if (!match) throw new Error("Data awal katalog tidak ditemukan.");
  const seed = JSON.parse(match[1]) as Array<{id:string;name:string;description:string;price:number;category:string;image:string;images:string[];url:string}>;
  const now = new Date().toISOString();
  await db.batch([
    ...seed.map((p, i) => db.prepare("INSERT OR IGNORE INTO products (id,name,description,price,category,image,images,source_url,best_seller,published,position,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,0,1,?,?,?)")
      .bind(p.id,p.name,p.description,p.price,p.category,p.image,JSON.stringify(p.images),p.url,i,now,now)),
    db.prepare("INSERT OR REPLACE INTO catalog_meta (id,seeded) VALUES ('catalog',1)"),
  ]);
}

export async function listProducts(includeHidden = false): Promise<Product[]> {
  await ensureSeed();
  const { results } = await database().prepare(
    `SELECT * FROM products ${includeHidden ? "" : "WHERE published = 1"} ORDER BY position ASC, created_at ASC`
  ).all<ProductRow>();
  return results.map(toProduct);
}

export async function saveProduct(product: Product) {
  const db = database();
  await db.prepare(`INSERT INTO products
    (id,name,description,price,category,image,images,source_url,best_seller,published,position,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(id) DO UPDATE SET
    name=excluded.name,description=excluded.description,price=excluded.price,category=excluded.category,
    image=excluded.image,images=excluded.images,source_url=excluded.source_url,best_seller=excluded.best_seller,
    published=excluded.published,position=excluded.position,updated_at=excluded.updated_at`)
    .bind(product.id,product.name,product.description,product.price,product.category,product.image,
      JSON.stringify(product.images),product.url,product.bestSeller ? 1 : 0,product.published ? 1 : 0,
      product.position,product.createdAt,product.updatedAt).run();
}

export async function deleteProduct(id: string) {
  await database().prepare("DELETE FROM products WHERE id = ?").bind(id).run();
}
