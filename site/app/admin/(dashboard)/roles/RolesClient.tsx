"use client";

import { useEffect, useState } from "react";

type Permission = { id: number; slug: string; label: string; group: string };
type Role = { id: number; slug: string; name: string; isSystem: boolean; permissions: string[] };

export default function RolesClient() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newName, setNewName] = useState("");
  const [newPerms, setNewPerms] = useState<string[]>([]);

  async function refresh() {
    const response = await fetch("/api/admin/roles", { cache: "no-store" });
    const data = (await response.json()) as { error?: string; roles: Role[]; permissions: Permission[] };
    if (!response.ok) throw new Error(data.error || "Data role gagal dimuat.");
    setRoles(data.roles);
    setPermissions(data.permissions);
  }
  useEffect(() => {
    refresh().catch((e) => setMessage(e.message)).finally(() => setLoading(false));
  }, []);

  const grouped = permissions.reduce<Record<string, Permission[]>>((acc, p) => {
    (acc[p.group] ??= []).push(p);
    return acc;
  }, {});

  async function createRole(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    try {
      const response = await fetch("/api/admin/roles", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug: newSlug, name: newName, permissionSlugs: newPerms }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Role gagal dibuat.");
      setNewSlug(""); setNewName(""); setNewPerms([]);
      await refresh();
      setMessage("Role baru berhasil dibuat.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Role gagal dibuat.");
    }
  }

  async function updateRolePermissions(role: Role, permSlug: string, checked: boolean) {
    const next = checked ? [...role.permissions, permSlug] : role.permissions.filter((p) => p !== permSlug);
    setRoles((prev) => prev.map((r) => (r.id === role.id ? { ...r, permissions: next } : r)));
    await fetch(`/api/admin/roles/${role.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ permissionSlugs: next }),
    });
  }

  async function deleteRole(role: Role) {
    if (!confirm(`Hapus role "${role.name}"?`)) return;
    const response = await fetch(`/api/admin/roles/${role.id}`, { method: "DELETE" });
    const data = await response.json();
    if (!response.ok) { setMessage(data.error || "Role gagal dihapus."); return; }
    await refresh();
  }

  if (loading) return <p className="admin-empty">Memuat role…</p>;

  return (
    <div>
      {message && <p className="admin-message" role="status">{message}</p>}
      <section className="admin-list">
        <div className="list-head"><div><h2>Role &amp; permission</h2></div></div>
        {roles.map((role) => (
          <article key={role.id} className="admin-row" style={{ flexDirection: "column", alignItems: "stretch" }}>
            <div className="row-info">
              <h3>{role.name} <small>({role.slug})</small></h3>
              {role.isSystem && <p>Role sistem — akses penuh implisit, tidak bisa diubah.</p>}
            </div>
            {!role.isSystem && (
              <div className="admin-checks" style={{ flexWrap: "wrap" }}>
                {Object.entries(grouped).map(([group, perms]) => (
                  <fieldset key={group} style={{ border: "1px solid #e7e0d5", padding: 10 }}>
                    <legend>{group}</legend>
                    {perms.map((p) => (
                      <label key={p.slug} style={{ display: "flex", gap: 6 }}>
                        <input
                          type="checkbox"
                          checked={role.permissions.includes(p.slug)}
                          onChange={(e) => updateRolePermissions(role, p.slug, e.target.checked)}
                        />
                        {p.label}
                      </label>
                    ))}
                  </fieldset>
                ))}
              </div>
            )}
            {!role.isSystem && (
              <div className="row-actions">
                <button className="delete" type="button" onClick={() => deleteRole(role)}>Hapus role</button>
              </div>
            )}
          </article>
        ))}
      </section>

      <section className="admin-editor" aria-label="Buat role baru">
        <div className="editor-head"><h2>Buat role baru</h2></div>
        <form onSubmit={createRole}>
          <div className="admin-form-grid">
            <label>Slug<input required pattern="[a-z][a-z0-9_-]{1,63}" value={newSlug} onChange={(e) => setNewSlug(e.target.value)} placeholder="finance" /></label>
            <label>Nama<input required value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Admin Finance" /></label>
            <div className="admin-wide admin-checks" style={{ flexWrap: "wrap" }}>
              {permissions.map((p) => (
                <label key={p.slug} style={{ display: "flex", gap: 6 }}>
                  <input
                    type="checkbox"
                    checked={newPerms.includes(p.slug)}
                    onChange={(e) =>
                      setNewPerms((prev) =>
                        e.target.checked ? [...prev, p.slug] : prev.filter((s) => s !== p.slug),
                      )
                    }
                  />
                  {p.label}
                </label>
              ))}
            </div>
          </div>
          <div className="editor-actions">
            <button className="admin-primary" type="submit">Buat role</button>
          </div>
        </form>
      </section>
    </div>
  );
}
