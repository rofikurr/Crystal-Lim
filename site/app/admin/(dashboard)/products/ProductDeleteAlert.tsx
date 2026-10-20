"use client";

import ConfirmDeleteDialog from "@/components/shared/ConfirmDeleteDialog";
import type { Product } from "./types";

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
  return (
    <ConfirmDeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Hapus produk?"
      description={
        product && (
          <>
            Produk <strong>{product.name}</strong> akan dihapus permanen dari katalog. Tindakan ini
            tidak dapat dibatalkan.
          </>
        )
      }
      endpoint={product ? `/api/admin/products/${encodeURIComponent(product.id)}` : null}
      successMessage="Produk dihapus."
      errorFallback="Produk gagal dihapus."
      onDeleted={onDeleted}
    />
  );
}
