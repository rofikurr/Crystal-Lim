import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import LoginForm from "./LoginForm";
import "@/app/admin/admin.css";

export default function AdminLoginPage() {
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
        <h1>Masuk Admin</h1>
        <p>Panel pengelolaan toko Crystal Lim.</p>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
        <Link className="admin-login-back" href="/">
          ← Kembali ke toko
        </Link>
      </div>
    </main>
  );
}
