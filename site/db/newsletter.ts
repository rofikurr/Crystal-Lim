import { eq, isNull } from "drizzle-orm";
import { db } from "./index";
import { newsletterSubscribers } from "./schema";
import { nowForDb } from "../lib/db-time";

export type Subscriber = typeof newsletterSubscribers.$inferSelect;

export async function subscribe(email: string): Promise<void> {
  const now = nowForDb();
  const token = crypto.randomUUID();
  await db
    .insert(newsletterSubscribers)
    .values({ email, unsubscribeToken: token, subscribedAt: now, unsubscribedAt: null })
    .onDuplicateKeyUpdate({ set: { unsubscribedAt: null } });
}

export async function unsubscribeByToken(token: string): Promise<boolean> {
  const result = await db
    .update(newsletterSubscribers)
    .set({ unsubscribedAt: nowForDb() })
    .where(eq(newsletterSubscribers.unsubscribeToken, token));
  return result[0].affectedRows > 0;
}

export async function listActiveSubscribers(): Promise<Subscriber[]> {
  return db.select().from(newsletterSubscribers).where(isNull(newsletterSubscribers.unsubscribedAt));
}
