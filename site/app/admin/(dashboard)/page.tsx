import { Eye, Package, ShieldCheck, ShoppingBag, Star, Users, Wallet } from "lucide-react";
import { db } from "@/db";
import { BEST_SELLER_SLUG, listProducts } from "@/db/catalog";
import { listOrders } from "@/db/orders";
import { roles, users } from "@/db/schema";
import { getEffectivePermissionSlugs } from "@/lib/auth/permissions";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

const money = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-2xl font-bold leading-none">{value}</p>
          <p className="mt-1 text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const permissions = await getEffectivePermissionSlugs();
  const products = await listProducts(true);

  const totalUsers = permissions.includes("users.manage")
    ? (await db.select().from(users)).length
    : null;
  const totalRoles = permissions.includes("roles.manage")
    ? (await db.select().from(roles)).length
    : null;
  const orders = permissions.includes("orders.manage") ? await listOrders() : null;
  const revenue = orders
    ? orders
        .filter((o) => o.status === "paid" || o.status === "shipped" || o.status === "completed")
        .reduce((sum, o) => sum + o.total, 0)
    : null;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <p className="text-xs font-bold tracking-widest text-accent-foreground">OVERVIEW</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Ringkasan toko Crystal Lim.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Package} label="Total produk" value={products.length} />
        <StatCard
          icon={Eye}
          label="Tampil di toko"
          value={products.filter((p) => p.published).length}
        />
        <StatCard
          icon={Star}
          label="Best seller"
          value={products.filter((p) => p.categories.some((c) => c.slug === BEST_SELLER_SLUG)).length}
        />
        {orders !== null && (
          <StatCard icon={ShoppingBag} label="Total pesanan" value={orders.length} />
        )}
        {totalUsers !== null && <StatCard icon={Users} label="Total user" value={totalUsers} />}
        {totalRoles !== null && (
          <StatCard icon={ShieldCheck} label="Total role" value={totalRoles} />
        )}
      </div>
      {revenue !== null ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Wallet} label="Pendapatan (lunas)" value={money.format(revenue)} />
        </div>
      ) : (
        <Card>
          <CardContent className="text-sm text-muted-foreground">
            Laporan pendapatan: belum ada data — sistem order/checkout belum aktif.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
