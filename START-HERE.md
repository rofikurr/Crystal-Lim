# Crystal Lim — paket handoff developer

Versi sumber: commit `a706879256f60fe48cea0aa04289c105217016e2` (30 September 2026). Preview saat paket dibuat: [crystal-lim-preview.rizkiaditama.chatgpt.site](https://crystal-lim-preview.rizkiaditama.chatgpt.site/). Source utama ada di `site/`; folder `reference/sandbox-node/` hanya contoh integrasi API, **bukan** backend produksi dan jangan dideploy bersama situs.

## Mulai dalam 5 menit

Prasyarat: Node.js >= 22.13, npm, Git. Dari `site/`:

```sh
npm ci
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_green_nightcrawler.sql
npm run dev
```

Buka `http://localhost:5173/`. Untuk mencoba admin lokal, buka `http://localhost:5173/signin-with-chatgpt?return_to=/admin`. Login lokal memakai akun mock `seedy@sites.test`; akun ini **tidak** mendapat akses pada build produksi.

Migrasi lokal cukup diterapkan sekali pada database lokal yang sama. Jika skema berubah, tambahkan migrasi baru dengan `npm run db:generate`; jangan mengedit migrasi yang sudah terbit.

## Status yang sebenarnya

| Area | Status |
| --- | --- |
| Etalase responsif, katalog, pencarian/filter, detail, galeri, keranjang | Berjalan di preview |
| Admin tambah/edit/sembunyikan/hapus produk | Berjalan; data tersimpan di D1 |
| Foto admin | Unggah ke R2 atau URL foto eksternal |
| Best seller | Label manual dari admin; belum berdasarkan penjualan |
| Akses admin | Login ChatGPT + allowlist email di server; saat ini hanya pemilik `aditamarizki@gmail.com` |
| Ongkir API, COD, pembayaran | Belum aktif di situs publik |
| Sinkronisasi WooCommerce `crystal-lim.com` | Belum ada |

Jangan menghapus label “Transaksi belum aktif” atau meminta data alamat asli sebelum checkout produksi selesai dan diuji.

## Peta paket

- `FLOW.md`: alur pengunjung, admin, gambar, best seller, dan rancangan checkout.
- `API-AND-DATA.md`: endpoint, validasi, tabel, serta lokasi perubahan utama.
- `RELEASE-CHECKLIST.md`: keputusan klien, pengujian, keamanan, dan langkah rilis.
- `site/README.md`: catatan kode dan perintah lokal.
- `reference/sandbox-node/README.md`: batasan scaffold ongkir/pembayaran.

Kredensial **tidak** disertakan. Untuk memperbarui situs Sites yang sama, tim dev memerlukan akses editor/owner ke project ID di `site/.openai/hosting.json`. Untuk hosting lain, siapkan Cloudflare-compatible Worker, D1, R2, dan mekanisme identitas server yang setara sebelum mengganti integrasi login.
