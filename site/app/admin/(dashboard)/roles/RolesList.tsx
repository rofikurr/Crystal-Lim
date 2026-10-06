"use client";

import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import type { Permission, Role } from "./types";

export default function RolesList({
  roles,
  permissions,
  onTogglePermission,
  onDelete,
}: {
  roles: Role[];
  permissions: Permission[];
  onTogglePermission: (role: Role, permissionSlug: string, checked: boolean) => void;
  onDelete: (role: Role) => void;
}) {
  const grouped = permissions.reduce<Record<string, Permission[]>>((acc, p) => {
    (acc[p.group] ??= []).push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {roles.map((role) => (
        <Card key={role.id}>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                {role.name}
                <span className="text-xs font-normal text-muted-foreground">({role.slug})</span>
                {role.isSystem && <Badge variant="outline">Sistem</Badge>}
              </CardTitle>
              {role.isSystem && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Role sistem — akses penuh implisit, tidak bisa diubah.
                </p>
              )}
            </div>
            {!role.isSystem && (
              <Button
                variant="ghost"
                size="icon-sm"
                title="Hapus role"
                className="text-destructive hover:text-destructive"
                onClick={() => onDelete(role)}
              >
                <Trash2 className="size-4" />
              </Button>
            )}
          </CardHeader>
          {!role.isSystem && (
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {Object.entries(grouped).map(([group, perms]) => (
                  <fieldset key={group} className="rounded-md border border-border p-3">
                    <legend className="px-1 text-xs font-semibold text-muted-foreground">
                      {group}
                    </legend>
                    <div className="flex flex-col gap-2">
                      {perms.map((p) => (
                        <label key={p.slug} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={role.permissions.includes(p.slug)}
                            onCheckedChange={(checked) =>
                              onTogglePermission(role, p.slug, checked === true)
                            }
                          />
                          {p.label}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}
