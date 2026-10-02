"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import UserDeleteAlert from "./UserDeleteAlert";
import UserFormDialog from "./UserFormDialog";
import UsersTable from "./UsersTable";
import type { RoleOption, UserRow } from "./types";

export default function UsersClient({ currentUserId }: { currentUserId: number }) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);

  async function refresh() {
    const [usersRes, rolesRes] = await Promise.all([
      fetch("/api/admin/users", { cache: "no-store" }),
      fetch("/api/admin/roles", { cache: "no-store" }),
    ]);
    const usersData = (await usersRes.json()) as { error?: string; users: UserRow[] };
    if (!usersRes.ok) throw new Error(usersData.error || "Data user gagal dimuat.");
    const rolesData = (await rolesRes.json()) as { roles: RoleOption[] };
    setUsers(usersData.users);
    setRoles(rolesData.roles ?? []);
  }

  useEffect(() => {
    refresh()
      .catch((error) => toast.error(error instanceof Error ? error.message : "Data user gagal dimuat."))
      .finally(() => setLoading(false));
  }, []);

  async function patchUser(user: UserRow, patch: Record<string, unknown>, successMessage: string) {
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "User gagal diperbarui.");
      await refresh();
      toast.success(successMessage);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "User gagal diperbarui.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="size-4" /> Tambah user
        </Button>
      </div>

      <Card>
        <CardContent>
          {loading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Memuat user…</p>
          ) : (
            <UsersTable
              users={users}
              roles={roles}
              currentUserId={currentUserId}
              busy={busy}
              onChangeRole={(user, roleId) =>
                patchUser(user, { roleId }, "Role user diperbarui.")
              }
              onToggleStatus={(user) =>
                patchUser(
                  user,
                  { status: user.status === "active" ? "suspended" : "active" },
                  user.status === "active" ? "User dinonaktifkan." : "User diaktifkan.",
                )
              }
              onDelete={setDeleteTarget}
            />
          )}
        </CardContent>
      </Card>

      <UserFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        roles={roles}
        onCreated={refresh}
      />
      <UserDeleteAlert
        user={deleteTarget}
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onDeleted={refresh}
      />
    </div>
  );
}
