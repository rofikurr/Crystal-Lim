"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { translate, type Lang, type TranslationKey } from "./translations";

type TranslateFn = (key: TranslationKey, vars?: Record<string, string | number>) => string;

type LanguageContextValue = {
  lang: Lang;
  t: TranslateFn;
  setLang: (lang: Lang) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

const LANG_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function LanguageProvider({
  initialLang,
  children,
}: {
  initialLang: Lang;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [lang, setLangState] = useState<Lang>(initialLang);

  const setLang = useCallback(
    (next: Lang) => {
      setLangState(next);
      document.cookie = `lang=${next}; path=/; max-age=${LANG_COOKIE_MAX_AGE}`;
      // Teks yang dirender di Server Component (lewat getServerTranslator()) tidak
      // ikut berubah otomatis cuma dari state client — perlu refresh supaya server
      // render ulang pakai cookie bahasa yang baru, biar konsisten dengan yang di client.
      router.refresh();
    },
    [router],
  );

  const t = useCallback<TranslateFn>((key, vars) => translate(lang, key, vars), [lang]);

  return <LanguageContext.Provider value={{ lang, t, setLang }}>{children}</LanguageContext.Provider>;
}

export function useTranslation(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useTranslation harus dipakai di dalam LanguageProvider.");
  return ctx;
}
