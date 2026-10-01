import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import mysql from "mysql2/promise";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL belum diset.");

  const connection = await mysql.createConnection(url);
  const db = drizzle(connection);

  console.log("Menjalankan migrasi database...");
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Migrasi selesai.");

  await connection.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
