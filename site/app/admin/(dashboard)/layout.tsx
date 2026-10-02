import { redirect } from "next/navigation";
import { getEffectivePermissionSlugs, getEffectiveUser } from "@/lib/auth/permissions";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";

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
    <div className="min-h-screen bg-background">
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
      <div className="flex">
        <AdminSidebar permissions={permissions} />
        <main className="min-w-0 flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
