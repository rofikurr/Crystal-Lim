"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS: { href: string; label: string; permission: string | null }[] = [
  { href: "/admin", label: "Dashboard", permission: null },
  { href: "/admin/products", label: "Produk", permission: "products.manage" },
  { href: "/admin/users", label: "Manajemen User", permission: "users.manage" },
  { href: "/admin/roles", label: "Role & Permission", permission: "roles.manage" },
];

export default function AdminSidebar({ permissions }: { permissions: string[] }) {
  const pathname = usePathname();

  return (
    <nav className="admin-sidebar">
      {ITEMS.filter((item) => !item.permission || permissions.includes(item.permission)).map(
        (item) => {
          const active =
            item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} className={active ? "active" : ""}>
              {item.label}
            </Link>
          );
        },
      )}
    </nav>
  );
}
