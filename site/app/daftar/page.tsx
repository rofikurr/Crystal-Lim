import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import RegisterForm from "./RegisterForm";
import { isGoogleOAuthConfigured } from "@/lib/auth/google";
import "@/app/admin/admin.css";

// Sama seperti /login — tanpa ini status GOOGLE_CLIENT_ID/SECRET "terbeku"
// di HTML hasil pre-render saat build.
export const dynamic = "force-dynamic";

export default function DaftarPage() {
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
        <h1>Daftar akun Crystal Lim</h1>
        <p>Buat akun untuk menyimpan riwayat pembelian kamu.</p>
        <Suspense fallback={null}>
          <RegisterForm googleEnabled={isGoogleOAuthConfigured()} />
        </Suspense>
        <p style={{ marginTop: 16, fontSize: 13 }}>
          Sudah punya akun? <Link href="/login">Masuk</Link>
        </p>
        <Link className="admin-login-back" href="/">
          ← Kembali ke toko
        </Link>
      </div>
    </main>
  );
}
