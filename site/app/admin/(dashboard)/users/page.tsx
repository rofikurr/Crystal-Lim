import { getCurrentUser, getEffectivePermissionSlugs } from "@/lib/auth/permissions";
import AccessDenied from "../AccessDenied";
import UsersClient from "./UsersClient";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const permissionSlugs = await getEffectivePermissionSlugs();
  if (!permissionSlugs.includes("users.manage")) {
    return <AccessDenied message="Anda tidak memiliki izin untuk mengelola user." />;
  }
  const currentUser = await getCurrentUser();

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <p className="text-xs font-bold tracking-widest text-accent-foreground">PENGATURAN</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Manajemen user</h1>
      </div>
      <UsersClient currentUserId={currentUser?.id ?? 0} />
    </div>
  );
}
