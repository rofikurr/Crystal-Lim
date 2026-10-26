import { cookies } from "next/headers";
import { resolveLang, translate, type TranslationKey } from "./translations";

/** Untuk Server Component (async, tanpa "use client") yang tidak bisa pakai useTranslation(). */
export async function getServerTranslator() {
  const lang = resolveLang((await cookies()).get("lang")?.value);
  return (key: TranslationKey, vars?: Record<string, string | number>) => translate(lang, key, vars);
}
