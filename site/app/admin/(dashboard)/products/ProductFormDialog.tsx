"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BEST_SELLER_SLUG, EMPTY_PRODUCT, type Category, type Product } from "./types";

export default function ProductFormDialog({
  open,
  onOpenChange,
  product,
  categories,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  categories: Category[];
  onSaved: () => void;
}) {
  const [form, setForm] = useState<Product>(EMPTY_PRODUCT);
  const [categoryIds, setCategoryIds] = useState<number[]>([]);
  const [gallery, setGallery] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const next = product ? { ...product, images: [...product.images] } : { ...EMPTY_PRODUCT };
    setForm(next);
    setCategoryIds(next.categories.map((c) => c.id));
    setGallery(next.images.filter((url) => url !== next.image).join("\n"));
  }, [open, product]);

  function update<K extends keyof Product>(key: K, value: Product[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleCategory(id: number, checked: boolean) {
    setCategoryIds((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)));
  }

  const bestSellerCategory = categories.find((c) => c.slug === BEST_SELLER_SLUG);
  const isBestSeller = bestSellerCategory ? categoryIds.includes(bestSellerCategory.id) : false;

  async function upload(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const body = new FormData();
      body.append("image", file);
      const response = await fetch("/api/admin/upload", { method: "POST", body });
      const data = (await response.json()) as { error?: string; url: string };
      if (!response.ok) throw new Error(data.error || "Foto gagal diunggah.");
      update("image", data.url);
      toast.success("Foto berhasil diunggah. Simpan produk untuk menampilkannya.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Foto gagal diunggah.");
    } finally {
      setUploading(false);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const payload = {
        ...form,
        images: gallery
          .split("\n")
          .map((x) => x.trim())
          .filter(Boolean),
        categoryIds,
      };
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as { error?: string; product: Product };
      if (!response.ok) throw new Error(data.error || "Produk gagal disimpan.");
      toast.success(`${data.product.name} berhasil disimpan.`);
      onOpenChange(false);
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Produk gagal disimpan.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{form.id ? "Edit produk" : "Tambah produk"}</DialogTitle>
          <DialogDescription>
            Perubahan langsung tampil di etalase setelah disimpan.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="product-name">Nama produk</Label>
              <Input
                id="product-name"
                required
                maxLength={140}
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="product-price">Harga (Rp)</Label>
              <Input
                id="product-price"
                required
                type="number"
                min={0}
                max={1000000000}
                value={form.price}
                onChange={(e) => update("price", Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <div className="flex items-center justify-between">
                <Label>Kategori</Label>
                {bestSellerCategory && (
                  <button
                    type="button"
                    title={isBestSeller ? "Lepas best seller" : "Jadikan best seller"}
                    onClick={() => toggleCategory(bestSellerCategory.id, !isBestSeller)}
                    className="flex items-center gap-1 text-xs font-medium text-accent-foreground"
                  >
                    <Star className={`size-4 ${isBestSeller ? "fill-current" : ""}`} />
                    Best seller
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-2 rounded-md border border-border p-3">
                {categories.length === 0 && (
                  <p className="text-sm text-muted-foreground">Belum ada kategori.</p>
                )}
                {categories.map((category) => (
                  <label key={category.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={categoryIds.includes(category.id)}
                      onCheckedChange={(checked) => toggleCategory(category.id, checked === true)}
                    />
                    {category.slug === BEST_SELLER_SLUG && (
                      <Star className="size-3.5 text-accent-foreground" />
                    )}
                    {category.name}
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="product-description">Deskripsi</Label>
              <Textarea
                id="product-description"
                rows={4}
                maxLength={3000}
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="product-photo">Foto utama</Label>
              <Input
                id="product-photo"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={uploading}
                onChange={(e) => upload(e.target.files?.[0])}
              />
              <p className="text-xs text-muted-foreground">
                {uploading ? "Mengunggah…" : "JPG, PNG, atau WebP, maksimal 5 MB."}
              </p>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="product-image-url">Atau URL foto utama</Label>
              <Input
                id="product-image-url"
                required
                value={form.image}
                placeholder="https://... atau /media/..."
                onChange={(e) => update("image", e.target.value)}
              />
              {form.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.image}
                  alt="Pratinjau foto produk"
                  className="mt-2 size-28 rounded-md border border-border object-cover"
                />
              )}
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="product-gallery">Foto tambahan (satu URL per baris)</Label>
              <Textarea
                id="product-gallery"
                rows={3}
                value={gallery}
                placeholder="https://..."
                onChange={(e) => setGallery(e.target.value)}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="product-source-url">Link produk asli (opsional)</Label>
              <Input
                id="product-source-url"
                type="url"
                value={form.url}
                placeholder="https://crystal-lim.com/..."
                onChange={(e) => update("url", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="product-position">Urutan tampil</Label>
              <Input
                id="product-position"
                type="number"
                min={0}
                max={10000}
                value={form.position}
                onChange={(e) => update("position", Number(e.target.value))}
              />
            </div>
            <div className="flex items-center gap-6 sm:col-span-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Checkbox
                  checked={form.published}
                  onCheckedChange={(checked) => update("published", checked === true)}
                />
                Tampilkan di toko
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Menyimpan…" : "Simpan produk"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
