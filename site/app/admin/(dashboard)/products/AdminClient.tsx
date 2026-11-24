"use client";

import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import ProductDeleteAlert from "./ProductDeleteAlert";
import ProductDetailSheet from "./ProductDetailSheet";
import ProductFormDialog from "./ProductFormDialog";
import ProductsTable from "./ProductsTable";
import { BEST_SELLER_SLUG, isBestSeller, type Category, type Product } from "./types";
import { useTranslation } from "@/lib/i18n/context";
import type { TranslationKey } from "@/lib/i18n/translations";

const FILTERS = [
  ["all", "products.admin.filterAll"],
  ["best", "admin.dashboard.bestSeller"],
  ["draft", "products.admin.filterDraft"],
] as const satisfies readonly (readonly [string, TranslationKey])[];

export default function AdminClient({ canManageProducts }: { canManageProducts: boolean }) {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<(typeof FILTERS)[number][0]>("all");
  const [query, setQuery] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);

  async function refresh() {
    const response = await fetch("/api/admin/products", { cache: "no-store" });
    const data = (await response.json()) as {
      error?: string;
      products: Product[];
      categories: Category[];
    };
    if (!response.ok) throw new Error(data.error || t("products.admin.loadFailed"));
    setProducts(data.products);
    setCategories(data.categories);
  }

  useEffect(() => {
    refresh()
      .catch((error) =>
        toast.error(error instanceof Error ? error.message : t("products.admin.loadFailed")),
      )
      .finally(() => setLoading(false));
  }, []);

  async function toggleBest(product: Product) {
    const bestSellerCategory = categories.find((c) => c.slug === BEST_SELLER_SLUG);
    if (!bestSellerCategory) return;
    const currentlyBest = isBestSeller(product);
    const categoryIds = currentlyBest
      ? product.categories.filter((c) => c.id !== bestSellerCategory.id).map((c) => c.id)
      : [...product.categories.map((c) => c.id), bestSellerCategory.id];
    setBusy(true);
    try {
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...product, categoryIds }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || t("products.admin.saveChangeFailed"));
      await refresh();
      toast.success(currentlyBest ? t("products.admin.bestSellerRemoved") : t("products.admin.bestSellerAdded"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("products.admin.saveChangeFailed"));
    } finally {
      setBusy(false);
    }
  }

  const shown = products.filter(
    (product) =>
      (filter === "all" ||
        (filter === "best" && isBestSeller(product)) ||
        (filter === "draft" && !product.published)) &&
      product.name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold tracking-widest text-accent-foreground">
            {t("products.admin.tag")}
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("products.admin.title")}</h1>
          <p className="mt-1 text-muted-foreground">
            {t("products.admin.subtitle")}
          </p>
        </div>
        {canManageProducts && (
          <Button
            onClick={() => {
              setEditingProduct(null);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4" /> {t("products.admin.addProduct")}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent>
            <p className="text-2xl font-bold">{products.length}</p>
            <p className="text-sm text-muted-foreground">{t("admin.dashboard.totalProducts")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-2xl font-bold">{products.filter((p) => p.published).length}</p>
            <p className="text-sm text-muted-foreground">{t("admin.dashboard.publishedInStore")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-2xl font-bold">{products.filter(isBestSeller).length}</p>
            <p className="text-sm text-muted-foreground">{t("admin.dashboard.bestSeller")}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-1 overflow-x-auto">
              {FILTERS.map(([value, labelKey]) => (
                <Button
                  key={value}
                  size="sm"
                  variant={filter === value ? "secondary" : "ghost"}
                  onClick={() => setFilter(value)}
                >
                  {t(labelKey)}
                </Button>
              ))}
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder={t("products.admin.searchPlaceholder")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">{t("products.admin.loading")}</p>
          ) : (
            <ProductsTable
              products={shown}
              canManageProducts={canManageProducts}
              busy={busy}
              onDetail={setDetailProduct}
              onEdit={(product) => {
                setEditingProduct(product);
                setFormOpen(true);
              }}
              onDelete={setDeleteTarget}
              onToggleBest={toggleBest}
            />
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        {t("products.admin.previewNote")}
      </p>

      <ProductFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        product={editingProduct}
        categories={categories}
        onSaved={refresh}
      />
      <ProductDeleteAlert
        product={deleteTarget}
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onDeleted={refresh}
      />
      <ProductDetailSheet
        product={detailProduct}
        open={detailProduct !== null}
        onOpenChange={(open) => !open && setDetailProduct(null)}
      />
    </div>
  );
}
