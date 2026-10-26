"use client";

import ConfirmDeleteDialog from "@/components/shared/ConfirmDeleteDialog";
import type { Address } from "./types";
import { useTranslation } from "@/lib/i18n/context";

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
  const { t } = useTranslation();
  return (
    <ConfirmDeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("address.deleteTitle")}
      description={address && t("address.deleteConfirm", { label: address.label })}
      endpoint={address ? `/api/user/addresses/${address.id}` : null}
      successMessage={t("address.deleted")}
      errorFallback={t("address.deleteFailed")}
      onDeleted={onDeleted}
    />
  );
}
