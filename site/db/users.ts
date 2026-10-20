import { eq } from "drizzle-orm";
import { db } from "./index";
import { roles, users } from "./schema";

export type UserWithRole = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  status: "active" | "suspended";
  roleId: number;
  roleSlug: string;
  roleName: string;
};

export async function listUsersWithRole(): Promise<UserWithRole[]> {
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      status: users.status,
      roleId: roles.id,
      roleSlug: roles.slug,
      roleName: roles.name,
    })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id));
}

export async function countUsers(): Promise<number> {
  return (await db.select({ id: users.id }).from(users)).length;
}

export async function findUserByEmail(email: string) {
  const [row] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return row ?? null;
}

export async function findUserById(id: number) {
  const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return row ?? null;
}

/** Dipakai login: kredensial + role slug dalam satu query. */
export async function findUserForLogin(email: string) {
  const rows = await db
    .select({
      id: users.id,
      passwordHash: users.passwordHash,
      status: users.status,
      roleSlug: roles.slug,
    })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id))
    .where(eq(users.email, email))
    .limit(1);
  return rows[0] ?? null;
}

/** Dipakai untuk cek proteksi hapus user: apakah role user ini system (superadmin). */
export async function findUserRoleFlag(id: number) {
  const rows = await db
    .select({ id: users.id, isSystem: roles.isSystem })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id))
    .where(eq(users.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function createUser(input: {
  name: string;
  email: string;
  phone?: string | null;
  passwordHash: string;
  roleId: number;
  status?: "active" | "suspended";
  createdAt: string;
  updatedAt: string;
}): Promise<number> {
  const [inserted] = await db.insert(users).values({
    name: input.name,
    email: input.email,
    phone: input.phone ?? null,
    passwordHash: input.passwordHash,
    roleId: input.roleId,
    status: input.status ?? "active",
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
  });
  return inserted.insertId;
}

export async function updateUser(id: number, patch: Partial<typeof users.$inferInsert>) {
  await db.update(users).set(patch).where(eq(users.id, id));
}

export async function deleteUser(id: number) {
  await db.delete(users).where(eq(users.id, id));
}
