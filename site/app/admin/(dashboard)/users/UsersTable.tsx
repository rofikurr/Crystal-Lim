"use client";

import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { RoleOption, UserRow } from "./types";
import { useTranslation } from "@/lib/i18n/context";

export default function UsersTable({
  users,
  roles,
  currentUserId,
  busy,
  onChangeRole,
  onToggleStatus,
  onDelete,
}: {
  users: UserRow[];
  roles: RoleOption[];
  currentUserId: number;
  busy: boolean;
  onChangeRole: (user: UserRow, roleId: number) => void;
  onToggleStatus: (user: UserRow) => void;
  onDelete: (user: UserRow) => void;
}) {
  const { t } = useTranslation();
  if (users.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">{t("users.table.empty")}</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("users.table.name")}</TableHead>
          <TableHead>{t("common.email")}</TableHead>
          <TableHead>{t("users.table.role")}</TableHead>
          <TableHead>{t("orders.table.status")}</TableHead>
          <TableHead className="text-right">{t("orders.table.action")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => {
          const isSelf = user.id === currentUserId;
          return (
            <TableRow key={user.id}>
              <TableCell className="font-medium">
                {user.name} {isSelf && <span className="text-muted-foreground">{t("users.table.you")}</span>}
              </TableCell>
              <TableCell className="text-muted-foreground">{user.email}</TableCell>
              <TableCell>
                <NativeSelect
                  size="sm"
                  value={user.roleId}
                  disabled={busy || isSelf}
                  title={isSelf ? t("users.table.cantChangeOwnRole") : undefined}
                  onChange={(e) => onChangeRole(user, Number(e.target.value))}
                >
                  {roles.map((r) => (
                    <NativeSelectOption key={r.id} value={r.id}>
                      {r.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </TableCell>
              <TableCell>
                <Badge
                  variant={user.status === "active" ? "secondary" : "outline"}
                  className="cursor-pointer"
                  title={isSelf ? t("users.table.cantChangeOwnStatus") : t("users.table.clickToChangeStatus")}
                  onClick={() => !isSelf && !busy && onToggleStatus(user)}
                >
                  {user.status === "active" ? t("users.table.active") : t("users.table.inactive")}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={busy || isSelf}
                  title={isSelf ? t("users.table.cantDeleteSelf") : t("users.table.deleteUser")}
                  className="text-destructive hover:text-destructive"
                  onClick={() => onDelete(user)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
