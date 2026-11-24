import { Eye, Package, ShieldCheck, ShoppingBag, Star, Users, Wallet } from "lucide-react";
import { BEST_SELLER_SLUG, listProducts } from "@/db/catalog";
import { getDailyRevenue, getTopProducts, listOrders } from "@/db/orders";
import { countRoles } from "@/db/roles";
import { countUsers } from "@/db/users";
import { getEffectivePermissionSlugs } from "@/lib/auth/permissions";
import { formatRupiah } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getServerTranslator } from "@/lib/i18n/server";
import RevenueChart from "./RevenueChart";

const REVENUE_WINDOW_DAYS = 14;

export const dynamic = "force-dynamic";

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
  const t = await getServerTranslator();
  const permissions = await getEffectivePermissionSlugs();
  const products = await listProducts(true);

  const totalUsers = permissions.includes("users.manage") ? await countUsers() : null;
  const totalRoles = permissions.includes("roles.manage") ? await countRoles() : null;
  const canViewOrders = permissions.includes("orders.manage");
  const orders = canViewOrders ? await listOrders() : null;
  const revenue = orders
    ? orders
        .filter((o) => o.status === "paid" || o.status === "shipped" || o.status === "completed")
        .reduce((sum, o) => sum + o.total, 0)
    : null;
  const dailyRevenue = canViewOrders ? await getDailyRevenue(REVENUE_WINDOW_DAYS) : null;
  const topProducts = canViewOrders ? await getTopProducts(REVENUE_WINDOW_DAYS) : null;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <p className="text-xs font-bold tracking-widest text-accent-foreground">{t("admin.dashboard.overview")}</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("admin.dashboard.title")}</h1>
        <p className="mt-1 text-muted-foreground">{t("admin.dashboard.subtitle")}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Package} label={t("admin.dashboard.totalProducts")} value={products.length} />
        <StatCard
          icon={Eye}
          label={t("admin.dashboard.publishedInStore")}
          value={products.filter((p) => p.published).length}
        />
        <StatCard
          icon={Star}
          label={t("admin.dashboard.bestSeller")}
          value={products.filter((p) => p.categories.some((c) => c.slug === BEST_SELLER_SLUG)).length}
        />
        {orders !== null && (
          <StatCard icon={ShoppingBag} label={t("admin.dashboard.totalOrders")} value={orders.length} />
        )}
        {totalUsers !== null && <StatCard icon={Users} label={t("admin.dashboard.totalUsers")} value={totalUsers} />}
        {totalRoles !== null && (
          <StatCard icon={ShieldCheck} label={t("admin.dashboard.totalRoles")} value={totalRoles} />
        )}
      </div>
      {revenue !== null ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={Wallet} label={t("admin.dashboard.revenuePaid")} value={formatRupiah(revenue)} />
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>{t("admin.dashboard.revenueLastDays", { days: REVENUE_WINDOW_DAYS })}</CardTitle>
              </CardHeader>
              <CardContent>
                <RevenueChart points={dailyRevenue ?? []} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{t("admin.dashboard.topProductsLastDays", { days: REVENUE_WINDOW_DAYS })}</CardTitle>
              </CardHeader>
              <CardContent>
                {topProducts && topProducts.length > 0 ? (
                  <ol className="space-y-3">
                    {topProducts.map((product, i) => (
                      <li key={product.productId} className="flex items-center justify-between gap-3 text-sm">
                        <span className="flex items-center gap-2 truncate">
                          <span className="text-muted-foreground">{i + 1}.</span>
                          <span className="truncate">{product.productName}</span>
                        </span>
                        <span className="shrink-0 font-medium">{product.quantity} {t("admin.dashboard.sold")}</span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm text-muted-foreground">{t("admin.dashboard.noSalesPeriod")}</p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="text-sm text-muted-foreground">
            {t("admin.dashboard.noRevenueData")}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
