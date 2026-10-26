"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/context";
import type { TranslationKey } from "@/lib/i18n/translations";

const TABS = [
  { href: "/user/dashboard", labelKey: "userTabs.dashboard" as TranslationKey },
  { href: "/user/alamat", labelKey: "userTabs.address" as TranslationKey },
  { href: "/user/wishlist", labelKey: "userTabs.wishlist" as TranslationKey },
  { href: "/user/profil", labelKey: "userTabs.profile" as TranslationKey },
] as const;

export default function UserTabs() {
  const pathname = usePathname();
  const { t } = useTranslation();
  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-border">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "border-b-2 border-transparent px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors",
              active
                ? "border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t(tab.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
