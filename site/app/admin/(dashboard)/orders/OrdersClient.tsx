"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import OrderDetailSheet from "./OrderDetailSheet";
import OrdersTable from "./OrdersTable";
import type { Order, OrderStatus } from "./types";

export default function OrdersClient() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [shippingFee, setShippingFee] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [savingFee, setSavingFee] = useState(false);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);

  async function refresh() {
    const [ordersRes, settingsRes] = await Promise.all([
      fetch("/api/admin/orders", { cache: "no-store" }),
      fetch("/api/admin/settings", { cache: "no-store" }),
    ]);
    const ordersData = (await ordersRes.json()) as { error?: string; orders: Order[] };
    const settingsData = (await settingsRes.json()) as { error?: string; shippingFlatFee: number };
    if (!ordersRes.ok) throw new Error(ordersData.error || "Pesanan gagal dimuat.");
    if (!settingsRes.ok) throw new Error(settingsData.error || "Pengaturan gagal dimuat.");
    setOrders(ordersData.orders);
    setShippingFee(settingsData.shippingFlatFee);
  }

  useEffect(() => {
    refresh()
      .catch((error) => toast.error(error instanceof Error ? error.message : "Data gagal dimuat."))
      .finally(() => setLoading(false));
  }, []);

  async function saveShippingFee(event: React.FormEvent) {
    event.preventDefault();
    setSavingFee(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ shippingFlatFee: shippingFee }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Ongkir gagal disimpan.");
      toast.success("Ongkir flat disimpan.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ongkir gagal disimpan.");
    } finally {
      setSavingFee(false);
    }
  }

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
          <form onSubmit={saveShippingFee} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="space-y-1.5">
              <Label htmlFor="shipping-fee">Ongkir flat (berlaku untuk semua pesanan)</Label>
              <Input
                id="shipping-fee"
                type="number"
                min={0}
                max={10000000}
                className="sm:w-48"
                value={shippingFee}
                onChange={(e) => setShippingFee(Number(e.target.value))}
              />
            </div>
            <Button type="submit" disabled={savingFee}>
              {savingFee ? "Menyimpan…" : "Simpan ongkir"}
            </Button>
          </form>
        </CardContent>
      </Card>

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
      />
    </div>
  );
}
