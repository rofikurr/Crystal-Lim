import { redirect } from "next/navigation";
import { getEffectivePermissionSlugs, getEffectiveUser } from "../../lib/auth/permissions";
import AdminClient from "./AdminClient";
import "./admin.css";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getEffectiveUser();
  if (!user) redirect("/admin/login?return_to=%2Fadmin");
  const permissionSlugs = await getEffectivePermissionSlugs();

  return (
    <AdminClient
      user={{
        name: user.name,
        email: user.email,
        actualRoleSlug: user.roleSlug,
        actualRoleName: user.roleName,
        effectiveRoleSlug: user.effectiveRoleSlug,
        isSystem: user.isSystem,
        viewingAs: user.viewingAs,
        permissions: permissionSlugs,
      }}
    />
  );
}
