"use client";

import { useEffect, useState } from "react";

type RoleOption = { id: number; slug: string; name: string };
type UserRow = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  status: "active" | "suspended";
  roleId: number;
  roleSlug: string;
  roleName: string;
};

export default function UsersClient({ currentUserId }: { currentUserId: number }) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState<number | "">("");

  async function refresh() {
    const [usersRes, rolesRes] = await Promise.all([
      fetch("/api/admin/users", { cache: "no-store" }),
      fetch("/api/admin/roles", { cache: "no-store" }),
    ]);
    const usersData = (await usersRes.json()) as { error?: string; users: UserRow[] };
    if (!usersRes.ok) throw new Error(usersData.error || "Data user gagal dimuat.");
    const rolesData = (await rolesRes.json()) as { roles: RoleOption[] };
    setUsers(usersData.users);
    setRoles(rolesData.roles ?? []);
  }
  useEffect(() => {
    refresh().catch((e) => setMessage(e.message)).finally(() => setLoading(false));
  }, []);

  async function createUser(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, password, roleId: Number(roleId) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "User gagal dibuat.");
      setName("");
      setEmail("");
      setPassword("");
      setRoleId("");
      await refresh();
      setMessage("User baru berhasil dibuat.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "User gagal dibuat.");
    } finally {
      setBusy(false);
    }
  }

  async function updateUser(user: UserRow, patch: Record<string, unknown>) {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "User gagal diperbarui.");
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "User gagal diperbarui.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteUser(user: UserRow) {
    if (!confirm(`Hapus user "${user.name}"?`)) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "User gagal dihapus.");
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "User gagal dihapus.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="admin-empty">Memuat user…</p>;

  return (
    <div>
      {message && (
        <p className="admin-message" role="status">
          {message}
        </p>
      )}
      <section className="admin-list">
        <div className="list-head">
          <div>
            <h2>Daftar user</h2>
            <p>{users.length} user</p>
          </div>
        </div>
        <div className="admin-rows">
          {users.map((user) => (
            <article className="admin-row" key={user.id}>
              <div className="row-info">
                <h3>
                  {user.name} {user.id === currentUserId && <small>(kamu)</small>}
                </h3>
                <p>{user.email}</p>
                <div className="row-tags">
                  <span>{user.roleName.toUpperCase()}</span>
                  {user.status === "suspended" && <span>NONAKTIF</span>}
                </div>
              </div>
              <div className="row-actions">
                <select
                  value={user.roleId}
                  disabled={busy || user.id === currentUserId}
                  onChange={(e) => updateUser(user, { roleId: Number(e.target.value) })}
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
                <button
                  disabled={busy || user.id === currentUserId}
                  type="button"
                  onClick={() =>
                    updateUser(user, { status: user.status === "active" ? "suspended" : "active" })
                  }
                >
                  {user.status === "active" ? "Nonaktifkan" : "Aktifkan"}
                </button>
                <button
                  disabled={busy || user.id === currentUserId}
                  className="delete"
                  type="button"
                  onClick={() => deleteUser(user)}
                >
                  Hapus
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="admin-editor" aria-label="Tambah user baru">
        <div className="editor-head">
          <h2>Tambah user</h2>
        </div>
        <form onSubmit={createUser}>
          <div className="admin-form-grid">
            <label>
              Nama
              <input required value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label>
              Email
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label>
              Kata sandi
              <input
                required
                type="password"
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <label>
              Role
              <select
                required
                value={roleId}
                onChange={(e) => setRoleId(e.target.value ? Number(e.target.value) : "")}
              >
                <option value="">Pilih role</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="editor-actions">
            <button className="admin-primary" disabled={busy} type="submit">
              Tambah user
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
