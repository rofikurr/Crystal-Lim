"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronRight, Star } from "lucide-react";
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
import { postJson } from "@/lib/api-client";
import { BEST_SELLER_SLUG, EMPTY_PRODUCT, money, type Category, type Product, type ProductVariant } from "./types";

function youtubeEmbedUrl(url: string): string | null {
  const match = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([a-zA-Z0-9_-]{6,})/.exec(url);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}
import { useTranslation } from "@/lib/i18n/context";

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
  const { t } = useTranslation();
  const [form, setForm] = useState<Product>(EMPTY_PRODUCT);
  const [categoryIds, setCategoryIds] = useState<number[]>([]);
  const [gallery, setGallery] = useState<string[]>([]);
  const [galleryUrlInput, setGalleryUrlInput] = useState("");
  const [videoUrlInput, setVideoUrlInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const dragIndex = useRef<number | null>(null);
  const [expandedVariants, setExpandedVariants] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!open) return;
    const next = product
      ? {
          ...product,
          images: [...product.images],
          videos: [...product.videos],
          variants: product.variants.map((v) => ({ ...v })),
        }
      : { ...EMPTY_PRODUCT };
    setForm(next);
    setCategoryIds(next.categories.map((c) => c.id));
    setGallery([next.image, ...next.images.filter((url) => url !== next.image)].filter(Boolean));
    setGalleryUrlInput("");
    setVideoUrlInput("");
    setExpandedVariants(
      new Set(
        next.variants
          .map((v, i) =>
            [v.netWeight, v.packedWeight, v.netLength, v.netWidth, v.netHeight, v.packedLength, v.packedWidth, v.packedHeight].some(
              (x) => x !== null,
            )
              ? i
              : -1,
          )
          .filter((i) => i >= 0),
      ),
    );
  }, [open, product]);

  function update<K extends keyof Product>(key: K, value: Product[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleCategory(id: number, checked: boolean) {
    setCategoryIds((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)));
  }

  function addVariant() {
    setForm((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          label: "", price: prev.price, stock: 0,
          netWeight: null, packedWeight: null,
          netLength: null, netWidth: null, netHeight: null,
          packedLength: null, packedWidth: null, packedHeight: null,
        },
      ],
    }));
  }

  function updateVariant(index: number, patch: Partial<ProductVariant>) {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((v, i) => (i === index ? { ...v, ...patch } : v)),
    }));
  }

  function removeVariant(index: number) {
    setForm((prev) => ({ ...prev, variants: prev.variants.filter((_, i) => i !== index) }));
    setExpandedVariants((prev) => new Set([...prev].filter((i) => i !== index).map((i) => (i > index ? i - 1 : i))));
  }

  function toggleVariantDimensions(index: number) {
    setExpandedVariants((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function clearVariantDimensions(index: number) {
    updateVariant(index, {
      netWeight: null, packedWeight: null,
      netLength: null, netWidth: null, netHeight: null,
      packedLength: null, packedWidth: null, packedHeight: null,
    });
  }

  const bestSellerCategory = categories.find((c) => c.slug === BEST_SELLER_SLUG);
  const isBestSeller = bestSellerCategory ? categoryIds.includes(bestSellerCategory.id) : false;
  const hasVariants = form.variants.length > 0;
  const variantStockSum = form.variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
  const variantPrices = form.variants.map((v) => Number(v.price) || 0);
  const variantPriceMin = variantPrices.length ? Math.min(...variantPrices) : 0;
  const variantPriceMax = variantPrices.length ? Math.max(...variantPrices) : 0;

  async function uploadVideoFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const remaining = 5 - form.videos.length;
    if (remaining <= 0) {
      toast.error(t("products.form.videoLimitReached"));
      return;
    }
    const selected = Array.from(files).slice(0, remaining);
    setUploadingVideo(true);
    try {
      const uploaded: string[] = [];
      for (const file of selected) {
        const body = new FormData();
        body.append("video", file);
        const response = await fetch("/api/admin/upload", { method: "POST", body });
        const data = (await response.json()) as { error?: string; url: string };
        if (!response.ok) throw new Error(data.error || t("products.form.uploadVideoFailed"));
        uploaded.push(data.url);
      }
      update("videos", [...form.videos, ...uploaded]);
      toast.success(t("products.form.uploadVideoSuccess"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("products.form.uploadVideoFailed"));
    } finally {
      setUploadingVideo(false);
    }
  }

  function addVideoUrl() {
    const url = videoUrlInput.trim();
    if (!url) return;
    if (form.videos.length >= 5) {
      toast.error(t("products.form.videoLimitReached"));
      return;
    }
    update("videos", [...form.videos, url]);
    setVideoUrlInput("");
  }

  function removeVideo(index: number) {
    update(
      "videos",
      form.videos.filter((_, i) => i !== index),
    );
  }

  async function uploadGalleryFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const remaining = 12 - gallery.length;
    if (remaining <= 0) {
      toast.error(t("products.form.galleryLimitReached"));
      return;
    }
    const selected = Array.from(files).slice(0, remaining);
    setUploadingGallery(true);
    try {
      const uploaded: string[] = [];
      for (const file of selected) {
        const body = new FormData();
        body.append("image", file);
        const response = await fetch("/api/admin/upload", { method: "POST", body });
        const data = (await response.json()) as { error?: string; url: string };
        if (!response.ok) throw new Error(data.error || t("products.form.uploadFailed"));
        uploaded.push(data.url);
      }
      setGallery((prev) => [...prev, ...uploaded]);
      toast.success(t("products.form.uploadSuccess"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("products.form.uploadFailed"));
    } finally {
      setUploadingGallery(false);
    }
  }

  function addGalleryUrl() {
    const url = galleryUrlInput.trim();
    if (!url) return;
    if (gallery.length >= 12) {
      toast.error(t("products.form.galleryLimitReached"));
      return;
    }
    setGallery((prev) => [...prev, url]);
    setGalleryUrlInput("");
  }

  function removeGalleryImage(index: number) {
    setGallery((prev) => prev.filter((_, i) => i !== index));
  }

  function reorderGallery(from: number, to: number) {
    if (from === to) return;
    setGallery((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const photos = gallery.map((x) => x.trim()).filter(Boolean);
    if (photos.length === 0) {
      toast.error(t("products.form.photoRequired"));
      return;
    }
    setBusy(true);
    try {
      const payload = {
        ...form,
        image: photos[0],
        images: photos,
        categoryIds,
        variants: form.variants
          .map((v) => ({ ...v, label: v.label.trim() }))
          .filter((v) => v.label.length > 0),
      };
      const data = await postJson<{ product: Product }>("/api/admin/products", payload);
      toast.success(t("products.form.saveSuccess", { name: data.product.name }));
      onOpenChange(false);
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("products.form.saveFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{form.id ? t("products.form.editTitle") : t("products.form.addTitle")}</DialogTitle>
          <DialogDescription>
            {t("products.form.formHint")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="product-name">{t("products.form.name")}</Label>
              <Input
                id="product-name"
                required
                maxLength={140}
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="product-price">{t("products.form.price")}</Label>
              {hasVariants ? (
                <>
                  <Input
                    disabled
                    value={
                      variantPriceMin === variantPriceMax
                        ? money.format(variantPriceMin)
                        : `${money.format(variantPriceMin)} - ${money.format(variantPriceMax)}`
                    }
                  />
                  <p className="text-xs text-muted-foreground">{t("products.form.priceFromVariants")}</p>
                </>
              ) : (
                <Input
                  id="product-price"
                  required
                  type="number"
                  min={0}
                  max={1000000000}
                  value={form.price}
                  onChange={(e) => update("price", Number(e.target.value))}
                />
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="product-stock">{t("products.table.stock")}</Label>
              {hasVariants ? (
                <>
                  <Input disabled value={variantStockSum} />
                  <p className="text-xs text-muted-foreground">{t("products.form.stockFromVariants")}</p>
                </>
              ) : (
                <Input
                  id="product-stock"
                  required
                  type="number"
                  min={0}
                  max={1000000}
                  value={form.stock}
                  onChange={(e) => update("stock", Number(e.target.value))}
                />
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="product-net-weight">{t("products.form.netWeight")}</Label>
              <Input
                id="product-net-weight"
                required
                type="number"
                min={1}
                max={50000}
                value={form.netWeight}
                onChange={(e) => update("netWeight", Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="product-packed-weight">{t("products.form.packedWeight")}</Label>
              <Input
                id="product-packed-weight"
                required
                type="number"
                min={1}
                max={50000}
                value={form.packedWeight}
                onChange={(e) => update("packedWeight", Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>{t("products.form.netDimensions")}</Label>
              <div className="flex gap-2">
                <Input
                  aria-label={t("products.form.netLength")}
                  type="number"
                  min={1}
                  max={300}
                  value={form.netLength}
                  onChange={(e) => update("netLength", Number(e.target.value))}
                />
                <Input
                  aria-label={t("products.form.netWidth")}
                  type="number"
                  min={1}
                  max={300}
                  value={form.netWidth}
                  onChange={(e) => update("netWidth", Number(e.target.value))}
                />
                <Input
                  aria-label={t("products.form.netHeight")}
                  type="number"
                  min={1}
                  max={300}
                  value={form.netHeight}
                  onChange={(e) => update("netHeight", Number(e.target.value))}
                />
              </div>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>{t("products.form.packedDimensions")}</Label>
              <div className="flex gap-2">
                <Input
                  aria-label={t("products.form.packedLength")}
                  type="number"
                  min={1}
                  max={300}
                  value={form.packedLength}
                  onChange={(e) => update("packedLength", Number(e.target.value))}
                />
                <Input
                  aria-label={t("products.form.packedWidth")}
                  type="number"
                  min={1}
                  max={300}
                  value={form.packedWidth}
                  onChange={(e) => update("packedWidth", Number(e.target.value))}
                />
                <Input
                  aria-label={t("products.form.packedHeight")}
                  type="number"
                  min={1}
                  max={300}
                  value={form.packedHeight}
                  onChange={(e) => update("packedHeight", Number(e.target.value))}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {t("products.form.volumetricHint")}
              </p>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <div className="flex items-center justify-between">
                <Label>{t("products.form.category")}</Label>
                {bestSellerCategory && (
                  <button
                    type="button"
                    title={isBestSeller ? t("products.table.removeBestSeller") : t("products.table.makeBestSeller")}
                    onClick={() => toggleCategory(bestSellerCategory.id, !isBestSeller)}
                    className="flex items-center gap-1 text-xs font-medium text-accent-foreground"
                  >
                    <Star className={`size-4 ${isBestSeller ? "fill-current" : ""}`} />
                    {t("admin.dashboard.bestSeller")}
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-2 rounded-md border border-border p-3">
                {categories.length === 0 && (
                  <p className="text-sm text-muted-foreground">{t("products.form.noCategory")}</p>
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
              <Label htmlFor="product-description">{t("products.form.description")}</Label>
              <Textarea
                id="product-description"
                rows={12}
                maxLength={20000}
                className="min-h-56"
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>{t("products.form.video")}</Label>
              <p className="text-xs text-muted-foreground">{t("products.form.uploadVideoHint")}</p>
              <p className="text-xs text-muted-foreground">{t("products.form.videoAlwaysFirst")}</p>
              <div className="flex flex-wrap gap-2">
                {form.videos.map((url, index) => (
                  <div key={index} className="relative h-20 w-32 shrink-0 overflow-hidden rounded-md border border-border bg-black">
                    {youtubeEmbedUrl(url) ? (
                      <iframe src={youtubeEmbedUrl(url)!} title={`Video ${index + 1}`} className="size-full" />
                    ) : (
                      <video src={url} controls className="size-full object-contain" />
                    )}
                    <button
                      type="button"
                      onClick={() => removeVideo(index)}
                      aria-label={t("products.form.removeVideo")}
                      className="absolute right-0.5 top-0.5 flex size-5 items-center justify-center rounded-full bg-black/60 text-xs leading-none text-white"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {form.videos.length < 5 && (
                  <label className="flex h-20 w-32 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border text-center text-[11px] text-muted-foreground hover:bg-accent">
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime"
                      multiple
                      disabled={uploadingVideo}
                      className="hidden"
                      onChange={(e) => {
                        uploadVideoFiles(e.target.files);
                        e.target.value = "";
                      }}
                    />
                    <span>{uploadingVideo ? t("products.form.uploadingVideo") : `+ ${t("products.form.addVideo")}`}</span>
                  </label>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  value={videoUrlInput}
                  placeholder="https://... (link YouTube juga bisa)"
                  onChange={(e) => setVideoUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addVideoUrl();
                    }
                  }}
                />
                <Button type="button" variant="outline" size="sm" onClick={addVideoUrl}>
                  {t("products.form.addFromUrl")}
                </Button>
              </div>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>{t("products.form.gallery")}</Label>
              <p className="text-xs text-muted-foreground">{t("products.form.photoDragHint")}</p>
              <div className="flex flex-wrap gap-2">
                {gallery.map((url, index) => (
                  <div
                    key={index}
                    draggable
                    onDragStart={() => {
                      dragIndex.current = index;
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (dragIndex.current !== null) reorderGallery(dragIndex.current, index);
                      dragIndex.current = null;
                    }}
                    className="relative size-20 shrink-0 cursor-move overflow-hidden rounded-md border border-border"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="size-full object-cover" />
                    {index === 0 && (
                      <span className="absolute bottom-0.5 left-0.5 rounded bg-black/60 px-1 text-[9px] leading-tight text-white">
                        {t("products.form.mainBadge")}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeGalleryImage(index)}
                      aria-label={t("products.form.removePhoto")}
                      className="absolute right-0.5 top-0.5 flex size-5 items-center justify-center rounded-full bg-black/60 text-xs leading-none text-white"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {gallery.length < 12 && (
                  <label className="flex size-20 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border text-center text-[11px] text-muted-foreground hover:bg-accent">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      disabled={uploadingGallery}
                      className="hidden"
                      onChange={(e) => {
                        uploadGalleryFiles(e.target.files);
                        e.target.value = "";
                      }}
                    />
                    <span>{uploadingGallery ? t("products.form.uploading") : `+ ${t("products.form.addPhoto")}`}</span>
                  </label>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  value={galleryUrlInput}
                  placeholder="https://..."
                  onChange={(e) => setGalleryUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addGalleryUrl();
                    }
                  }}
                />
                <Button type="button" variant="outline" size="sm" onClick={addGalleryUrl}>
                  {t("products.form.addFromUrl")}
                </Button>
              </div>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>{t("products.form.variants")}</Label>
              <p className="text-xs text-muted-foreground">{t("products.form.variantsHint")}</p>
              <div className="flex flex-col gap-2">
                {form.variants.map((variant, index) => (
                  <div key={index} className="rounded-md border border-border p-2">
                    <div className="grid grid-cols-[2fr_1fr_1fr_auto] items-end gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs font-normal text-muted-foreground">{t("products.form.variantName")}</Label>
                        <Input
                          placeholder={t("products.form.variantLabelPlaceholder")}
                          value={variant.label}
                          onChange={(e) => updateVariant(index, { label: e.target.value })}
                          maxLength={140}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-normal text-muted-foreground">{t("products.form.variantPricePlaceholder")}</Label>
                        <Input
                          type="number"
                          min={0}
                          max={1000000000}
                          value={variant.price}
                          onChange={(e) => updateVariant(index, { price: Number(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-normal text-muted-foreground">{t("products.form.variantStockPlaceholder")}</Label>
                        <Input
                          type="number"
                          min={0}
                          max={1000000}
                          value={variant.stock}
                          onChange={(e) => updateVariant(index, { stock: Number(e.target.value) })}
                        />
                      </div>
                      <Button type="button" variant="outline" size="icon-sm" onClick={() => removeVariant(index)} aria-label={t("common.delete")}>
                        ×
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => toggleVariantDimensions(index)}
                      className="mt-2"
                    >
                      {expandedVariants.has(index) ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                      {t("products.form.variantDimensionsToggle")}
                    </Button>
                    {expandedVariants.has(index) && (
                      <div className="mt-2 space-y-3 border-t border-border pt-2">
                        <p className="text-[11px] text-muted-foreground">{t("products.form.variantDimensionsHint")}</p>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs font-normal text-muted-foreground">{t("products.form.netWeight")}</Label>
                            <Input
                              placeholder={String(form.netWeight)}
                              type="number"
                              min={1}
                              max={50000}
                              value={variant.netWeight ?? ""}
                              onChange={(e) => updateVariant(index, { netWeight: e.target.value === "" ? null : Number(e.target.value) })}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-normal text-muted-foreground">{t("products.form.packedWeight")}</Label>
                            <Input
                              placeholder={String(form.packedWeight)}
                              type="number"
                              min={1}
                              max={50000}
                              value={variant.packedWeight ?? ""}
                              onChange={(e) => updateVariant(index, { packedWeight: e.target.value === "" ? null : Number(e.target.value) })}
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-normal text-muted-foreground">{t("products.form.netDimensions")}</Label>
                          <div className="flex gap-2">
                            <Input
                              aria-label={t("products.form.netLength")}
                              placeholder={String(form.netLength)}
                              type="number"
                              min={1}
                              max={300}
                              value={variant.netLength ?? ""}
                              onChange={(e) => updateVariant(index, { netLength: e.target.value === "" ? null : Number(e.target.value) })}
                            />
                            <Input
                              aria-label={t("products.form.netWidth")}
                              placeholder={String(form.netWidth)}
                              type="number"
                              min={1}
                              max={300}
                              value={variant.netWidth ?? ""}
                              onChange={(e) => updateVariant(index, { netWidth: e.target.value === "" ? null : Number(e.target.value) })}
                            />
                            <Input
                              aria-label={t("products.form.netHeight")}
                              placeholder={String(form.netHeight)}
                              type="number"
                              min={1}
                              max={300}
                              value={variant.netHeight ?? ""}
                              onChange={(e) => updateVariant(index, { netHeight: e.target.value === "" ? null : Number(e.target.value) })}
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-normal text-muted-foreground">{t("products.form.packedDimensions")}</Label>
                          <div className="flex gap-2">
                            <Input
                              aria-label={t("products.form.packedLength")}
                              placeholder={String(form.packedLength)}
                              type="number"
                              min={1}
                              max={300}
                              value={variant.packedLength ?? ""}
                              onChange={(e) => updateVariant(index, { packedLength: e.target.value === "" ? null : Number(e.target.value) })}
                            />
                            <Input
                              aria-label={t("products.form.packedWidth")}
                              placeholder={String(form.packedWidth)}
                              type="number"
                              min={1}
                              max={300}
                              value={variant.packedWidth ?? ""}
                              onChange={(e) => updateVariant(index, { packedWidth: e.target.value === "" ? null : Number(e.target.value) })}
                            />
                            <Input
                              aria-label={t("products.form.packedHeight")}
                              placeholder={String(form.packedHeight)}
                              type="number"
                              min={1}
                              max={300}
                              value={variant.packedHeight ?? ""}
                              onChange={(e) => updateVariant(index, { packedHeight: e.target.value === "" ? null : Number(e.target.value) })}
                            />
                          </div>
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={() => clearVariantDimensions(index)}>
                          {t("products.form.variantUseDefault")}
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                {t("products.form.addVariant")}
              </Button>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="product-source-url">{t("products.form.sourceUrl")}</Label>
              <Input
                id="product-source-url"
                type="url"
                value={form.url}
                placeholder="https://crystal-lim.com/..."
                onChange={(e) => update("url", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="product-position">{t("products.form.displayOrder")}</Label>
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
                {t("products.form.showInStore")}
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? t("common.saving") : t("products.form.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
