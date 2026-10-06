"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { LogOut, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type TopbarUser = {
  name: string;
  email: string;
  actualRoleSlug: string;
  actualRoleName: string;
  effectiveRoleSlug: string;
  isSystem: boolean;
  viewingAs: boolean;
};
type RoleOption = { slug: string; name: string };

export default function AdminTopbar({ user }: { user: TopbarUser }) {
  const [roleOptions, setRoleOptions] = useState<RoleOption[]>([]);

  useEffect(() => {
    if (!user.isSystem) return;
    fetch("/api/admin/roles", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { roles: [] }))
      .then((data: { roles?: { slug: string; name: string }[] }) => {
        setRoleOptions((data.roles ?? []).map((r) => ({ slug: r.slug, name: r.name })));
      })
      .catch(() => {});
  }, [user.isSystem]);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  async function switchViewAs(roleSlug: string) {
    if (!roleSlug) {
      await fetch("/api/admin/view-as", { method: "DELETE" });
    } else {
      await fetch("/api/admin/view-as", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ roleSlug }),
      });
    }
    window.location.reload();
  }

  return (
    <>
      {user.viewingAs && (
        <div className="flex flex-wrap items-center justify-center gap-3 bg-[#3a2f1f] px-5 py-2.5 text-sm text-[#f5eedf]">
          <span>
            Sedang melihat sebagai: <strong>{user.effectiveRoleSlug}</strong> (akun asli:{" "}
            {user.actualRoleName})
          </span>
          <Button
            size="sm"
            variant="outline"
            className="h-7 border-[#d7c6a6] bg-transparent text-[#f5eedf] hover:bg-white/10 hover:text-[#f5eedf]"
            onClick={() => switchViewAs("")}
          >
            Kembali ke {user.actualRoleName}
          </Button>
        </div>
      )}
      <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
        <Link href="/admin" className="flex items-center gap-2">
          <Image
            src="/assets/crystal-lim-logo-transparent.png"
            alt="Crystal Lim"
            width={32}
            height={32}
          />
          <span className="text-base font-extrabold tracking-wide">CRYSTAL LIM</span>
          <span className="border-l border-border pl-2 text-[10px] tracking-widest text-muted-foreground">
            ADMIN
          </span>
        </Link>
        <div className="flex items-center gap-2">
          {user.isSystem && roleOptions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Lihat sebagai:{" "}
                  {user.viewingAs ? user.effectiveRoleSlug : `${user.actualRoleName} (asli)`}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Lihat sebagai</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => switchViewAs("")}>
                  {user.actualRoleName} (asli)
                </DropdownMenuItem>
                {roleOptions
                  .filter((r) => r.slug !== user.actualRoleSlug)
                  .map((r) => (
                    <DropdownMenuItem key={r.slug} onClick={() => switchViewAs(r.slug)}>
                      {r.name}
                    </DropdownMenuItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <span className="hidden text-sm text-muted-foreground sm:inline">{user.email}</span>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <Store className="size-4" /> Lihat toko
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={signOut}>
            <LogOut className="size-4" /> Keluar
          </Button>
        </div>
      </header>
    </>
  );
}
