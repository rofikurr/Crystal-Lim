import { getEffectivePermissionSlugs } from "@/lib/auth/permissions";
import { getServerTranslator } from "@/lib/i18n/server";
import AccessDenied from "../AccessDenied";
import AdminClient from "./AdminClient";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const t = await getServerTranslator();
  const permissions = await getEffectivePermissionSlugs();
  if (!permissions.includes("products.manage")) {
    return <AccessDenied message={t("products.page.accessDenied")} />;
  }

  return <AdminClient canManageProducts />;
}
