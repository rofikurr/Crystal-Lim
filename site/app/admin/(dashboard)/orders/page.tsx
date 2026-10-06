import { getEffectivePermissionSlugs } from "@/lib/auth/permissions";
import AccessDenied from "../AccessDenied";
import OrdersClient from "./OrdersClient";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const permissions = await getEffectivePermissionSlugs();
  if (!permissions.includes("orders.manage")) {
    return <AccessDenied message="Anda tidak memiliki izin untuk mengelola pesanan." />;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <p className="text-xs font-bold tracking-widest text-accent-foreground">PENJUALAN</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Pesanan</h1>
        <p className="mt-1 text-muted-foreground">Pantau pesanan masuk dan status pembayarannya.</p>
      </div>
      <OrdersClient />
    </div>
  );
}
