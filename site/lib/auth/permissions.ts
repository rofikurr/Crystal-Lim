import { eq } from "drizzle-orm";
import { db } from "../../db";
import { permissions, rolePermissions, roles, users } from "../../db/schema";
import { getSession, getViewAsRole } from "./session";

export type CurrentUser = {
  id: number;
  name: string;
  email: string;
  roleId: number;
  roleSlug: string;
  roleName: string;
  isSystem: boolean;
};

export type EffectiveUser = CurrentUser & {
  effectiveRoleSlug: string;
  viewingAs: boolean;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getSession();
  if (!session) return null;

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      status: users.status,
      roleId: roles.id,
      roleSlug: roles.slug,
      roleName: roles.name,
      isSystem: roles.isSystem,
    })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id))
    .where(eq(users.id, session.userId))
    .limit(1);

  const row = rows[0];
  if (!row || row.status === "suspended") return null;

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    roleId: row.roleId,
    roleSlug: row.roleSlug,
    roleName: row.roleName,
    isSystem: row.isSystem,
  };
}

async function getPermissionSlugsForRoleSlug(slug: string): Promise<string[]> {
  const rows = await db
    .select({ slug: permissions.slug })
    .from(rolePermissions)
    .innerJoin(roles, eq(rolePermissions.roleId, roles.id))
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(roles.slug, slug));
  return rows.map((r) => r.slug);
}

/**
 * Superadmin (role isSystem) bisa "melihat sebagai" role lain untuk keperluan
 * testing. Selama mode itu aktif, permission dievaluasi berdasarkan role yang
 * dilihat, bukan implicit full-access superadmin.
 */
export async function getEffectiveUser(): Promise<EffectiveUser | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  if (!user.isSystem) {
    return { ...user, effectiveRoleSlug: user.roleSlug, viewingAs: false };
  }
  const viewAs = await getViewAsRole();
  if (!viewAs || viewAs === user.roleSlug) {
    return { ...user, effectiveRoleSlug: user.roleSlug, viewingAs: false };
  }
  return { ...user, effectiveRoleSlug: viewAs, viewingAs: true };
}

export async function hasPermission(slug: string): Promise<boolean> {
  const user = await getEffectiveUser();
  if (!user) return false;
  if (user.isSystem && !user.viewingAs) return true;
  const granted = await getPermissionSlugsForRoleSlug(user.effectiveRoleSlug);
  return granted.includes(slug);
}

/** Daftar permission slug efektif untuk user yang login — dipakai UI admin
 * untuk menyembunyikan aksi yang tidak diizinkan. */
export async function getEffectivePermissionSlugs(): Promise<string[]> {
  const user = await getEffectiveUser();
  if (!user) return [];
  if (user.isSystem && !user.viewingAs) {
    const rows = await db.select({ slug: permissions.slug }).from(permissions);
    return rows.map((r) => r.slug);
  }
  return getPermissionSlugsForRoleSlug(user.effectiveRoleSlug);
}

/**
 * Helper untuk route handler admin: kembalikan Response 401/403 siap pakai
 * kalau belum login / tidak punya permission, atau user efektif kalau lolos.
 */
export async function requirePermissionOrResponse(
  slug: string,
): Promise<{ user: EffectiveUser | null; response: Response | null }> {
  const user = await getEffectiveUser();
  if (!user) {
    return {
      user: null,
      response: Response.json({ error: "Akses admin ditolak." }, { status: 401 }),
    };
  }
  const allowed =
    user.isSystem && !user.viewingAs
      ? true
      : (await getPermissionSlugsForRoleSlug(user.effectiveRoleSlug)).includes(slug);
  if (!allowed) {
    return {
      user: null,
      response: Response.json(
        { error: "Anda tidak memiliki izin untuk aksi ini." },
        { status: 403 },
      ),
    };
  }
  return { user, response: null };
}
