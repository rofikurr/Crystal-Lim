import { readFileSync } from "node:fs";
import path from "node:path";
import { listProducts, type Product } from "../db/catalog";

export const dynamic = "force-dynamic";

const storefrontHtml = readFileSync(
  path.join(process.cwd(), "app", "storefront.html"),
  "utf-8",
);

const escape = (value: string) => value.replace(/[&<>"']/g, char =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] || char);
const categoryName = (value: string) => ({
  jewelry: "JEWELRY", crystal: "CRYSTALS AND CHAKRA STONES", sinergi: "12 SINERGI KRISTAL",
  antique: "ANTIQUE", combination: "COMBINATION JEWELRY", loose: "LOOSE GEMSTONES",
  rough: "ROUGH STONES", herkimer: "HERKIMER DIAMOND",
} as Record<string,string>)[value] || value.toUpperCase();

function card(p: Product) {
  const name = escape(p.name), image = escape(p.image), id = escape(p.id);
  const href = escape(p.url || "#pilihan");
  return `<article class="product" data-id="${id}" data-category="${escape(p.category)}" data-name="${name}" data-price="${p.price}" data-image="${image}" data-best-seller="${p.bestSeller}">
    <div class="product-media"><a href="${href}"><img src="${image}" alt="${name}" loading="lazy"></a>
      ${p.bestSeller ? '<span class="best-seller-badge">BEST SELLER</span>' : ""}
      <button class="wish" type="button" aria-label="Simpan ${name}">♡</button></div>
    <div class="product-info"><p>${escape(categoryName(p.category))}</p><h3><a href="${href}">${name}</a></h3>
      <strong>${p.price}</strong><button class="add-button" type="button">Beli</button></div></article>`;
}

export async function GET() {
  try {
    const products = await listProducts();
    const startMarker = '<div class="product-grid">';
    const endMarker = '\n      </div>\n    </section>';
    const start = storefrontHtml.indexOf(startMarker);
    const end = storefrontHtml.indexOf(endMarker, start);
    if (start < 0 || end < 0) throw new Error("Kerangka katalog tidak ditemukan.");
    let html = storefrontHtml.slice(0, start + startMarker.length)
      + products.map(card).join("") + storefrontHtml.slice(end);
    html = html.replace(/<b id="result-count">\d+<\/b>/, `<b id="result-count">${products.length}</b>`);
    html = html.replace('data-filter="all">Semua</button>', 'data-filter="all">Semua</button><button class="filter" data-filter="best">BEST SELLER</button>');
    const catalog = JSON.stringify(products).replace(/</g, "\\u003c");
    html = html.replace('<script src="product-data.js"></script>', `<script>window.crystalCatalog=${catalog}</script>`);
    return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
  } catch (error) {
    console.error("Storefront unavailable", error);
    return new Response("Katalog sementara tidak tersedia. Silakan coba lagi nanti.", { status: 503, headers: { "content-type": "text/plain; charset=utf-8" } });
  }
}
