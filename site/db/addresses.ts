import { and, eq } from "drizzle-orm";
import { db } from "./index";
import { addresses } from "./schema";

export type Address = typeof addresses.$inferSelect;
export type AddressInput = Omit<Address, "id" | "userId">;

export async function listAddresses(userId: number): Promise<Address[]> {
  return db.select().from(addresses).where(eq(addresses.userId, userId));
}

export async function createAddress(userId: number, input: AddressInput): Promise<Address> {
  return db.transaction(async (tx) => {
    if (input.isDefault) {
      await tx.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, userId));
    }
    const [inserted] = await tx.insert(addresses).values({ ...input, userId });
    const [row] = await tx.select().from(addresses).where(eq(addresses.id, inserted.insertId)).limit(1);
    return row;
  });
}

export async function updateAddress(
  userId: number,
  id: number,
  input: AddressInput,
): Promise<void> {
  await db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: addresses.id })
      .from(addresses)
      .where(and(eq(addresses.id, id), eq(addresses.userId, userId)))
      .limit(1);
    if (!existing) throw new Error("Alamat tidak ditemukan.");
    if (input.isDefault) {
      await tx.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, userId));
    }
    await tx.update(addresses).set(input).where(eq(addresses.id, id));
  });
}

export async function deleteAddress(userId: number, id: number): Promise<void> {
  const result = await db
    .delete(addresses)
    .where(and(eq(addresses.id, id), eq(addresses.userId, userId)));
  if (result[0].affectedRows === 0) throw new Error("Alamat tidak ditemukan.");
}
