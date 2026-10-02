# Progress pengembangan Crystal Lim

Catatan status pengerjaan setelah handoff awal (`START-HERE.md`), diurutkan per tanggal. Tambahkan section tanggal baru di paling bawah setiap kali ada pekerjaan baru.

## 2026-09-30

### Migrasi platform

- [x] Lepas dari Cloudflare Worker/D1/R2/Vinext/ChatGPT Sites → Next.js standar (15.5.27)
- [x] Database: D1 (SQLite) → MySQL (Drizzle ORM)
- [x] Storage foto: Cloudflare R2 → filesystem lokal (`storage/uploads/`)
- [x] Perbaiki bug lama: form tambah/edit produk admin (variable shadowing)

### Login & hak akses (RBAC)

- [x] Login mandiri email + password (ganti dari allowlist 1 email ChatGPT)
- [x] Role & permission dinamis — bisa bikin role baru dari UI tanpa ubah kode
- [x] Superadmin bisa "Lihat sebagai" role lain untuk testing
- [x] Halaman Manajemen User (tambah/ubah role/nonaktifkan/hapus user)
- [x] Proteksi: tidak bisa hapus akun sendiri / hapus user superadmin

### Lingkungan lokal (Docker)

- [x] `docker-compose.yml` (app + MySQL + phpMyAdmin)

## 2026-10-01

### Admin panel

- [x] Restrukturisasi jadi sidebar: Dashboard, Produk, Manajemen User, Role & Permission
- [x] Dashboard ringkasan (jumlah produk, user, role)

### Lingkungan lokal (Docker) — penyesuaian port

- [x] Port disesuaikan (`8500`/`8510`/`8520`) biar tidak bentrok dengan project lain (WulfGym, Rebate, Setra)

### Git

- [x] Repo dirapikan: pindah folder, hapus wrapper folder lama
- [x] Branch `develop` dibuat, kerjaan migrasi di-commit & push ke situ
- [x] Pull Request `develop` → `main` sudah di-merge

## 2026-10-02

### Deployment

- [x] Deploy ke Vercel — project `main-crystal-lim` sukses jalan di `main-crystal-lim.vercel.app` (lacak branch `main`)
- [x] Project Vercel kedua `dev-crystal-lim` — lacak branch `develop`, jalan di `dev-crystal-lim.vercel.app`
- [x] Ignored Build Step ("Only build production") diset di kedua project, biar tidak saling build ganda lintas branch
- [x] Database production: Aiven MySQL (free tier), sudah migrate + seed — dipakai bersama oleh kedua domain
- [x] Data dummy lokal terpisah total dari data produksi (lokal pakai MySQL Docker, production pakai Aiven)

---

## Belum dikerjakan (belum ada tanggal selesai)

- [ ] Laporan pendapatan/analitik di dashboard — nunggu sistem order/checkout ada dulu
- [ ] Ganti SSL Aiven dari `rejectUnauthorized:false` ke verifikasi CA certificate resmi (belum mendesak selama masih tahap preview)
- [ ] Sistem order/checkout (nunggu keputusan bisnis: kurir, COD, payment gateway)
- [ ] Sinkronisasi dengan katalog lama WooCommerce (`crystal-lim.com`)
- [ ] Deploy ke Hostinger (masih di Vercel + Aiven untuk tahap preview)
