import { readFileSync } from "node:fs";
import path from "node:path";
import { BEST_SELLER_SLUG, listProducts, type Product } from "../db/catalog";
import { getSetting } from "../db/settings";
import { getEffectiveUser } from "../lib/auth/permissions";
import { listAddresses } from "../db/addresses";
import { listWishlistProductIds } from "../db/wishlist";

export const dynamic = "force-dynamic";

const storefrontHtml = readFileSync(
  path.join(process.cwd(), "app", "storefront.html"),
  "utf-8",
);

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const escape = (value: string) => value.replace(/[&<>"']/g, char =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] || char);

function card(p: Product) {
  const name = escape(p.name), image = escape(p.image), id = escape(p.id);
  const href = escape(p.url || "#pilihan");
  const isBestSeller = p.categories.some(c => c.slug === BEST_SELLER_SLUG);
  const slugs = p.categories.map(c => c.slug).join(",");
  const eyebrow = p.categories
    .filter(c => c.slug !== BEST_SELLER_SLUG)
    .map(c => c.name.toUpperCase())
    .join(" · ");
  return `<article class="product" data-id="${id}" data-category="${escape(slugs)}" data-name="${name}" data-price="${p.price}" data-image="${image}">
    <div class="product-media"><a href="${href}"><img src="${image}" alt="${name}" loading="lazy"></a>
      ${isBestSeller ? '<span class="best-seller-badge">BEST SELLER</span>' : ""}
      <button class="wish" type="button" aria-label="Simpan ${name}">♡</button></div>
    <div class="product-info"><p>${escape(eyebrow)}</p><h3><a href="${href}">${name}</a></h3>
      <strong>${p.price}</strong><button class="add-button" type="button">Beli</button></div></article>`;
}

function filterButton(slug: string, name: string) {
  return `<button class="filter" data-filter="${escape(slug)}">${escape(name.toUpperCase())}</button>`;
}

function categoryMenuLink(slug: string, name: string) {
  return `<a href="#pilihan" data-filter="${escape(slug)}">${escape(name.toUpperCase())}</a>`;
}

const unavailablePage = `<!doctype html><html lang="id"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Crystal Lim</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700&display=swap" rel="stylesheet">
<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;font-family:'Manrope',sans-serif;background:radial-gradient(circle at 50% 10%,#fdfbf7 0%,#f3ede1 55%,#ece3d2 100%)}
.card{width:min(420px,100%);background:#fff;border:1px solid #e6dfd4;box-shadow:0 24px 60px -24px rgba(90,69,30,.25);padding:40px 36px;text-align:center}
img{display:block;margin:0 auto 16px;width:72px;height:72px;filter:drop-shadow(0 6px 14px rgba(181,138,72,.2))}
h1{font-size:22px;margin:0 0 8px;color:#25211b}p{color:#777067;font-size:14px;margin:0 0 24px}
a{display:inline-block;background:#b18a48;color:#fff;text-decoration:none;font-weight:700;padding:12px 22px}</style>
</head><body><div class="card"><img src="/assets/crystal-lim-logo-transparent.png" alt="Crystal Lim">
<h1>Toko sedang tidak tersedia</h1><p>Sedang ada gangguan sementara. Silakan muat ulang beberapa saat lagi.</p>
<a href="/">Muat ulang</a></div></body></html>`;

export async function GET() {
  try {
    const products = await listProducts().catch((error) => {
      console.error("Katalog produk gagal dimuat, tampilkan etalase kosong", error);
      return [];
    });
    const shippingFlatFee = await getSetting("shipping_flat_fee", "0")
      .then(Number)
      .catch((error) => {
        console.error("Pengaturan ongkir gagal dimuat, pakai default 0", error);
        return 0;
      });

    const effectiveUser = await getEffectiveUser().catch((error) => {
      console.error("Sesi pengguna gagal dibaca", error);
      return null;
    });
    const [userAddresses, userWishlist] = effectiveUser
      ? await Promise.all([
          listAddresses(effectiveUser.id).catch(() => []),
          listWishlistProductIds(effectiveUser.id).catch(() => []),
        ])
      : [[], []];
    const crystalUser = {
      loggedIn: Boolean(effectiveUser),
      name: effectiveUser?.name ?? "",
      wishlist: userWishlist,
      addresses: userAddresses,
    };

    const usedCategories = new Map<string, string>();
    for (const product of products) {
      for (const category of product.categories) {
        if (!usedCategories.has(category.slug)) usedCategories.set(category.slug, category.name);
      }
    }
    const startMarker = '<div class="product-grid">';
    const endMarker = '\n      </div>\n    </section>';
    const start = storefrontHtml.indexOf(startMarker);
    const end = storefrontHtml.indexOf(endMarker, start);
    if (start < 0 || end < 0) throw new Error("Kerangka katalog tidak ditemukan.");
    let html = storefrontHtml.slice(0, start + startMarker.length)
      + products.map(card).join("") + storefrontHtml.slice(end);
    html = html.replace(/<b id="result-count">\d+<\/b>/, `<b id="result-count">${products.length}</b>`);
    const filterButtons = [...usedCategories.entries()].map(([slug, name]) => filterButton(slug, name)).join("");
    html = html.replace('data-filter="all">Semua</button>', `data-filter="all">Semua</button>${filterButtons}`);
    html = html.replace('<strong id="shipping-fee-display">Rp0</strong>', `<strong id="shipping-fee-display">${rupiah.format(shippingFlatFee)}</strong>`);

    const categoryLinks = [...usedCategories.entries()].map(([slug, name]) => categoryMenuLink(slug, name)).join("");
    html = html.replace('<div class="category-menu" hidden></div>', `<div class="category-menu" hidden>${categoryLinks}</div>`);
    html = html.replace('<div class="menu-category-list" id="mobile-category-list"></div>', `<div class="menu-category-list" id="mobile-category-list">${categoryLinks}</div>`);

    const accountLabel = crystalUser.loggedIn ? `Hai, ${crystalUser.name}` : "Masuk";
    html = html.replace(
      'class="icon-button account-button" type="button" aria-label="Masuk" title="Masuk" aria-expanded="false"',
      `class="icon-button account-button${crystalUser.loggedIn ? " logged-in" : ""}" type="button" aria-label="${escape(accountLabel)}" title="${escape(accountLabel)}" aria-expanded="false"`,
    );
    const accountMenuHtml = crystalUser.loggedIn
      ? `<a href="/user/dashboard">Akun Saya</a><a href="/user/alamat">Alamat Saya</a><a href="/user/wishlist">Wishlist</a><a href="#" id="account-signout">Keluar</a>`
      : `<a href="/login">Masuk</a><a href="/daftar">Daftar</a>`;
    html = html.replace('<div class="category-menu" id="account-menu" hidden></div>', `<div class="category-menu" id="account-menu" hidden>${accountMenuHtml}</div>`);

    const catalog = JSON.stringify(products).replace(/</g, "\\u003c");
    const userData = JSON.stringify(crystalUser).replace(/</g, "\\u003c");
    html = html.replace('<script src="product-data.js"></script>', `<script>window.crystalCatalog=${catalog};window.crystalShipping={flatFee:${shippingFlatFee}};window.crystalUser=${userData};</script>`);
    return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
  } catch (error) {
    console.error("Storefront unavailable", error);
    return new Response(unavailablePage, { status: 503, headers: { "content-type": "text/html; charset=utf-8" } });
  }
}
