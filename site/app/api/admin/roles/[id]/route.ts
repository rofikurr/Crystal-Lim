import { eq } from "drizzle-orm";
import { db } from "../../../../../db";
import { permissions, rolePermissions, roles, users } from "../../../../../db/schema";
import { requirePermissionOrResponse } from "../../../../../lib/auth/permissions";
import { sameOrigin } from "../../../../../lib/auth/session";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { response } = await requirePermissionOrResponse("roles.manage");
  if (response) return response;
  if (!sameOrigin(request)) {
    return Response.json({ error: "Permintaan tidak valid." }, { status: 403 });
  }
  const { id } = await context.params;
  const roleId = Number(id);
  if (!Number.isInteger(roleId)) {
    return Response.json({ error: "Role tidak ditemukan." }, { status: 404 });
  }

  let body: { name?: string; permissionSlugs?: string[] };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Data tidak valid." }, { status: 400 });
  }

  try {
    const [role] = await db.select().from(roles).where(eq(roles.id, roleId)).limit(1);
    if (!role) return Response.json({ error: "Role tidak ditemukan." }, { status: 404 });
    if (role.isSystem) {
      return Response.json(
        { error: "Role sistem (superadmin) tidak bisa diubah." },
        { status: 400 },
      );
    }

    if (typeof body.name === "string" && body.name.trim()) {
      await db
        .update(roles)
        .set({ name: body.name.trim() })
        .where(eq(roles.id, roleId));
    }

    if (Array.isArray(body.permissionSlugs)) {
      const allPermissions = await db.select().from(permissions);
      const matched = allPermissions.filter((p) => body.permissionSlugs!.includes(p.slug));
      await db.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));
      if (matched.length > 0) {
        await db
          .insert(rolePermissions)
          .values(matched.map((p) => ({ roleId, permissionId: p.id })));
      }
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Role gagal diperbarui." }, { status: 503 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { response } = await requirePermissionOrResponse("roles.manage");
  if (response) return response;
  if (!sameOrigin(request)) {
    return Response.json({ error: "Permintaan tidak valid." }, { status: 403 });
  }
  const { id } = await context.params;
  const roleId = Number(id);
  if (!Number.isInteger(roleId)) {
    return Response.json({ error: "Role tidak ditemukan." }, { status: 404 });
  }

  try {
    const [role] = await db.select().from(roles).where(eq(roles.id, roleId)).limit(1);
    if (!role) return Response.json({ error: "Role tidak ditemukan." }, { status: 404 });
    if (role.isSystem) {
      return Response.json({ error: "Role sistem tidak bisa dihapus." }, { status: 400 });
    }
    const usersWithRole = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.roleId, roleId))
      .limit(1);
    if (usersWithRole.length > 0) {
      return Response.json(
        { error: "Role masih dipakai oleh pengguna. Pindahkan pengguna itu dulu." },
        { status: 409 },
      );
    }
    await db.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));
    await db.delete(roles).where(eq(roles.id, roleId));
    return Response.json({ ok: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Role gagal dihapus." }, { status: 503 });
  }
}
