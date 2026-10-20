"use client";

import ConfirmDeleteDialog from "@/components/shared/ConfirmDeleteDialog";
import type { Address } from "./types";

export default function AddressDeleteAlert({
  address,
  open,
  onOpenChange,
  onDeleted,
}: {
  address: Address | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}) {
  return (
    <ConfirmDeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Hapus alamat?"
      description={
        address && (
          <>
            Alamat <strong>{address.label}</strong> akan dihapus permanen.
          </>
        )
      }
      endpoint={address ? `/api/user/addresses/${address.id}` : null}
      successMessage="Alamat dihapus."
      errorFallback="Alamat gagal dihapus."
      onDeleted={onDeleted}
    />
  );
}
