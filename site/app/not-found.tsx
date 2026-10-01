import Link from "next/link";

export default function NotFound() {
  return (
    <main style={{ maxWidth: 480, margin: "15vh auto", padding: 24, fontFamily: "Arial, sans-serif" }}>
      <h1>Halaman tidak ditemukan</h1>
      <p>Kembali ke <Link href="/">beranda</Link>.</p>
    </main>
  );
}
