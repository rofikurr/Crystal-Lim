import { getEffectivePermissionSlugs } from "@/lib/auth/permissions";
import { getServerTranslator } from "@/lib/i18n/server";
import AccessDenied from "../AccessDenied";
import OrdersClient from "./OrdersClient";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const t = await getServerTranslator();
  const permissions = await getEffectivePermissionSlugs();
  if (!permissions.includes("orders.manage")) {
    return <AccessDenied message={t("orders.page.accessDenied")} />;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <p className="text-xs font-bold tracking-widest text-accent-foreground">{t("orders.page.tag")}</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("orders.page.title")}</h1>
        <p className="mt-1 text-muted-foreground">{t("orders.page.subtitle")}</p>
      </div>
      <OrdersClient />
    </div>
  );
}
