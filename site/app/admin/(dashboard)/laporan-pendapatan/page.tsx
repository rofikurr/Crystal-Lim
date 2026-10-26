import { getEffectivePermissionSlugs } from "@/lib/auth/permissions";
import { getServerTranslator } from "@/lib/i18n/server";
import AccessDenied from "../AccessDenied";
import LaporanPendapatanClient from "./LaporanPendapatanClient";

export const dynamic = "force-dynamic";

export default async function LaporanPendapatanPage() {
  const t = await getServerTranslator();
  const permissions = await getEffectivePermissionSlugs();
  if (!permissions.includes("orders.manage")) {
    return <AccessDenied message={t("report.accessDenied")} />;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <p className="text-xs font-bold tracking-widest text-accent-foreground">{t("admin.storeTag")}</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("report.pageTitle")}</h1>
        <p className="mt-1 text-muted-foreground">
          {t("report.pageSubtitle")}
        </p>
      </div>
      <LaporanPendapatanClient />
    </div>
  );
}
