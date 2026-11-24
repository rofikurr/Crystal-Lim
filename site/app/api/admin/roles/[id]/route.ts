import {
  countUsersWithRole,
  deleteRole,
  findRoleById,
  renameRole,
  setRolePermissions,
} from "../../../../../db/roles";
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
    const role = await findRoleById(roleId);
    if (!role) return Response.json({ error: "Role tidak ditemukan." }, { status: 404 });
    if (role.isSystem) {
      return Response.json(
        { error: "Role sistem (superadmin) tidak bisa diubah." },
        { status: 400 },
      );
    }

    if (typeof body.name === "string" && body.name.trim()) {
      await renameRole(roleId, body.name.trim());
    }
    if (Array.isArray(body.permissionSlugs)) {
      await setRolePermissions(roleId, body.permissionSlugs);
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
    const role = await findRoleById(roleId);
    if (!role) return Response.json({ error: "Role tidak ditemukan." }, { status: 404 });
    if (role.isSystem) {
      return Response.json({ error: "Role sistem tidak bisa dihapus." }, { status: 400 });
    }
    const usersWithRole = await countUsersWithRole(roleId);
    if (usersWithRole > 0) {
      return Response.json(
        { error: "Role masih dipakai oleh pengguna. Pindahkan pengguna itu dulu." },
        { status: 409 },
      );
    }
    await deleteRole(roleId);
    return Response.json({ ok: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Role gagal dihapus." }, { status: 503 });
  }
}
