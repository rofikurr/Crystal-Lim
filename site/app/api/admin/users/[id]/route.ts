import { eq } from "drizzle-orm";
import { db } from "@/db";
import { roles, users } from "@/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { getCurrentUser, requirePermissionOrResponse } from "@/lib/auth/permissions";
import { sameOrigin } from "@/lib/auth/session";
import { nowForDb } from "@/lib/db-time";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { response } = await requirePermissionOrResponse("users.manage");
  if (response) return response;
  if (!sameOrigin(request)) {
    return Response.json({ error: "Permintaan tidak valid." }, { status: 403 });
  }
  const { id } = await context.params;
  const userId = Number(id);
  if (!Number.isInteger(userId)) {
    return Response.json({ error: "User tidak ditemukan." }, { status: 404 });
  }

  let body: { name?: string; roleId?: number; status?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Data tidak valid." }, { status: 400 });
  }

  try {
    const [target] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!target) return Response.json({ error: "User tidak ditemukan." }, { status: 404 });

    const patch: Partial<typeof users.$inferInsert> = { updatedAt: nowForDb() };
    if (typeof body.name === "string" && body.name.trim()) patch.name = body.name.trim();
    if (body.status === "active" || body.status === "suspended") patch.status = body.status;
    if (typeof body.password === "string" && body.password.length > 0) {
      if (body.password.length < 8) {
        return Response.json({ error: "Kata sandi minimal 8 karakter." }, { status: 400 });
      }
      patch.passwordHash = await hashPassword(body.password);
    }
    if (Number.isInteger(body.roleId)) {
      const [role] = await db.select().from(roles).where(eq(roles.id, body.roleId!)).limit(1);
      if (!role) return Response.json({ error: "Role tidak ditemukan." }, { status: 400 });
      patch.roleId = body.roleId;
    }

    await db.update(users).set(patch).where(eq(users.id, userId));
    return Response.json({ ok: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "User gagal diperbarui." }, { status: 503 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { response } = await requirePermissionOrResponse("users.manage");
  if (response) return response;
  if (!sameOrigin(request)) {
    return Response.json({ error: "Permintaan tidak valid." }, { status: 403 });
  }
  const { id } = await context.params;
  const userId = Number(id);
  if (!Number.isInteger(userId)) {
    return Response.json({ error: "User tidak ditemukan." }, { status: 404 });
  }

  try {
    const current = await getCurrentUser();
    if (current && current.id === userId) {
      return Response.json({ error: "Tidak bisa menghapus akun sendiri." }, { status: 400 });
    }
    const rows = await db
      .select({ id: users.id, isSystem: roles.isSystem })
      .from(users)
      .innerJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.id, userId))
      .limit(1);
    const target = rows[0];
    if (!target) return Response.json({ error: "User tidak ditemukan." }, { status: 404 });
    if (target.isSystem) {
      return Response.json(
        { error: "User dengan role superadmin tidak bisa dihapus." },
        { status: 400 },
      );
    }
    await db.delete(users).where(eq(users.id, userId));
    return Response.json({ ok: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "User gagal dihapus." }, { status: 503 });
  }
}
