import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import RegisterForm from "./RegisterForm";
import { isGoogleOAuthConfigured } from "@/lib/auth/google";
import { getServerTranslator } from "@/lib/i18n/server";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import "@/app/admin/admin.css";

// Sama seperti /login — tanpa ini status GOOGLE_CLIENT_ID/SECRET "terbeku"
// di HTML hasil pre-render saat build.
export const dynamic = "force-dynamic";

export default async function DaftarPage() {
  const t = await getServerTranslator();
  return (
    <main className="admin-login">
      <div className="admin-login-card">
        <LanguageSwitcher className="mb-4 self-end" />
        <Image
          src="/assets/crystal-lim-logo-transparent.png"
          alt="Crystal Lim"
          width={96}
          height={96}
          className="admin-login-logo"
          priority
        />
        <h1>{t("auth.registerTitle")}</h1>
        <p>{t("auth.registerSubtitle")}</p>
        <Suspense fallback={null}>
          <RegisterForm googleEnabled={isGoogleOAuthConfigured()} />
        </Suspense>
        <p style={{ marginTop: 16, fontSize: 13 }}>
          {t("auth.haveAccount")} <Link href="/login">{t("auth.loginLink")}</Link>
        </p>
        <Link className="admin-login-back" href="/">
          {t("common.backToStore")}
        </Link>
      </div>
    </main>
  );
}
