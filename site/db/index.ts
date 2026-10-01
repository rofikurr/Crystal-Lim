import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

declare global {
  var __mysqlPool: mysql.Pool | undefined;
}

function createPool() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL belum diset. Isi file .env sebelum menjalankan aplikasi.",
    );
  }
  return mysql.createPool(url);
}

// Next.js me-reload modul saat dev (HMR); cache pool di globalThis supaya
// tidak membuka koneksi baru setiap kali file ini di-reimport.
const pool = globalThis.__mysqlPool ?? createPool();
if (process.env.NODE_ENV !== "production") globalThis.__mysqlPool = pool;

export const db = drizzle(pool, { schema, mode: "default" });
