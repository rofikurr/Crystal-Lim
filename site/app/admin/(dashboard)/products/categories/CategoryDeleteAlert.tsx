"use client";

import ConfirmDeleteDialog from "@/components/shared/ConfirmDeleteDialog";
import type { Category } from "../types";
import { useTranslation } from "@/lib/i18n/context";

export default function CategoryDeleteAlert({
  category,
  open,
  onOpenChange,
  onDeleted,
}: {
  category: Category | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}) {
  const { t } = useTranslation();
  return (
    <ConfirmDeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("categories.delete.title")}
      description={category && t("categories.delete.description", { name: category.name })}
      endpoint={category ? `/api/admin/products/categories/${category.id}` : null}
      successMessage={t("categories.delete.success")}
      errorFallback={t("categories.delete.failed")}
      onDeleted={onDeleted}
    />
  );
}
