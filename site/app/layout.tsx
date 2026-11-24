import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { cookies } from "next/headers";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { LanguageProvider } from "@/lib/i18n/context";
import { resolveLang } from "@/lib/i18n/translations";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  title: "Admin | Crystal Lim",
  description: "Pengelolaan katalog Crystal Lim.",
  other: {
    robots: "noindex, nofollow",
  },
  icons: {
    icon: "/assets/crystal-lim-logo-transparent.png",
    shortcut: "/assets/crystal-lim-logo-transparent.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const lang = resolveLang((await cookies()).get("lang")?.value);
  return (
    <html lang={lang} className={manrope.variable} suppressHydrationWarning>
      <body className={manrope.className}>
        <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light">
          <LanguageProvider initialLang={lang}>
            {children}
            <Toaster richColors position="top-right" />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
