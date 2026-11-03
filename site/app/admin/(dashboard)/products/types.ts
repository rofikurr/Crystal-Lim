import { formatRupiah } from "../../../../lib/format";

export type CategoryRef = { id: number; slug: string; name: string };

export type Category = CategoryRef & { isSystem: boolean; position: number };

export const BEST_SELLER_SLUG = "best-seller";

export type ProductVariant = {
  id?: number;
  label: string;
  price: number;
  stock: number;
  // null = pakai berat/dimensi produk induk (lihat ProductFormDialog)
  netWeight: number | null;
  packedWeight: number | null;
  netLength: number | null;
  netWidth: number | null;
  netHeight: number | null;
  packedLength: number | null;
  packedWidth: number | null;
  packedHeight: number | null;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  priceMax: number;
  stock: number;
  netWeight: number;
  packedWeight: number;
  netLength: number;
  netWidth: number;
  netHeight: number;
  packedLength: number;
  packedWidth: number;
  packedHeight: number;
  categories: CategoryRef[];
  image: string;
  images: string[];
  videos: string[];
  variants: ProductVariant[];
  url: string;
  published: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
};

export const EMPTY_PRODUCT: Product = {
  id: "",
  name: "",
  description: "",
  price: 0,
  priceMax: 0,
  stock: 9999,
  netWeight: 500,
  packedWeight: 500,
  netLength: 10,
  netWidth: 10,
  netHeight: 5,
  packedLength: 15,
  packedWidth: 10,
  packedHeight: 8,
  categories: [],
  image: "",
  images: [],
  videos: [],
  variants: [],
  url: "",
  published: true,
  position: 0,
  createdAt: "",
  updatedAt: "",
};

export const isBestSeller = (product: Product) =>
  product.categories.some((c) => c.slug === BEST_SELLER_SLUG);

export const money = { format: formatRupiah };

/** "Rp X" kalau harga seragam, atau "Rp X - Rp Y" kalau varian punya harga beda-beda. */
export const priceLabel = (product: Product) =>
  product.priceMax > product.price
    ? `${formatRupiah(product.price)} - ${formatRupiah(product.priceMax)}`
    : formatRupiah(product.price);
