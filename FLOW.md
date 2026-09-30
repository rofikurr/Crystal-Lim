# Alur produk

## 1. Pengunjung melihat dan memilih produk

```text
GET /
  → Worker membaca D1 (seed 6 produk lama hanya sekali)
  → hanya produk published=true dirender sebagai kartu
  → JS browser: cari / filter kategori / filter Best Seller / urutkan
  → klik Beli membuka detail + galeri
  → keranjang menyimpan ID & jumlah di localStorage perangkat
  → checkout preview menampilkan formulir, tetapi tidak mengirim data
```

Harga, nama, dan deskripsi yang muncul di etalase berasal dari D1. Data keranjang browser hanya untuk UX; ketika transaksi nyata dibuat, server **wajib** membaca ulang harga/stok dari data resmi, bukan mempercayai harga dari browser.

## 2. Admin mengubah katalog

```text
GET /admin
  → Sign in with ChatGPT bila belum login
  → server periksa email pada allowlist app/admin/auth.ts
  → GET /api/admin/products membaca semua produk, termasuk yang disembunyikan
  → POST /api/admin/products membuat/mengubah produk
  → DELETE /api/admin/products/:id menghapus produk
  → muat ulang / langsung melihat perubahan di etalase
```

Pengunjung tanpa login tidak dapat membuka API admin. Endpoint mutasi memeriksa Origin yang sama dan memvalidasi input di server. Jika ingin memberi Crystal akses, minta email akun ChatGPT-nya dan tambahkan secara eksplisit ke allowlist atau sistem peran yang ditinjau keamanan; jangan menggunakan password bersama dalam JavaScript.

## 3. Foto produk

```text
Admin pilih JPG/PNG/WebP ≤5 MB
  → POST /api/admin/upload
  → validasi server, simpan objek ke R2
  → simpan URL /media/:key pada produk di D1
  → GET /media/:key mengirim gambar publik
```

Foto tambahan saat ini dimasukkan sebagai URL satu per baris. Foto eksternal dari situs lama masih bergantung pada ketersediaan host aslinya. Jika produk dihapus, objek R2 yang pernah diunggah belum dibersihkan otomatis; tambahkan prosedur cleanup setelah kebijakan retensi disetujui.

## 4. Best seller

Admin menyalakan/mematikan `bestSeller` pada produk. Produk terbit yang aktif akan memiliki lencana dan muncul pada filter Best Seller. Ini **kurasi manual**, bukan klaim ranking penjualan. Untuk otomatisasi, sambungkan pesanan terverifikasi dan definisikan periode/metrik bersama klien terlebih dahulu.

## 5. Checkout produksi yang belum ada

```text
Pelanggan isi alamat
  → server cek stok, harga, berat/dimensi paket resmi
  → API ongkir memberi opsi layanan & tarif
  → pelanggan pilih kurir / COD bila didukung
  → server buat order dan total final (idempotent)
  → gateway pembayaran atau status COD
  → webhook terverifikasi mengubah status order
  → toko menerima notifikasi dan memenuhi pesanan
```

Saat ini `site/public/commerce.js` sengaja menolak panggilan API. `reference/sandbox-node/server.cjs` hanya contoh request Biteship dan Midtrans sandbox lokal. Ia belum menyediakan database order, webhook, sinkronisasi stok, atau COD produksi. Jangan menyalin kunci API ke frontend atau mengaktifkan tombol bayar hanya dengan mengganti satu baris fungsi `api()`.
