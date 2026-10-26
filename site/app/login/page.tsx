import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import LoginForm from "./LoginForm";
import { isGoogleOAuthConfigured } from "@/lib/auth/google";
import { getServerTranslator } from "@/lib/i18n/server";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import "@/app/admin/admin.css";

// Tanpa ini, halaman login di-pre-render statis saat `next build` — status
// GOOGLE_CLIENT_ID/SECRET saat itu "terbeku" di HTML, jadi tombol "Masuk
// dengan Google" tidak akan muncul sampai build berikutnya walau env var
// sudah diisi belakangan (mis. baru ditambahkan di Vercel setelah deploy).
export const dynamic = "force-dynamic";

export default async function LoginPage() {
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
        <h1>{t("auth.loginTitle")}</h1>
        <p>{t("auth.loginSubtitle")}</p>
        <Suspense fallback={null}>
          <LoginForm googleEnabled={isGoogleOAuthConfigured()} />
        </Suspense>
        <p style={{ marginTop: 16, fontSize: 13 }}>
          {t("auth.noAccount")} <Link href="/daftar">{t("auth.signUpLink")}</Link>
        </p>
        <Link className="admin-login-back" href="/">
          {t("common.backToStore")}
        </Link>
      </div>
    </main>
  );
}
