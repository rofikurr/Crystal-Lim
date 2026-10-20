import { eq } from "drizzle-orm";
import { db } from "./index";
import { permissions, rolePermissions, roles, users } from "./schema";

export type RoleSummary = {
  id: number;
  slug: string;
  name: string;
  isSystem: boolean;
  permissions: string[];
};

export type PermissionSummary = {
  id: number;
  slug: string;
  label: string;
  group: string;
};

export async function countRoles(): Promise<number> {
  return (await db.select({ id: roles.id }).from(roles)).length;
}

export async function findRoleById(id: number) {
  const [row] = await db.select().from(roles).where(eq(roles.id, id)).limit(1);
  return row ?? null;
}

export async function findRoleBySlug(slug: string) {
  const [row] = await db.select().from(roles).where(eq(roles.slug, slug)).limit(1);
  return row ?? null;
}

export async function listRolesWithPermissions(): Promise<{
  roles: RoleSummary[];
  permissions: PermissionSummary[];
}> {
  const allRoles = await db.select().from(roles);
  const allPermissions = await db.select().from(permissions);
  const assignments = await db.select().from(rolePermissions);

  const permissionsByRole = new Map<number, string[]>();
  for (const a of assignments) {
    const permission = allPermissions.find((p) => p.id === a.permissionId);
    if (!permission) continue;
    const list = permissionsByRole.get(a.roleId) ?? [];
    list.push(permission.slug);
    permissionsByRole.set(a.roleId, list);
  }

  return {
    roles: allRoles.map((role) => ({
      id: role.id,
      slug: role.slug,
      name: role.name,
      isSystem: role.isSystem,
      permissions: permissionsByRole.get(role.id) ?? [],
    })),
    permissions: allPermissions.map((p) => ({
      id: p.id,
      slug: p.slug,
      label: p.label,
      group: p.group,
    })),
  };
}

export async function createRole(input: {
  slug: string;
  name: string;
  permissionSlugs: string[];
  createdAt: string;
}): Promise<number> {
  const allPermissions = await db.select().from(permissions);
  const matched = allPermissions.filter((p) => input.permissionSlugs.includes(p.slug));

  const [inserted] = await db.insert(roles).values({
    slug: input.slug,
    name: input.name,
    isSystem: false,
    createdAt: input.createdAt,
  });
  const roleId = inserted.insertId;

  if (matched.length > 0) {
    await db.insert(rolePermissions).values(matched.map((p) => ({ roleId, permissionId: p.id })));
  }
  return roleId;
}

export async function renameRole(id: number, name: string) {
  await db.update(roles).set({ name }).where(eq(roles.id, id));
}

export async function setRolePermissions(id: number, permissionSlugs: string[]) {
  const allPermissions = await db.select().from(permissions);
  const matched = allPermissions.filter((p) => permissionSlugs.includes(p.slug));
  await db.delete(rolePermissions).where(eq(rolePermissions.roleId, id));
  if (matched.length > 0) {
    await db.insert(rolePermissions).values(matched.map((p) => ({ roleId: id, permissionId: p.id })));
  }
}

export async function countUsersWithRole(roleId: number): Promise<number> {
  const rows = await db.select({ id: users.id }).from(users).where(eq(users.roleId, roleId)).limit(1);
  return rows.length;
}

export async function deleteRole(id: number) {
  await db.delete(rolePermissions).where(eq(rolePermissions.roleId, id));
  await db.delete(roles).where(eq(roles.id, id));
}
