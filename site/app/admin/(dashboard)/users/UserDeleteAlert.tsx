"use client";

import ConfirmDeleteDialog from "@/components/shared/ConfirmDeleteDialog";
import type { UserRow } from "./types";
import { useTranslation } from "@/lib/i18n/context";

export default function UserDeleteAlert({
  user,
  open,
  onOpenChange,
  onDeleted,
}: {
  user: UserRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}) {
  const { t } = useTranslation();
  return (
    <ConfirmDeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("users.delete.title")}
      description={user && t("users.delete.description", { name: user.name, email: user.email })}
      endpoint={user ? `/api/admin/users/${user.id}` : null}
      successMessage={t("users.delete.success")}
      errorFallback={t("users.delete.failed")}
      onDeleted={onDeleted}
    />
  );
}
