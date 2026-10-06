import { and, eq } from "drizzle-orm";
import { db } from "./index";
import { wishlistItems } from "./schema";
import { listProducts, type Product } from "./catalog";
import { nowForDb } from "../lib/db-time";

export async function listWishlistProductIds(userId: number): Promise<string[]> {
  const rows = await db
    .select({ productId: wishlistItems.productId })
    .from(wishlistItems)
    .where(eq(wishlistItems.userId, userId));
  return rows.map((r) => r.productId);
}

export async function listWishlist(userId: number): Promise<Product[]> {
  const ids = await listWishlistProductIds(userId);
  if (ids.length === 0) return [];
  const catalog = await listProducts(true);
  const idSet = new Set(ids);
  return catalog.filter((p) => idSet.has(p.id));
}

export async function addWishlist(userId: number, productId: string): Promise<void> {
  await db
    .insert(wishlistItems)
    .ignore()
    .values({ userId, productId, createdAt: nowForDb() });
}

export async function removeWishlist(userId: number, productId: string): Promise<void> {
  await db
    .delete(wishlistItems)
    .where(and(eq(wishlistItems.userId, userId), eq(wishlistItems.productId, productId)));
}
