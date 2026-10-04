import Image from "next/image";
import Link from "next/link";
import "@/app/admin/admin.css";

export default function NotFound() {
  return (
    <main className="admin-login">
      <div className="admin-login-card">
        <Image
          src="/assets/crystal-lim-logo-transparent.png"
          alt="Crystal Lim"
          width={96}
          height={96}
          className="admin-login-logo"
          priority
        />
        <h1>404 — Halaman tidak ditemukan</h1>
        <p>Halaman yang kamu cari sudah pindah atau belum tersedia.</p>
        <Link className="admin-primary" href="/" style={{ textDecoration: "none", display: "inline-block" }}>
          Kembali ke beranda
        </Link>
      </div>
    </main>
  );
}
