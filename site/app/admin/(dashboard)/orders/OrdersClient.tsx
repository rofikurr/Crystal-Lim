"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import OrderDetailSheet from "./OrderDetailSheet";
import OrdersTable from "./OrdersTable";
import type { Order, OrderStatus } from "./types";
import { useTranslation } from "@/lib/i18n/context";

export default function OrdersClient() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);

  async function refresh() {
    const response = await fetch("/api/admin/orders", { cache: "no-store" });
    const data = (await response.json()) as { error?: string; orders: Order[] };
    if (!response.ok) throw new Error(data.error || t("orders.client.loadFailed"));
    setOrders(data.orders);
  }

  useEffect(() => {
    refresh()
      .catch((error) => toast.error(error instanceof Error ? error.message : t("orders.client.loadFailed")))
      .finally(() => setLoading(false));
  }, []);

  async function changeStatus(order: Order, status: OrderStatus) {
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/orders/${encodeURIComponent(order.id)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || t("orders.client.statusUpdateFailed"));
      await refresh();
      toast.success(t("orders.client.statusUpdated"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("orders.client.statusUpdateFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent>
          {loading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">{t("orders.client.loading")}</p>
          ) : (
            <OrdersTable
              orders={orders}
              busy={busy}
              onDetail={setDetailOrder}
              onChangeStatus={changeStatus}
            />
          )}
        </CardContent>
      </Card>

      <OrderDetailSheet
        order={detailOrder}
        open={detailOrder !== null}
        onOpenChange={(open) => !open && setDetailOrder(null)}
        onSaved={refresh}
      />
    </div>
  );
}
