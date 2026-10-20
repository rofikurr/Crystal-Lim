"use client";

import ConfirmDeleteDialog from "@/components/shared/ConfirmDeleteDialog";
import type { Category } from "../types";

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
  return (
    <ConfirmDeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Hapus kategori?"
      description={
        category && (
          <>
            Kategori <strong>{category.name}</strong> akan dihapus permanen. Kategori yang masih
            dipakai produk tidak bisa dihapus.
          </>
        )
      }
      endpoint={category ? `/api/admin/products/categories/${category.id}` : null}
      successMessage="Kategori dihapus."
      errorFallback="Kategori gagal dihapus."
      onDeleted={onDeleted}
    />
  );
}
