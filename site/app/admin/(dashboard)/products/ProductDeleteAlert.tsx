"use client";

import ConfirmDeleteDialog from "@/components/shared/ConfirmDeleteDialog";
import type { Product } from "./types";
import { useTranslation } from "@/lib/i18n/context";

export default function ProductDeleteAlert({
  product,
  open,
  onOpenChange,
  onDeleted,
}: {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}) {
  const { t } = useTranslation();
  return (
    <ConfirmDeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("products.delete.title")}
      description={product && t("products.delete.description", { name: product.name })}
      endpoint={product ? `/api/admin/products/${encodeURIComponent(product.id)}` : null}
      successMessage={t("products.delete.success")}
      errorFallback={t("products.delete.failed")}
      onDeleted={onDeleted}
    />
  );
}
