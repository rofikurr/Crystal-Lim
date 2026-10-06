import { renderContentPage } from "../../lib/storefront-shell";

export const dynamic = "force-static";

const body = `
  <p class="eyebrow">CRYSTAL LIM / PANDUAN</p>
  <h1>Cara Pesan</h1>
  <p>Belanja di Crystal Lim mudah dan aman — ikuti langkah berikut:</p>
  <ol>
    <li><strong>Pilih produk.</strong> Jelajahi koleksi di <a href="/#pilihan">etalase</a>, lalu tambahkan produk yang kamu suka ke keranjang.</li>
    <li><strong>Buka keranjang.</strong> Klik ikon keranjang di pojok kanan atas untuk melihat ringkasan belanja, lalu klik "Checkout".</li>
    <li><strong>Isi alamat pengiriman.</strong> Lengkapi data penerima dan alamat. Kalau kamu sudah <a href="/daftar">punya akun</a>, alamat tersimpan bisa dipakai langsung tanpa mengetik ulang.</li>
    <li><strong>Bayar lewat Xendit.</strong> Pilih metode pembayaran yang kamu mau — Virtual Account, e-wallet, QRIS, kartu, atau gerai retail — lalu selesaikan pembayaran.</li>
    <li><strong>Pesanan diproses.</strong> Setelah pembayaran dikonfirmasi, pesanan kamu akan diproses dan dikirim. Status pesanan bisa dicek kapan saja di <a href="/user/dashboard">halaman akun</a>.</li>
  </ol>
  <h2>Butuh bantuan?</h2>
  <p>Kalau ada kendala saat checkout atau mau tanya-tanya soal produk, hubungi kami lewat <a href="https://wa.me/6282111551128">WhatsApp</a>.</p>
`;

export async function GET() {
  const html = renderContentPage("Cara Pesan — Crystal Lim", body);
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}
