import { asc, eq } from "drizzle-orm";
import { db } from "./index";
import { catalogMeta, products } from "./schema";
import seedCatalog from "./seed-products.js";
import { nowForDb } from "../lib/db-time";

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  images: string[];
  url: string;
  bestSeller: boolean;
  published: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
};

type ProductRow = typeof products.$inferSelect;

function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price,
    category: row.category,
    image: row.image,
    images: Array.isArray(row.images) ? row.images : [],
    url: row.sourceUrl,
    bestSeller: row.bestSeller,
    published: row.published,
    position: row.position,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

type SeedProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  images: string[];
  url: string;
};

async function ensureSeed() {
  const meta = await db
    .select({ seeded: catalogMeta.seeded })
    .from(catalogMeta)
    .where(eq(catalogMeta.id, "catalog"))
    .limit(1);
  if (meta[0]?.seeded) return;

  const seed = seedCatalog as SeedProduct[];
  const now = nowForDb();
  if (seed.length > 0) {
    await db
      .insert(products)
      .ignore()
      .values(
        seed.map((p, i) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.price,
          category: p.category,
          image: p.image,
          images: p.images,
          sourceUrl: p.url,
          bestSeller: false,
          published: true,
          position: i,
          createdAt: now,
          updatedAt: now,
        })),
      );
  }
  await db
    .insert(catalogMeta)
    .values({ id: "catalog", seeded: true })
    .onDuplicateKeyUpdate({ set: { seeded: true } });
}

export async function listProducts(includeHidden = false): Promise<Product[]> {
  await ensureSeed();
  const rows = includeHidden
    ? await db
        .select()
        .from(products)
        .orderBy(asc(products.position), asc(products.createdAt))
    : await db
        .select()
        .from(products)
        .where(eq(products.published, true))
        .orderBy(asc(products.position), asc(products.createdAt));
  return rows.map(toProduct);
}

export async function saveProduct(product: Product) {
  await db
    .insert(products)
    .values({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      image: product.image,
      images: product.images,
      sourceUrl: product.url,
      bestSeller: product.bestSeller,
      published: product.published,
      position: product.position,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    })
    .onDuplicateKeyUpdate({
      set: {
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        image: product.image,
        images: product.images,
        sourceUrl: product.url,
        bestSeller: product.bestSeller,
        published: product.published,
        position: product.position,
        updatedAt: product.updatedAt,
      },
    });
}

export async function deleteProduct(id: string) {
  await db.delete(products).where(eq(products.id, id));
}
