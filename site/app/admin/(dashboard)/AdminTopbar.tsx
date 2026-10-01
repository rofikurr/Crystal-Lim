"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type TopbarUser = {
  name: string;
  email: string;
  actualRoleSlug: string;
  actualRoleName: string;
  effectiveRoleSlug: string;
  isSystem: boolean;
  viewingAs: boolean;
};
type RoleOption = { slug: string; name: string };

export default function AdminTopbar({ user }: { user: TopbarUser }) {
  const [roleOptions, setRoleOptions] = useState<RoleOption[]>([]);

  useEffect(() => {
    if (!user.isSystem) return;
    fetch("/api/admin/roles", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { roles: [] }))
      .then((data: { roles?: { slug: string; name: string }[] }) => {
        setRoleOptions((data.roles ?? []).map((r) => ({ slug: r.slug, name: r.name })));
      })
      .catch(() => {});
  }, [user.isSystem]);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  async function switchViewAs(roleSlug: string) {
    if (!roleSlug) {
      await fetch("/api/admin/view-as", { method: "DELETE" });
    } else {
      await fetch("/api/admin/view-as", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ roleSlug }),
      });
    }
    window.location.reload();
  }

  return (
    <>
      {user.viewingAs && (
        <div className="view-as-banner">
          <span>
            Sedang melihat sebagai: <strong>{user.effectiveRoleSlug}</strong> (akun asli:{" "}
            {user.actualRoleName})
          </span>
          <button type="button" onClick={() => switchViewAs("")}>
            Kembali ke {user.actualRoleName}
          </button>
        </div>
      )}
      <header className="admin-header">
        <Link className="admin-brand" href="/admin">
          ◇ <span>CRYSTAL LIM</span>
          <small>ADMIN</small>
        </Link>
        <div>
          {user.isSystem && roleOptions.length > 0 && (
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
              Lihat sebagai
              <select
                value={user.viewingAs ? user.effectiveRoleSlug : ""}
                onChange={(e) => switchViewAs(e.target.value)}
              >
                <option value="">{user.actualRoleName} (asli)</option>
                {roleOptions
                  .filter((r) => r.slug !== user.actualRoleSlug)
                  .map((r) => (
                    <option key={r.slug} value={r.slug}>
                      {r.name}
                    </option>
                  ))}
              </select>
            </label>
          )}
          <span className="admin-email">{user.email}</span>
          <Link href="/">Lihat toko</Link>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              signOut();
            }}
          >
            Keluar
          </a>
        </div>
      </header>
    </>
  );
}
