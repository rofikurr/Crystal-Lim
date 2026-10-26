"use client";

import ConfirmDeleteDialog from "@/components/shared/ConfirmDeleteDialog";
import type { Role } from "./types";
import { useTranslation } from "@/lib/i18n/context";

export default function RoleDeleteAlert({
  role,
  open,
  onOpenChange,
  onDeleted,
}: {
  role: Role | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}) {
  const { t } = useTranslation();
  return (
    <ConfirmDeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("roles.delete.title")}
      description={role && t("roles.delete.description", { name: role.name })}
      endpoint={role ? `/api/admin/roles/${role.id}` : null}
      successMessage={t("roles.delete.success")}
      errorFallback={t("roles.delete.failed")}
      onDeleted={onDeleted}
    />
  );
}
