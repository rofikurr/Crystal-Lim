import { getEffectivePermissionSlugs } from "@/lib/auth/permissions";
import AccessDenied from "../AccessDenied";
import PengaturanClient from "./PengaturanClient";

export const dynamic = "force-dynamic";

export default async function PengaturanPage() {
  const permissions = await getEffectivePermissionSlugs();
  if (!permissions.includes("orders.manage")) {
    return <AccessDenied message="Anda tidak memiliki izin untuk mengubah pengaturan toko." />;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <p className="text-xs font-bold tracking-widest text-accent-foreground">TOKO</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Pengaturan</h1>
        <p className="mt-1 text-muted-foreground">
          Atur cara ongkos kirim dihitung untuk semua pesanan baru.
        </p>
      </div>
      <PengaturanClient />
    </div>
  );
}
