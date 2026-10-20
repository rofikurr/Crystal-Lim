"use client";

import ConfirmDeleteDialog from "@/components/shared/ConfirmDeleteDialog";
import type { UserRow } from "./types";

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
  return (
    <ConfirmDeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Hapus user?"
      description={
        user && (
          <>
            User <strong>{user.name}</strong> ({user.email}) akan dihapus permanen. Tindakan ini
            tidak dapat dibatalkan.
          </>
        )
      }
      endpoint={user ? `/api/admin/users/${user.id}` : null}
      successMessage="User dihapus."
      errorFallback="User gagal dihapus."
      onDeleted={onDeleted}
    />
  );
}
