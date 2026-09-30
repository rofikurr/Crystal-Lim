# Crystal Lim preview + admin

Site publik ini memakai Vinext/Cloudflare Worker, D1 untuk katalog, dan R2 untuk foto yang diunggah. Etalase tetap publik; `/admin` dilindungi login ChatGPT dan daftar email admin di server (`app/admin/auth.ts`). Saat ini hanya akun pemilik **aditamarizki@gmail.com** yang diizinkan. Jangan menaruh email atau sandi admin di kode browser.

## Yang sudah berjalan

- Tambah, edit, hapus, sembunyikan produk; urutan tampil; kategori; harga dan deskripsi.
- Unggah foto utama JPG/PNG/WebP hingga 5 MB, atau isi URL foto dan galeri.
- Tandai **Best seller** secara manual. Produk bertanda mendapat lencana dan filter di etalase.
- Produk awal berasal dari enam produk preview lama dan disimpan sekali ke D1. Setelah itu sumber kebenaran adalah D1, bukan `db/seed-products.js`.
- Etalase menampilkan perubahan tanpa deploy ulang. Data checkout, tarif ongkir, dan pembayaran tetap **tidak aktif** di preview ini.

## Pengembangan lokal

```sh
npm ci
npm run db:generate # hanya setelah mengubah db/schema.ts
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_green_nightcrawler.sql
npm run dev
```

Mock login lokal tersedia di `/signin-with-chatgpt?return_to=/admin` untuk pengujian. Akun mock tidak diberi akses di build produksi. Migrasi D1 baru harus selalu ditambahkan, jangan mengubah migrasi yang sudah terbit.

## Sebelum menjadi toko transaksi sungguhan

1. Dapatkan persetujuan akun/email klien yang boleh menjadi admin, lalu tambahkan ke allowlist server atau mekanisme peran yang setara.
2. Integrasikan dan uji API ongkir serta payment gateway dengan kredensial server. Jangan mengaktifkan tombol bayar sebelum keduanya benar-benar berfungsi.
3. Konfirmasi stok, berat/dimensi paket, harga, dan kebijakan pengiriman dengan Crystal Lim.
4. Bila katalog utama tetap WooCommerce, tentukan sinkronisasi atau migrasi. Admin preview ini **tidak mengubah** produk di crystal-lim.com.

Site ID dan binding berada di `.openai/hosting.json`. Jangan menaruh API key atau kredensial di repository.
