import { getCurrentUser, getEffectivePermissionSlugs } from "@/lib/auth/permissions";
import { getServerTranslator } from "@/lib/i18n/server";
import AccessDenied from "../AccessDenied";
import UsersClient from "./UsersClient";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const t = await getServerTranslator();
  const permissionSlugs = await getEffectivePermissionSlugs();
  if (!permissionSlugs.includes("users.manage")) {
    return <AccessDenied message={t("users.page.accessDenied")} />;
  }
  const currentUser = await getCurrentUser();

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <p className="text-xs font-bold tracking-widest text-accent-foreground">{t("users.page.tag")}</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("users.page.title")}</h1>
      </div>
      <UsersClient currentUserId={currentUser?.id ?? 0} />
    </div>
  );
}
