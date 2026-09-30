import type { Metadata } from "next";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <html lang="id"><body>{children}</body></html>;
}
