"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import OrderDetailSheet from "./OrderDetailSheet";
import OrdersTable from "./OrdersTable";
import type { Order, OrderStatus } from "./types";

export default function OrdersClient() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);

  async function refresh() {
    const response = await fetch("/api/admin/orders", { cache: "no-store" });
    const data = (await response.json()) as { error?: string; orders: Order[] };
    if (!response.ok) throw new Error(data.error || "Pesanan gagal dimuat.");
    setOrders(data.orders);
  }

  useEffect(() => {
    refresh()
      .catch((error) => toast.error(error instanceof Error ? error.message : "Data gagal dimuat."))
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
      if (!response.ok) throw new Error(data.error || "Status gagal diperbarui.");
      await refresh();
      toast.success("Status pesanan diperbarui.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Status gagal diperbarui.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent>
          {loading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Memuat pesanan…</p>
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
