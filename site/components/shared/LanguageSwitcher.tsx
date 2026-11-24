"use client";

import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

export default function LanguageSwitcher({ className }: { className?: string }) {
  const { lang, setLang } = useTranslation();

  return (
    <div
      role="group"
      aria-label="Language / Bahasa"
      className={cn("inline-flex items-center gap-0.5 rounded-md border border-border p-0.5 text-xs font-semibold", className)}
    >
      {(["id", "en"] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => setLang(option)}
          aria-pressed={lang === option}
          className={cn(
            "rounded px-2 py-1 uppercase transition-colors",
            lang === option ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
