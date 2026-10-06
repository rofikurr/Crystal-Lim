import { getEffectivePermissionSlugs } from "@/lib/auth/permissions";
import AccessDenied from "../AccessDenied";
import BroadcastClient from "./BroadcastClient";

export const dynamic = "force-dynamic";

export default async function BroadcastPage() {
  const permissions = await getEffectivePermissionSlugs();
  if (!permissions.includes("broadcast.manage")) {
    return <AccessDenied message="Anda tidak memiliki izin untuk mengelola broadcast email." />;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <p className="text-xs font-bold tracking-widest text-accent-foreground">PEMASARAN</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Broadcast Email</h1>
        <p className="mt-1 text-muted-foreground">
          Kirim email ke semua pelanggan yang sudah berlangganan newsletter.
        </p>
      </div>
      <BroadcastClient />
    </div>
  );
}
