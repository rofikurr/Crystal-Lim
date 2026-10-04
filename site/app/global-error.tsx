"use client";

import "@/app/admin/admin.css";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ fontFamily: "Manrope, sans-serif" }}>
        <main className="admin-login">
          <div className="admin-login-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/crystal-lim-logo-transparent.png"
              alt="Crystal Lim"
              width={96}
              height={96}
              className="admin-login-logo"
            />
            <h1>Terjadi kesalahan</h1>
            <p>Silakan coba lagi. Jika terus berulang, hubungi pengelola toko.</p>
            <button className="admin-primary" type="button" onClick={() => reset()}>
              Coba lagi
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
