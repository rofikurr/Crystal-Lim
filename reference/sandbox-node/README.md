# Referensi integrasi lokal — bukan backend produksi

Folder ini berisi `server.cjs`, `product-data.js`, `server.test.cjs`, `signature.css` (fixture test), dan `.env.example` dari scaffold Node lama. Jalankan hanya untuk mempelajari alur Biteship Rates + Midtrans **sandbox** dan unit test:

```sh
node --test server.test.cjs
```

Jangan deploy scaffold ini bersama `site/`. Ia membaca katalog statis sendiri, menyimpan quote/sesi di memori (hilang saat restart), hanya listen di localhost, tidak memiliki database order, webhook terverifikasi, sinkronisasi WooCommerce, atau COD. Tim dev perlu memindahkan konsep integrasinya ke backend Worker/sistem produksi yang memakai katalog D1 serta data paket dan stok resmi.

`.env.example` hanya nama variabel; tidak berisi kunci API.
