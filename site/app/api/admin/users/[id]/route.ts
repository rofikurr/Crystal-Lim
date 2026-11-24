import { findRoleById } from "../../../../../db/roles";
import { deleteUser, findUserById, findUserRoleFlag, updateUser } from "../../../../../db/users";
import { hashPassword } from "../../../../../lib/auth/password";
import { requirePermissionOrResponse } from "../../../../../lib/auth/permissions";
import { sameOrigin } from "../../../../../lib/auth/session";
import { nowForDb } from "../../../../../lib/db-time";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { user: actor, response } = await requirePermissionOrResponse("users.manage");
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

  // Ganti role lewat endpoint ini selalu untuk akun ORANG LAIN — akun sendiri
  // diubah lewat /api/user/profile. Blokir di sini supaya pemegang permission
  // "users.manage" (role non-superadmin) tidak bisa menaikkan role-nya sendiri.
  if (actor && actor.id === userId && Number.isInteger(body.roleId)) {
    return Response.json({ error: "Tidak bisa mengubah role akun sendiri." }, { status: 400 });
  }

  try {
    const target = await findUserById(userId);
    if (!target) return Response.json({ error: "User tidak ditemukan." }, { status: 404 });

    const patch: Parameters<typeof updateUser>[1] = { updatedAt: nowForDb() };
    if (typeof body.name === "string" && body.name.trim()) patch.name = body.name.trim();
    if (body.status === "active" || body.status === "suspended") patch.status = body.status;
    if (typeof body.password === "string" && body.password.length > 0) {
      if (body.password.length < 8) {
        return Response.json({ error: "Kata sandi minimal 8 karakter." }, { status: 400 });
      }
      patch.passwordHash = await hashPassword(body.password);
    }
    if (Number.isInteger(body.roleId)) {
      const role = await findRoleById(body.roleId!);
      if (!role) return Response.json({ error: "Role tidak ditemukan." }, { status: 400 });
      // Hanya superadmin asli (bukan sekadar pemegang permission users.manage,
      // dan bukan superadmin yang sedang "Lihat sebagai" role lain) yang boleh
      // memberikan role sistem (superadmin) ke user manapun.
      const actorIsRealSuperadmin = Boolean(actor?.isSystem && !actor.viewingAs);
      if (role.isSystem && !actorIsRealSuperadmin) {
        return Response.json(
          { error: "Hanya superadmin yang bisa memberikan role ini." },
          { status: 403 },
        );
      }
      patch.roleId = body.roleId;
    }

    await updateUser(userId, patch);
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
  const { user: actor, response } = await requirePermissionOrResponse("users.manage");
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
    if (actor && actor.id === userId) {
      return Response.json({ error: "Tidak bisa menghapus akun sendiri." }, { status: 400 });
    }
    const target = await findUserRoleFlag(userId);
    if (!target) return Response.json({ error: "User tidak ditemukan." }, { status: 404 });
    if (target.isSystem) {
      return Response.json(
        { error: "User dengan role superadmin tidak bisa dihapus." },
        { status: 400 },
      );
    }
    await deleteUser(userId);
    return Response.json({ ok: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "User gagal dihapus." }, { status: 503 });
  }
}
