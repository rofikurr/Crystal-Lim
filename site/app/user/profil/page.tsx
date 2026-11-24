import { getEffectiveUser } from "@/lib/auth/permissions";
import { getServerTranslator } from "@/lib/i18n/server";
import ProfileForm from "./ProfileForm";

export const dynamic = "force-dynamic";

export default async function ProfilPage() {
  const t = await getServerTranslator();
  const user = await getEffectiveUser();

  return (
    <>
      <div>
        <p className="text-xs font-bold tracking-widest text-accent-foreground">{t("common.myAccount")}</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("profile.title")}</h1>
        <p className="mt-1 text-muted-foreground">{t("profile.subtitle")}</p>
      </div>
      <ProfileForm
        initial={{ name: user?.name ?? "", phone: user?.phone ?? "", email: user?.email ?? "" }}
      />
    </>
  );
}
