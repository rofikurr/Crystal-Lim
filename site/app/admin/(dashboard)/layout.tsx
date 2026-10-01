import { redirect } from "next/navigation";
import { getEffectivePermissionSlugs, getEffectiveUser } from "@/lib/auth/permissions";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";
import "@/app/admin/admin.css";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getEffectiveUser();
  if (!user) redirect("/admin/login");
  const permissions = await getEffectivePermissionSlugs();

  return (
    <div className="admin-shell">
      <AdminTopbar
        user={{
          name: user.name,
          email: user.email,
          actualRoleSlug: user.roleSlug,
          actualRoleName: user.roleName,
          effectiveRoleSlug: user.effectiveRoleSlug,
          isSystem: user.isSystem,
          viewingAs: user.viewingAs,
        }}
      />
      <div className="admin-layout">
        <AdminSidebar permissions={permissions} />
        <main className="admin-main">{children}</main>
      </div>
    </div>
  );
}
