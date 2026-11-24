import { getEffectivePermissionSlugs } from "@/lib/auth/permissions";
import { getServerTranslator } from "@/lib/i18n/server";
import AccessDenied from "../AccessDenied";
import RolesClient from "./RolesClient";

export const dynamic = "force-dynamic";

export default async function RolesPage() {
  const t = await getServerTranslator();
  const permissionSlugs = await getEffectivePermissionSlugs();
  if (!permissionSlugs.includes("roles.manage")) {
    return <AccessDenied message={t("roles.page.accessDenied")} />;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <p className="text-xs font-bold tracking-widest text-accent-foreground">{t("users.page.tag")}</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("roles.page.title")}</h1>
      </div>
      <RolesClient />
    </div>
  );
}
