import { renderContentPage } from "../../lib/storefront-shell";

export const dynamic = "force-static";

const body = `
  <p class="eyebrow">CRYSTAL LIM / NATURAL COLLECTION</p>
  <h1>Tentang Kami</h1>
  <p>Crystal Lim adalah toko batu alam, kristal penyembuhan, perhiasan, dan spesimen mineral yang berbasis di Banyuwangi, Jawa Timur, Indonesia. Kami percaya setiap batu punya keunikan dan energinya sendiri — dari kristal murni, kombinasi 12 Sinergi Kristal, sampai perhiasan perak buatan tangan yang menggabungkan keindahan alam dengan kerajinan yang teliti.</p>
  <p>Setiap produk yang kami tawarkan dipilih dengan cermat, mulai dari batu mentah hingga perhiasan jadi, untuk memastikan kualitas yang bisa dipercaya oleh pelanggan kami.</p>
  <h2>Hubungi Kami</h2>
  <p>Punya pertanyaan soal produk atau pesanan? Tim kami siap membantu lewat WhatsApp atau email.</p>
  <ul>
    <li>WhatsApp: <a href="https://wa.me/6282111551128">+62 821-1155-1128</a></li>
    <li>Email: <a href="mailto:crystal.lim60@yahoo.com">crystal.lim60@yahoo.com</a></li>
    <li>Lokasi: Banyuwangi, Jawa Timur, Indonesia</li>
  </ul>
`;

export async function GET() {
  const html = renderContentPage("Tentang Kami — Crystal Lim", body);
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}
