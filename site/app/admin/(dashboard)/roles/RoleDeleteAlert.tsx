"use client";

import ConfirmDeleteDialog from "@/components/shared/ConfirmDeleteDialog";
import type { Role } from "./types";

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
  return (
    <ConfirmDeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Hapus role?"
      description={
        role && (
          <>
            Role <strong>{role.name}</strong> akan dihapus permanen. Role yang masih dipakai user
            tidak bisa dihapus.
          </>
        )
      }
      endpoint={role ? `/api/admin/roles/${role.id}` : null}
      successMessage="Role dihapus."
      errorFallback="Role gagal dihapus."
      onDeleted={onDeleted}
    />
  );
}
