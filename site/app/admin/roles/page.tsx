import { redirect } from "next/navigation";
import { getEffectivePermissionSlugs, getEffectiveUser } from "../../../lib/auth/permissions";
import RolesClient from "./RolesClient";
import "../admin.css";

export const dynamic = "force-dynamic";

export default async function RolesPage() {
  const user = await getEffectiveUser();
  if (!user) redirect("/admin/login?return_to=%2Fadmin%2Froles");
  const permissionSlugs = await getEffectivePermissionSlugs();
  if (!permissionSlugs.includes("roles.manage")) {
    return (
      <main className="admin-denied">
        <h1>Akses terbatas</h1>
        <p>Anda tidak memiliki izin untuk mengelola role.</p>
        <a href="/admin">Kembali ke admin</a>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <a className="admin-brand" href="/admin">◇ <span>CRYSTAL LIM</span><small>ADMIN</small></a>
        <div><a href="/admin">Kembali</a></div>
      </header>
      <div className="admin-content">
        <div className="admin-intro">
          <div><p>PENGATURAN</p><h1>Role &amp; permission</h1></div>
        </div>
        <RolesClient />
      </div>
    </main>
  );
}
