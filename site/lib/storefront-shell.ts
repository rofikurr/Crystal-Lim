import { readFileSync } from "node:fs";
import path from "node:path";

const storefrontHtml = readFileSync(
  path.join(process.cwd(), "app", "storefront.html"),
  "utf-8",
);

function extract(startMarker: string, endMarker: string): string {
  const start = storefrontHtml.indexOf(startMarker);
  const end = storefrontHtml.indexOf(endMarker, start) + endMarker.length;
  if (start < 0 || end < 0) throw new Error(`Marker tidak ditemukan: ${startMarker}`);
  return storefrontHtml.slice(start, end);
}

const headHtml = extract("<head>", "</head>");
const footerHtml = extract('<footer class="compact-footer">', "</footer>");
const whatsappHtml = extract('<a class="floating-whatsapp"', "</a>");

/** Halaman konten statis (Tentang Kami, Cara Pesan) — reuse head/footer/WA
 * dari storefront.html (semuanya statis, tanpa app.js/commerce.js karena
 * tidak butuh fitur katalog/keranjang). */
export function renderContentPage(title: string, bodyHtml: string): string {
  return `<!doctype html><html lang="id">${headHtml.replace(/<title>.*?<\/title>/, `<title>${title}</title>`)}<body>
  <header class="site-header content-page-header">
    <a class="brand" href="/" aria-label="Crystal Lim, kembali ke beranda"><img class="brand-refined-logo" src="/assets/crystal-lim-logo-transparent.png" alt="Crystal Lim" width="1254" height="1254"></a>
    <nav class="desktop-nav" aria-label="Navigasi utama"><a href="/">Beranda</a><a href="/tentang-kami">Tentang Kami</a><a href="/cara-pesan">Cara Pesan</a></nav>
  </header>
  <main id="top" class="content-page">${bodyHtml}</main>
  ${footerHtml}
  ${whatsappHtml}
</body></html>`;
}
