"use client";

import Image from "next/image";
import Link from "next/link";
import { LogOut, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import { useTranslation } from "@/lib/i18n/context";

type TopbarUser = {
  name: string;
  email: string;
  actualRoleName: string;
  viewingAs: boolean;
};

export default function UserTopbar({ user }: { user: TopbarUser }) {
  const { t } = useTranslation();
  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  async function backToAdmin() {
    await fetch("/api/admin/view-as", { method: "DELETE" });
    window.location.href = "/admin";
  }

  return (
    <>
      {user.viewingAs && (
        <div className="flex flex-wrap items-center justify-center gap-3 bg-[#3a2f1f] px-5 py-2.5 text-sm text-[#f5eedf]">
          <span>{t("userTopbar.previewAs", { role: user.actualRoleName })}</span>
          <Button
            size="sm"
            variant="outline"
            className="h-7 border-[#d7c6a6] bg-transparent text-[#f5eedf] hover:bg-white/10 hover:text-[#f5eedf]"
            onClick={backToAdmin}
          >
            {t("userTopbar.backTo", { role: user.actualRoleName })}
          </Button>
        </div>
      )}
      <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/assets/crystal-lim-logo-transparent.png" alt="Crystal Lim" width={32} height={32} />
          <span className="text-base font-extrabold tracking-wide">CRYSTAL LIM</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="hidden text-sm text-muted-foreground sm:inline">{user.email}</span>
          <LanguageSwitcher />
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <Store className="size-4" /> {t("common.viewStore")}
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={signOut}>
            <LogOut className="size-4" /> {t("common.signOut")}
          </Button>
        </div>
      </header>
    </>
  );
}
