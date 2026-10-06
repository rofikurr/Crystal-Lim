import { desc } from "drizzle-orm";
import { db } from "./index";
import { broadcasts } from "./schema";
import { nowForDb } from "../lib/db-time";

export type Broadcast = typeof broadcasts.$inferSelect;

export async function listBroadcasts(): Promise<Broadcast[]> {
  return db.select().from(broadcasts).orderBy(desc(broadcasts.createdAt));
}

export async function recordBroadcast(input: {
  subject: string;
  body: string;
  recipientCount: number;
  failedCount: number;
}): Promise<void> {
  await db.insert(broadcasts).values({ ...input, createdAt: nowForDb() });
}
