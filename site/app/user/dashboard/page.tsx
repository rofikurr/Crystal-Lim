import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getEffectiveUser } from "@/lib/auth/permissions";
import { listOrdersForCustomer, type OrderStatus } from "@/db/orders";
import { formatRupiah } from "@/lib/format";
import { getServerTranslator } from "@/lib/i18n/server";
import type { TranslationKey } from "@/lib/i18n/translations";

export const dynamic = "force-dynamic";

const STATUS_KEYS: Record<OrderStatus, TranslationKey> = {
  pending: "orderStatus.pending",
  paid: "orderStatus.paid",
  shipped: "orderStatus.shipped",
  completed: "orderStatus.completed",
  cancelled: "orderStatus.cancelled",
  expired: "orderStatus.expired",
};

export default async function UserDashboardPage() {
  const t = await getServerTranslator();
  const user = await getEffectiveUser();
  const orders = user ? await listOrdersForCustomer(user.email, user.phone ?? "") : [];

  return (
    <>
      <div>
        <p className="text-xs font-bold tracking-widest text-accent-foreground">{t("common.myAccount")}</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("dashboard.welcome", { name: user?.name ?? "" })}</h1>
        <p className="mt-1 text-muted-foreground">{t("dashboard.subtitle")}</p>
      </div>

      <Card>
        <CardContent>
          <h2 className="mb-4 text-lg font-semibold">{t("dashboard.orderHistory")}</h2>
          {orders.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {t("dashboard.noOrders")}
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="flex flex-col gap-3 rounded-md border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">{order.items.map((i) => i.productName).join(", ")}</p>
                    <p className="text-xs text-muted-foreground">{order.createdAt}</p>
                  </div>
                  <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-1">
                    <p className="font-semibold">{formatRupiah(order.total)}</p>
                    <Badge variant="secondary">{t(STATUS_KEYS[order.status])}</Badge>
                    {order.status === "pending" && order.xenditInvoiceUrl && (
                      <Button size="sm" asChild>
                        <a href={order.xenditInvoiceUrl} target="_blank" rel="noreferrer">
                          {t("dashboard.payNow")}
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
