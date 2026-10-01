/**
 * Kolom MySQL `datetime` (mode "string" di Drizzle) tidak menerima format ISO
 * 8601 penuh dari `Date.toISOString()` (ada `T` dan `Z`). Format yang diterima
 * mysql2 adalah "YYYY-MM-DD HH:MM:SS".
 */
export function nowForDb(): string {
  return new Date().toISOString().replace("T", " ").replace(/\.\d+Z$/, "");
}
