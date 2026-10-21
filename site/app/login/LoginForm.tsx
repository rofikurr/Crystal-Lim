"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

const GOOGLE_ERROR_MESSAGES: Record<string, string> = {
  google_not_configured: "Login Google belum diaktifkan. Pakai email & kata sandi dulu.",
  google_failed: "Login Google gagal. Coba lagi.",
  google_unverified: "Email Google kamu belum terverifikasi. Pakai email & kata sandi dulu.",
  google_suspended: "Akun ini dinonaktifkan. Hubungi admin.",
};

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.581C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
    </svg>
  );
}

export default function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const googleError = params.get("error");
  const [error, setError] = useState(googleError ? GOOGLE_ERROR_MESSAGES[googleError] ?? "" : "");
  const [busy, setBusy] = useState(false);

  const returnTo = params.get("return_to");
  const googleHref = `/api/auth/google${returnTo && returnTo.startsWith("/") ? `?return_to=${encodeURIComponent(returnTo)}` : ""}`;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await response.json()) as { error?: string; roleSlug?: string };
      if (!response.ok) throw new Error(data.error || "Gagal masuk.");
      const fallback = data.roleSlug === "user" ? "/user/dashboard" : "/admin";
      router.replace(returnTo && returnTo.startsWith("/") ? returnTo : fallback);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal masuk.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="login-form">
      <label>
        Email
        <input
          type="email"
          required
          autoComplete="username"
          placeholder="nama@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <label>
        Kata sandi
        <input
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      {error && (
        <p className="login-error" role="alert">
          {error}
        </p>
      )}
      <button className="admin-primary" disabled={busy} type="submit">
        {busy ? "Memproses…" : "Masuk"}
      </button>
      {googleEnabled && (
        <>
          <div className="login-divider">
            <span>atau</span>
          </div>
          <a href={googleHref} className="google-signin-button">
            <GoogleLogo />
            Masuk dengan Google
          </a>
        </>
      )}
    </form>
  );
}
