import { getCurrentUser, getEffectivePermissionSlugs } from "@/lib/auth/permissions";
import UsersClient from "./UsersClient";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const permissionSlugs = await getEffectivePermissionSlugs();
  if (!permissionSlugs.includes("users.manage")) {
    return (
      <div className="admin-denied">
        <h1>Akses terbatas</h1>
        <p>Anda tidak memiliki izin untuk mengelola user.</p>
      </div>
    );
  }
  const currentUser = await getCurrentUser();

  return (
    <div className="admin-content">
      <div className="admin-intro">
        <div>
          <p>PENGATURAN</p>
          <h1>Manajemen user</h1>
        </div>
      </div>
      <UsersClient currentUserId={currentUser?.id ?? 0} />
    </div>
  );
}
