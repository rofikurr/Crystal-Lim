import { getEffectivePermissionSlugs } from "@/lib/auth/permissions";
import AccessDenied from "../AccessDenied";
import RolesClient from "./RolesClient";

export const dynamic = "force-dynamic";

export default async function RolesPage() {
  const permissionSlugs = await getEffectivePermissionSlugs();
  if (!permissionSlugs.includes("roles.manage")) {
    return <AccessDenied message="Anda tidak memiliki izin untuk mengelola role." />;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <p className="text-xs font-bold tracking-widest text-accent-foreground">PENGATURAN</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Role &amp; permission</h1>
      </div>
      <RolesClient />
    </div>
  );
}
