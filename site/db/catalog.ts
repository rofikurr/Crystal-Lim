import { asc, eq, inArray } from "drizzle-orm";
import { db } from "./index";
import { catalogMeta, categories, productCategories, products } from "./schema";
import seedCatalog from "./seed-products.js";
import { nowForDb } from "../lib/db-time";

export type CategoryRef = { id: number; slug: string; name: string };

export type Category = CategoryRef & { isSystem: boolean; position: number };

export const BEST_SELLER_SLUG = "best-seller";

const DEFAULT_CATEGORIES: Omit<Category, "id">[] = [
  { slug: "jewelry", name: "Jewelry", isSystem: false, position: 0 },
  { slug: "crystal", name: "Crystals & Chakra Stones", isSystem: false, position: 1 },
  { slug: "sinergi", name: "12 Sinergi Kristal", isSystem: false, position: 2 },
  { slug: "antique", name: "Antique", isSystem: false, position: 3 },
  { slug: "combination", name: "Combination Jewelry", isSystem: false, position: 4 },
  { slug: "loose", name: "Loose Gemstones", isSystem: false, position: 5 },
  { slug: "rough", name: "Rough Stones", isSystem: false, position: 6 },
  { slug: "herkimer", name: "Herkimer Diamond", isSystem: false, position: 7 },
  { slug: BEST_SELLER_SLUG, name: "Best Seller", isSystem: true, position: 8 },
];

async function ensureCategoriesSeeded() {
  const existing = await db.select({ id: categories.id }).from(categories).limit(1);
  if (existing.length > 0) return;
  await db.insert(categories).ignore().values(DEFAULT_CATEGORIES);
}

export async function listCategories(): Promise<Category[]> {
  await ensureCategoriesSeeded();
  return db.select().from(categories).orderBy(asc(categories.position), asc(categories.id));
}

export async function saveCategory(input: { name: string; position: number }) {
  const slug = input.name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || `kategori-${Date.now()}`;
  const [row] = await db
    .insert(categories)
    .values({ slug, name: input.name.trim(), isSystem: false, position: input.position });
  const [created] = await db
    .select()
    .from(categories)
    .where(eq(categories.id, row.insertId))
    .limit(1);
  return created;
}

export async function updateCategory(id: number, input: { name?: string; position?: number }) {
  const [category] = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  if (!category) throw new Error("Kategori tidak ditemukan.");
  if (category.isSystem) throw new Error("Kategori Best Seller tidak bisa diubah.");
  const set: { name?: string; position?: number } = {};
  if (typeof input.name === "string" && input.name.trim()) set.name = input.name.trim();
  if (typeof input.position === "number" && Number.isInteger(input.position)) {
    set.position = input.position;
  }
  if (Object.keys(set).length > 0) {
    await db.update(categories).set(set).where(eq(categories.id, id));
  }
}

export async function deleteCategory(id: number) {
  const [category] = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  if (!category) throw new Error("Kategori tidak ditemukan.");
  if (category.isSystem) throw new Error("Kategori Best Seller tidak bisa dihapus.");
  const inUse = await db
    .select({ productId: productCategories.productId })
    .from(productCategories)
    .where(eq(productCategories.categoryId, id))
    .limit(1);
  if (inUse.length > 0) {
    throw new Error("Kategori masih dipakai produk. Lepas dari produk itu dulu.");
  }
  await db.delete(categories).where(eq(categories.id, id));
}

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  categories: CategoryRef[];
  image: string;
  images: string[];
  url: string;
  published: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
};

type ProductRow = typeof products.$inferSelect;

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
          image: p.image,
          images: p.images,
          sourceUrl: p.url,
          published: true,
          position: i,
          createdAt: now,
          updatedAt: now,
        })),
      );
    await ensureCategoriesSeeded();
    const allCategories = await db.select().from(categories);
    const bySlug = new Map(allCategories.map((c) => [c.slug, c]));
    const links = seed.flatMap((p) => {
      const category = bySlug.get(p.category);
      return category ? [{ productId: p.id, categoryId: category.id }] : [];
    });
    if (links.length > 0) {
      await db.insert(productCategories).ignore().values(links);
    }
  }
  await db
    .insert(catalogMeta)
    .values({ id: "catalog", seeded: true })
    .onDuplicateKeyUpdate({ set: { seeded: true } });
}

async function categoriesByProductIds(productIds: string[]): Promise<Map<string, CategoryRef[]>> {
  if (productIds.length === 0) return new Map();
  const rows = await db
    .select({
      productId: productCategories.productId,
      id: categories.id,
      slug: categories.slug,
      name: categories.name,
    })
    .from(productCategories)
    .innerJoin(categories, eq(productCategories.categoryId, categories.id))
    .where(inArray(productCategories.productId, productIds))
    .orderBy(asc(categories.position));
  const map = new Map<string, CategoryRef[]>();
  for (const row of rows) {
    const list = map.get(row.productId) ?? [];
    list.push({ id: row.id, slug: row.slug, name: row.name });
    map.set(row.productId, list);
  }
  return map;
}

function toProduct(row: ProductRow, categoryMap: Map<string, CategoryRef[]>): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price,
    categories: categoryMap.get(row.id) ?? [],
    image: row.image,
    images: Array.isArray(row.images) ? row.images : [],
    url: row.sourceUrl,
    published: row.published,
    position: row.position,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
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
  const categoryMap = await categoriesByProductIds(rows.map((r) => r.id));
  return rows.map((row) => toProduct(row, categoryMap));
}

export async function saveProduct(
  product: Omit<Product, "categories"> & { categoryIds: number[] },
) {
  await db.transaction(async (tx) => {
    await tx
      .insert(products)
      .values({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        image: product.image,
        images: product.images,
        sourceUrl: product.url,
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
          image: product.image,
          images: product.images,
          sourceUrl: product.url,
          published: product.published,
          position: product.position,
          updatedAt: product.updatedAt,
        },
      });
    await tx.delete(productCategories).where(eq(productCategories.productId, product.id));
    if (product.categoryIds.length > 0) {
      await tx
        .insert(productCategories)
        .values(product.categoryIds.map((categoryId) => ({ productId: product.id, categoryId })));
    }
  });
}

export async function deleteProduct(id: string) {
  await db.delete(products).where(eq(products.id, id));
}
