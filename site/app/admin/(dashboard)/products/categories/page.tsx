import { getEffectivePermissionSlugs } from "@/lib/auth/permissions";
import { getServerTranslator } from "@/lib/i18n/server";
import AccessDenied from "../../AccessDenied";
import CategoriesClient from "./CategoriesClient";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const t = await getServerTranslator();
  const permissions = await getEffectivePermissionSlugs();
  if (!permissions.includes("products.manage")) {
    return <AccessDenied message={t("categories.page.accessDenied")} />;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <p className="text-xs font-bold tracking-widest text-accent-foreground">
          {t("products.admin.tag")}
        </p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("categories.page.title")}</h1>
        <p className="mt-1 text-muted-foreground">
          {t("categories.page.subtitle")}
        </p>
      </div>
      <CategoriesClient />
    </div>
  );
}
