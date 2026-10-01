import { Suspense } from "react";
import LoginForm from "./LoginForm";
import "../admin.css";

export default function AdminLoginPage() {
  return (
    <main className="admin-shell admin-login">
      <div className="admin-login-card">
        <p className="admin-brand">
          ◇ <span>CRYSTAL LIM</span>
          <small>ADMIN</small>
        </p>
        <h1>Masuk Admin</h1>
        <p>Panel pengelolaan toko Crystal Lim.</p>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
