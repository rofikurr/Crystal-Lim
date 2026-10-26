"use client";

import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { BEST_SELLER_SLUG, isBestSeller, money, type Product } from "./types";
import { useTranslation } from "@/lib/i18n/context";

export default function ProductDetailSheet({
  product,
  open,
  onOpenChange,
}: {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {product && (
          <>
            <SheetHeader>
              <SheetTitle>{product.name}</SheetTitle>
              <SheetDescription>{money.format(product.price)}</SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-4 px-4 pb-4">
              <div className="flex flex-wrap gap-1.5">
                {isBestSeller(product) && <Badge>{t("admin.dashboard.bestSeller")}</Badge>}
                <Badge variant={product.published ? "secondary" : "outline"}>
                  {product.published ? t("products.detail.publishedInStore") : t("products.table.hidden")}
                </Badge>
                <Badge variant={product.stock > 0 ? "secondary" : "outline"} className={product.stock <= 0 ? "text-destructive" : ""}>
                  {product.stock > 0 ? t("products.detail.stockLabel", { stock: product.stock }) : t("products.detail.outOfStock")}
                </Badge>
                <Badge variant="secondary">{t("products.detail.weightLabel", { packed: product.packedWeight, net: product.netWeight })}</Badge>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(product.images.length > 0 ? product.images : [product.image]).map((src) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={src}
                    src={src}
                    alt={product.name}
                    className="aspect-square w-full rounded-md border border-border object-cover"
                  />
                ))}
              </div>
              <div>
                <p className="text-sm font-semibold">{t("products.detail.description")}</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                  {product.description || t("products.detail.noDescription")}
                </p>
              </div>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">{t("products.detail.category")}</dt>
                  <dd className="font-medium">
                    {product.categories.filter((c) => c.slug !== BEST_SELLER_SLUG).length > 0
                      ? product.categories
                          .filter((c) => c.slug !== BEST_SELLER_SLUG)
                          .map((c) => c.name)
                          .join(", ")
                      : t("products.table.none")}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("products.detail.displayOrder")}</dt>
                  <dd className="font-medium">{product.position}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("orders.detail.createdAt")}</dt>
                  <dd className="font-medium">{product.createdAt}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("products.detail.updatedAt")}</dt>
                  <dd className="font-medium">{product.updatedAt}</dd>
                </div>
              </dl>
              {product.url && (
                <a
                  href={product.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-primary underline underline-offset-4"
                >
                  {t("products.detail.viewSourceLink")}
                </a>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
