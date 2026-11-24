import { eq } from "drizzle-orm";
import { db } from "./index";
import { settings } from "./schema";

export async function getSetting(key: string, fallback: string): Promise<string> {
  const [row] = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
  return row?.value ?? fallback;
}

/** Sama seperti `getSetting`, tapi jamin hasilnya angka valid (fallback kalau nilai tersimpan rusak/non-numerik). */
export async function getNumericSetting(key: string, fallback: number): Promise<number> {
  const raw = await getSetting(key, String(fallback));
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

export async function setSetting(key: string, value: string) {
  await db
    .insert(settings)
    .values({ key, value })
    .onDuplicateKeyUpdate({ set: { value } });
}
