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
  if (users.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Belum ada user.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nama</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Aksi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => {
          const isSelf = user.id === currentUserId;
          return (
            <TableRow key={user.id}>
              <TableCell className="font-medium">
                {user.name} {isSelf && <span className="text-muted-foreground">(kamu)</span>}
              </TableCell>
              <TableCell className="text-muted-foreground">{user.email}</TableCell>
              <TableCell>
                <NativeSelect
                  size="sm"
                  value={user.roleId}
                  disabled={busy || isSelf}
                  title={isSelf ? "Tidak bisa ubah role akun sendiri" : undefined}
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
                  title={isSelf ? "Tidak bisa ubah status akun sendiri" : "Klik untuk ubah status"}
                  onClick={() => !isSelf && !busy && onToggleStatus(user)}
                >
                  {user.status === "active" ? "Aktif" : "Nonaktif"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={busy || isSelf}
                  title={isSelf ? "Tidak bisa hapus akun sendiri" : "Hapus user"}
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
