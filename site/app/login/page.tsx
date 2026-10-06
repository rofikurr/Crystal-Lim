import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import LoginForm from "./LoginForm";
import "@/app/admin/admin.css";

export default function LoginPage() {
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
        <h1>Masuk ke Crystal Lim</h1>
        <p>Masuk ke akun kamu untuk lanjut.</p>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
        <p style={{ marginTop: 16, fontSize: 13 }}>
          Belum punya akun? <Link href="/daftar">Daftar</Link>
        </p>
        <Link className="admin-login-back" href="/">
          ← Kembali ke toko
        </Link>
      </div>
    </main>
  );
}
