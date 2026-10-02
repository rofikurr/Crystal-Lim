"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, ShieldCheck, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/admin", label: "Dashboard", permission: null, icon: LayoutDashboard },
  { href: "/admin/products", label: "Produk", permission: "products.manage", icon: Package },
  { href: "/admin/users", label: "Manajemen User", permission: "users.manage", icon: Users },
  { href: "/admin/roles", label: "Role & Permission", permission: "roles.manage", icon: ShieldCheck },
] as const;

export default function AdminSidebar({ permissions }: { permissions: string[] }) {
  const pathname = usePathname();

  return (
    <nav className="sticky top-16 flex h-[calc(100vh-4rem)] w-60 shrink-0 flex-col gap-1 overflow-y-auto border-r border-sidebar-border bg-sidebar p-4">
      {ITEMS.filter((item) => !item.permission || permissions.includes(item.permission)).map(
        (item) => {
          const active =
            item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                active && "bg-sidebar-accent text-sidebar-accent-foreground",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        },
      )}
    </nav>
  );
}
