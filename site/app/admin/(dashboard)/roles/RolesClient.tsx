"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import RoleDeleteAlert from "./RoleDeleteAlert";
import RoleFormDialog from "./RoleFormDialog";
import RolesList from "./RolesList";
import type { Permission, Role } from "./types";
import { useTranslation } from "@/lib/i18n/context";

export default function RolesClient() {
  const { t } = useTranslation();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);

  async function refresh() {
    const response = await fetch("/api/admin/roles", { cache: "no-store" });
    const data = (await response.json()) as {
      error?: string;
      roles: Role[];
      permissions: Permission[];
    };
    if (!response.ok) throw new Error(data.error || t("roles.loadFailed"));
    setRoles(data.roles);
    setPermissions(data.permissions);
  }

  useEffect(() => {
    refresh()
      .catch((error) => toast.error(error instanceof Error ? error.message : t("roles.loadFailed")))
      .finally(() => setLoading(false));
  }, []);

  async function togglePermission(role: Role, permissionSlug: string, checked: boolean) {
    const next = checked
      ? [...role.permissions, permissionSlug]
      : role.permissions.filter((p) => p !== permissionSlug);
    setRoles((prev) => prev.map((r) => (r.id === role.id ? { ...r, permissions: next } : r)));
    try {
      const response = await fetch(`/api/admin/roles/${role.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ permissionSlugs: next }),
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || t("roles.permissionUpdateFailed"));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("roles.permissionUpdateFailed"));
      await refresh();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="size-4" /> {t("roles.add")}
        </Button>
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">{t("roles.loading")}</p>
      ) : (
        <RolesList
          roles={roles}
          permissions={permissions}
          onTogglePermission={togglePermission}
          onDelete={setDeleteTarget}
        />
      )}

      <RoleFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        permissions={permissions}
        onCreated={refresh}
      />
      <RoleDeleteAlert
        role={deleteTarget}
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onDeleted={refresh}
      />
    </div>
  );
}
