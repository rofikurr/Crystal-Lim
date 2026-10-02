import { Eye, Package, ShieldCheck, Star, Users } from "lucide-react";
import { db } from "@/db";
import { listProducts } from "@/db/catalog";
import { roles, users } from "@/db/schema";
import { getEffectivePermissionSlugs } from "@/lib/auth/permissions";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
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
          value={products.filter((p) => p.bestSeller).length}
        />
        {totalUsers !== null && <StatCard icon={Users} label="Total user" value={totalUsers} />}
        {totalRoles !== null && (
          <StatCard icon={ShieldCheck} label="Total role" value={totalRoles} />
        )}
      </div>
      <Card>
        <CardContent className="text-sm text-muted-foreground">
          Laporan pendapatan: belum ada data — sistem order/checkout belum aktif.
        </CardContent>
      </Card>
    </div>
  );
}
