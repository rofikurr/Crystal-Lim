import { getEffectivePermissionSlugs } from "@/lib/auth/permissions";
import RolesClient from "./RolesClient";

export const dynamic = "force-dynamic";

export default async function RolesPage() {
  const permissionSlugs = await getEffectivePermissionSlugs();
  if (!permissionSlugs.includes("roles.manage")) {
    return (
      <div className="admin-denied">
        <h1>Akses terbatas</h1>
        <p>Anda tidak memiliki izin untuk mengelola role.</p>
      </div>
    );
  }

  return (
    <div className="admin-content">
      <div className="admin-intro">
        <div>
          <p>PENGATURAN</p>
          <h1>Role &amp; permission</h1>
        </div>
      </div>
      <RolesClient />
    </div>
  );
}
