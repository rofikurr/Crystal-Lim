import { redirect } from "next/navigation";
import { getEffectiveUser } from "@/lib/auth/permissions";
import UserTabs from "./UserTabs";
import UserTopbar from "./UserTopbar";

export const dynamic = "force-dynamic";

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const user = await getEffectiveUser();
  if (!user) redirect("/login?return_to=/user/dashboard");

  return (
    <div className="min-h-screen bg-background">
      <UserTopbar
        user={{
          name: user.name,
          email: user.email,
          actualRoleName: user.roleName,
          viewingAs: user.viewingAs,
        }}
      />
      <main className="mx-auto max-w-3xl space-y-6 p-6 lg:p-8">
        <UserTabs />
        {children}
      </main>
    </div>
  );
}
