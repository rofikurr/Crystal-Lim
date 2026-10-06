export type CategoryRef = { id: number; slug: string; name: string };

export type Category = CategoryRef & { isSystem: boolean; position: number };

export const BEST_SELLER_SLUG = "best-seller";

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  categories: CategoryRef[];
  image: string;
  images: string[];
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
  categories: [],
  image: "",
  images: [],
  url: "",
  published: true,
  position: 0,
  createdAt: "",
  updatedAt: "",
};

export const isBestSeller = (product: Product) =>
  product.categories.some((c) => c.slug === BEST_SELLER_SLUG);

export const money = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});
