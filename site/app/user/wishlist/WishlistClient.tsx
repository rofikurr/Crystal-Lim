"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type WishlistProduct = {
  id: string;
  name: string;
  price: number;
  image: string;
  url: string;
};

const money = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export default function WishlistClient() {
  const [products, setProducts] = useState<WishlistProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function refresh() {
    const response = await fetch("/api/user/wishlist", { cache: "no-store" });
    const data = (await response.json()) as { error?: string; products: WishlistProduct[] };
    if (!response.ok) throw new Error(data.error || "Wishlist gagal dimuat.");
    setProducts(data.products);
  }

  useEffect(() => {
    refresh()
      .catch((error) => toast.error(error instanceof Error ? error.message : "Wishlist gagal dimuat."))
      .finally(() => setLoading(false));
  }, []);

  async function remove(productId: string) {
    setBusyId(productId);
    try {
      const response = await fetch(`/api/user/wishlist/${encodeURIComponent(productId)}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Gagal menghapus dari wishlist.");
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menghapus dari wishlist.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Card>
      <CardContent>
        {loading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Memuat wishlist…</p>
        ) : products.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Belum ada produk tersimpan. Klik ikon hati di produk yang kamu suka!
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {products.map((product) => (
              <div key={product.id} className="flex flex-col gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={product.image}
                  alt=""
                  className="aspect-square w-full rounded-md border border-border object-cover"
                />
                <p className="text-sm font-medium">{product.name}</p>
                <p className="text-sm text-muted-foreground">{money.format(product.price)}</p>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busyId === product.id}
                  onClick={() => remove(product.id)}
                >
                  <Heart className="size-4 fill-current" /> Hapus
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
