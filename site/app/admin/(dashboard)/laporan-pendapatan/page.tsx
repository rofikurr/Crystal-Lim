import { getEffectivePermissionSlugs } from "@/lib/auth/permissions";
import AccessDenied from "../AccessDenied";
import LaporanPendapatanClient from "./LaporanPendapatanClient";

export const dynamic = "force-dynamic";

export default async function LaporanPendapatanPage() {
  const permissions = await getEffectivePermissionSlugs();
  if (!permissions.includes("orders.manage")) {
    return <AccessDenied message="Anda tidak memiliki izin untuk melihat laporan pendapatan." />;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <p className="text-xs font-bold tracking-widest text-accent-foreground">TOKO</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Laporan Pendapatan</h1>
        <p className="mt-1 text-muted-foreground">
          Pendapatan dari pesanan berstatus dibayar, dikirim, atau selesai.
        </p>
      </div>
      <LaporanPendapatanClient />
    </div>
  );
}
