"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, LayoutDashboard, Package, ShieldCheck, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/admin", label: "Dashboard", permission: null, icon: LayoutDashboard },
  {
    label: "Produk",
    permission: "products.manage",
    icon: Package,
    children: [
      { href: "/admin/products", label: "Semua Produk" },
      { href: "/admin/products/categories", label: "Kategori" },
    ],
  },
  { href: "/admin/users", label: "Manajemen User", permission: "users.manage", icon: Users },
  { href: "/admin/roles", label: "Role & Permission", permission: "roles.manage", icon: ShieldCheck },
] as const;

export default function AdminSidebar({ permissions }: { permissions: string[] }) {
  const pathname = usePathname();
  const productsActive = pathname.startsWith("/admin/products");
  const [productsOpen, setProductsOpen] = useState(productsActive);

  return (
    <nav className="sticky top-16 flex h-[calc(100vh-4rem)] w-60 shrink-0 flex-col gap-1 overflow-y-auto border-r border-sidebar-border bg-sidebar p-4">
      {ITEMS.filter((item) => !item.permission || permissions.includes(item.permission)).map(
        (item) => {
          const Icon = item.icon;
          if ("children" in item) {
            const open = productsOpen || productsActive;
            return (
              <div key={item.label}>
                <button
                  type="button"
                  onClick={() => setProductsOpen((prev) => !prev)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    productsActive && "text-sidebar-accent-foreground",
                  )}
                >
                  <Icon className="size-4" />
                  <span className="flex-1 text-left">{item.label}</span>
                  <ChevronDown
                    className={cn("size-4 transition-transform", open && "rotate-180")}
                  />
                </button>
                {open && (
                  <div className="ml-4 flex flex-col gap-1 border-l border-sidebar-border pl-3 pt-1">
                    {item.children.map((child) => {
                      const active = pathname === child.href;
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            "rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                            active && "bg-sidebar-accent text-sidebar-accent-foreground",
                          )}
                        >
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }
          const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
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
