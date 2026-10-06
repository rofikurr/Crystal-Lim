import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getEffectiveUser } from "@/lib/auth/permissions";
import { listOrdersForCustomer, type OrderStatus } from "@/db/orders";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Menunggu bayar",
  paid: "Dibayar",
  shipped: "Dikirim",
  completed: "Selesai",
  cancelled: "Dibatalkan",
  expired: "Kedaluwarsa",
};

const money = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export default async function UserDashboardPage() {
  const user = await getEffectiveUser();
  const orders = user ? await listOrdersForCustomer(user.email, user.phone ?? "") : [];

  return (
    <>
      <div>
        <p className="text-xs font-bold tracking-widest text-accent-foreground">AKUN SAYA</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Selamat datang, {user?.name}</h1>
        <p className="mt-1 text-muted-foreground">Berikut riwayat pembelian kamu di Crystal Lim.</p>
      </div>

      <Card>
        <CardContent>
          <h2 className="mb-4 text-lg font-semibold">Riwayat pembelian</h2>
          {orders.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Belum ada riwayat pembelian. Yuk mulai belanja di toko!
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
                    <p className="font-semibold">{money.format(order.total)}</p>
                    <Badge variant="secondary">{STATUS_LABELS[order.status]}</Badge>
                    {order.status === "pending" && order.xenditInvoiceUrl && (
                      <Button size="sm" asChild>
                        <a href={order.xenditInvoiceUrl} target="_blank" rel="noreferrer">
                          Bayar sekarang
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
