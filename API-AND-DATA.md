# API, data, dan titik integrasi

## Endpoint yang sudah ada

| Method | Path | Akses | Fungsi |
| --- | --- | --- | --- |
| GET | `/` | Publik | HTML etalase dari D1 |
| GET | `/admin` | Login + allowlist | Dashboard admin |
| GET | `/api/admin/products` | Admin | Semua produk, termasuk draft |
| POST | `/api/admin/products` | Admin + same-origin | Buat/edit produk |
| DELETE | `/api/admin/products/:id` | Admin + same-origin | Hapus produk |
| POST | `/api/admin/upload` | Admin + same-origin | Upload 1 foto utama |
| GET | `/media/:key` | Publik | Gambar R2 |

Contoh body `POST /api/admin/products`:

```json
{
  "name": "Amethyst Cluster",
  "description": "Deskripsi yang sudah disetujui pemilik toko.",
  "price": 450000,
  "category": "crystal",
  "image": "/media/UUID.jpg",
  "images": ["https://example.com/foto-2.jpg"],
  "url": "",
  "bestSeller": false,
  "published": true,
  "position": 6
}
```

Saat mengedit, kirim `id` produk yang ada. Server membuat UUID untuk produk baru. Harga integer Rupiah 0–1.000.000.000, nama maksimal 140 karakter, deskripsi maksimal 3.000 karakter, gambar tambahan maksimal 12 URL. Kategori tersedia: `jewelry`, `crystal`, `sinergi`, `antique`, `combination`, `loose`, `rough`, `herkimer`. Respons gagal menggunakan JSON `{"error":"..."}` dengan status HTTP yang sesuai.

## Penyimpanan

- D1 binding `DB`, tabel `products` dan `catalog_meta`. Skema ada di `site/db/schema.ts`, migrasi awal di `site/drizzle/0000_green_nightcrawler.sql`.
- R2 binding `BUCKET`, menyimpan berkas foto. Metadata gambar tidak disimpan terpisah; URL ada di kolom `image`/`images` pada produk.
- Enam produk awal dibaca dari `site/db/seed-products.js` hanya saat `catalog_meta.seeded` belum benar. Setelah seed, edit file itu tidak akan mengubah produk di D1.
- Keranjang disimpan lokal sebagai ID dan jumlah saja. Data alamat tidak dikirim pada preview.

## File penting

- `site/app/route.ts`: render etalase dan lencana Best Seller.
- `site/app/storefront.html` + `site/public/*.css`: kerangka & visual.
- `site/public/app.js`: pencarian, filter, keranjang, menu.
- `site/public/commerce.js`: detail/galeri dan checkout preview yang sengaja nonaktif.
- `site/app/admin/AdminClient.tsx`: UI CRUD.
- `site/app/admin/auth.ts`: allowlist admin.
- `site/app/api/admin/**`: validasi & mutasi admin.
- `site/db/catalog.ts`: seed dan query D1.

## Catatan hosting dan keamanan

`site/.openai/hosting.json` menunjuk Sites preview yang ada, dengan binding logis D1/R2. Jangan mengarang ID database/bucket produksi saat memindahkan hosting; buat binding nyata melalui platform tujuan. Situs publik memerlukan auth per-rute di server karena pengunjung anonim tetap boleh melihat etalase. Header identitas `oai-authenticated-user-*` berasal dari Sites dispatch; jika pindah platform, ganti dengan sistem login tepercaya, jangan menerima header itu begitu saja dari browser.

Jangan menaruh secret di ZIP, Git, HTML, atau JavaScript browser. Untuk Biteship/Midtrans produksi, simpan secret di pengelola secret server dan verifikasi webhook secara server-side.
