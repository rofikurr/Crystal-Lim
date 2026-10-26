import { getServerTranslator } from "@/lib/i18n/server";
import AddressesClient from "./AddressesClient";

export const dynamic = "force-dynamic";

export default async function AlamatPage() {
  const t = await getServerTranslator();
  return (
    <>
      <div>
        <p className="text-xs font-bold tracking-widest text-accent-foreground">{t("common.myAccount")}</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("address.title")}</h1>
        <p className="mt-1 text-muted-foreground">
          {t("address.subtitle")}
        </p>
      </div>
      <AddressesClient />
    </>
  );
}
