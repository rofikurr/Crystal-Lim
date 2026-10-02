export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  images: string[];
  url: string;
  bestSeller: boolean;
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
  category: "jewelry",
  image: "",
  images: [],
  url: "",
  bestSeller: false,
  published: true,
  position: 0,
  createdAt: "",
  updatedAt: "",
};

export const CATEGORIES: [string, string][] = [
  ["jewelry", "Jewelry"],
  ["crystal", "Crystals & Chakra Stones"],
  ["sinergi", "12 Sinergi Kristal"],
  ["antique", "Antique"],
  ["combination", "Combination Jewelry"],
  ["loose", "Loose Gemstones"],
  ["rough", "Rough Stones"],
  ["herkimer", "Herkimer Diamond"],
];

export const money = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});
