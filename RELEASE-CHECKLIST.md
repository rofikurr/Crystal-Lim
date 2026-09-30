# Checklist dari preview ke toko aktif

## Keputusan pemilik toko

- [ ] Tentukan apakah katalog baru menjadi sumber utama atau tetap sinkron dengan WooCommerce `crystal-lim.com`.
- [ ] Setujui admin tambahan (email akun dan hak akses); tidak menggunakan akun/password bersama.
- [ ] Verifikasi semua harga, stok, foto, deskripsi, kategori, dan izin penggunaan aset.
- [ ] Sediakan alamat dan kode pos asal pengiriman, berat/dimensi **setelah dikemas** per produk.
- [ ] Putuskan kurir, area COD, biaya COD, asuransi, retur, dan kebijakan privasi.
- [ ] Siapkan akun dan kredensial API ongkir/payment gateway melalui jalur secret yang aman.

## Implementasi tim dev

- [ ] Migrasikan harga/stok dari sumber resmi ke server; jangan menerima nilai total dari browser.
- [ ] Buat tabel order, item order, status, idempotency key, dan audit trail.
- [ ] Tambahkan rate limiting, validasi input, kegagalan/timeout API, serta monitoring.
- [ ] Integrasikan tarif ongkir dan validasi ulang tarif saat membuat order.
- [ ] Implementasikan pembayaran dan webhook terverifikasi; browser redirect bukan bukti lunas.
- [ ] Implementasikan COD sebagai alur order terpisah dengan validasi layanan dan wilayah.
- [ ] Buat sinkronisasi stok, refund/pembatalan, dan notifikasi operasional.
- [ ] Uji akses admin dengan akun yang berhak dan yang tidak berhak.
- [ ] Uji checkout pada perangkat HP nyata, harga berubah, stok habis, ongkir gagal, webhook duplikat, dan order ulang.

## Rilis

- [ ] Terapkan migrasi D1 secara berurutan, verifikasi backup dan rollback.
- [ ] Uji di staging dengan kunci sandbox, lalu baru pindah ke kunci live di secret manager.
- [ ] Perbarui teks checkout, privasi, kontak, dan link menu yang masih menuju situs lama.
- [ ] Hapus label “Transaksi belum aktif” hanya setelah pembayaran/ongkir benar-benar bekerja.
- [ ] Lakukan pembelian uji end-to-end dan cocokkan order, kurir, status bayar, serta email/notifikasi.

Rollback aman untuk **kode**: deploy ulang versi Sites sebelumnya. Perubahan data D1/R2 tidak otomatis ikut rollback; simpan backup/ekspor sebelum migrasi atau perubahan data besar.
