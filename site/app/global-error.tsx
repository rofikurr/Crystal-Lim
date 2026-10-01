"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="id">
      <body>
        <main style={{ maxWidth: 480, margin: "15vh auto", padding: 24, fontFamily: "Arial, sans-serif" }}>
          <h1>Terjadi kesalahan</h1>
          <p>Silakan coba lagi. Jika terus berulang, hubungi pengelola toko.</p>
          <button type="button" onClick={() => reset()}>
            Coba lagi
          </button>
        </main>
      </body>
    </html>
  );
}
