# Crystal Lim preview + admin

Site ini memakai Next.js 16 standar (`next dev`/`next build`/`next start`), database MySQL (lewat Drizzle ORM), dan penyimpanan foto di filesystem lokal server. Etalase tetap publik; `/admin` dilindungi login email+password mandiri dengan sistem role & permission dinamis (RBAC) — lihat `db/schema.ts` (tabel `users`, `roles`, `permissions`, `role_permissions`) dan `lib/auth/*`.

Project ini sebelumnya berjalan di atas ChatGPT Sites (Vinext + Cloudflare Worker/D1/R2). Seluruh bagian itu sudah dilepas supaya bisa di-deploy ke hosting Node.js standar (termasuk Hostinger).

## Yang sudah berjalan

- Tambah, edit, hapus, sembunyikan produk; urutan tampil; kategori; harga dan deskripsi.
- Unggah foto utama JPG/PNG/WebP hingga 5 MB ke `storage/uploads/` (lokal), atau isi URL foto dan galeri.
- Tandai **Best seller** secara manual.
- RBAC dinamis: role baru (mis. "Admin Finance") bisa dibuat lewat `/admin/roles` dengan permission granular, tanpa perlu ubah kode.
- Superadmin bisa "Lihat sebagai" role lain dari header admin, untuk keperluan testing/QA.
- Data checkout, tarif ongkir, dan pembayaran tetap **tidak aktif** di preview ini.

## Pengembangan lokal (Docker)

```sh
cp .env.example .env   # isi nilainya dulu
docker compose up -d
docker compose exec app npm run db:generate   # hanya setelah mengubah db/schema.ts
docker compose exec app npm run db:migrate
docker compose exec app npm run db:seed       # bikin role/permission dasar + akun superadmin
```

Buka `http://localhost:8500/`. Login admin di `http://localhost:8500/admin/login` memakai akun dari `SUPERADMIN_EMAIL` / `SUPERADMIN_PASSWORD` di `.env`. phpMyAdmin tersedia di `http://localhost:8520`, MySQL dari tool lain (mis. DBeaver) di `localhost:8510`.

Port sengaja dipakai di rentang `85xx` supaya tidak bentrok dengan project Docker lain di mesin yang sama (WulfGym, Rebate Bonus, Setra Developer Handoff).

Migrasi baru ditambahkan (jangan mengedit migrasi yang sudah terbit) lewat `npm run db:generate` setiap kali `db/schema.ts` berubah, lalu `npm run db:migrate` untuk menerapkannya.

## Sebelum menjadi toko transaksi sungguhan

1. Dapatkan persetujuan akun email klien yang boleh jadi admin, lalu buat user + assign role lewat `/admin/roles`.
2. Integrasikan dan uji API ongkir serta payment gateway dengan kredensial server. Jangan mengaktifkan tombol bayar sebelum keduanya benar-benar berfungsi.
3. Konfirmasi stok, berat/dimensi paket, harga, dan kebijakan pengiriman dengan Crystal Lim.
4. Bila katalog utama tetap WooCommerce, tentukan sinkronisasi atau migrasi.

Jangan menaruh API key atau kredensial di repository — semua lewat `.env` (tidak ter-commit).
