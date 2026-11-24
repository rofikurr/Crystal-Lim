import { findUserById, updateUser } from "../../../../db/users";
import { getEffectiveUser } from "../../../../lib/auth/permissions";
import { hashPassword, verifyPassword } from "../../../../lib/auth/password";
import { sameOrigin } from "../../../../lib/auth/session";
import { nowForDb } from "../../../../lib/db-time";
import { isValidPhone } from "../../../../lib/validation";

export async function PATCH(request: Request) {
  const user = await getEffectiveUser();
  if (!user) return Response.json({ error: "Belum masuk." }, { status: 401 });
  if (!sameOrigin(request)) return Response.json({ error: "Permintaan tidak valid." }, { status: 403 });

  let body: { name?: string; phone?: string; currentPassword?: string; newPassword?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Data tidak valid." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  if (!name || name.length > 140 || !phone || phone.length > 32 || !isValidPhone(phone)) {
    return Response.json({ error: "Periksa kembali nama dan nomor telepon." }, { status: 400 });
  }

  const set: { name: string; phone: string; updatedAt: string; passwordHash?: string } = {
    name,
    phone,
    updatedAt: nowForDb(),
  };

  if (body.newPassword) {
    if (typeof body.currentPassword !== "string" || !body.currentPassword) {
      return Response.json({ error: "Masukkan password lama untuk ganti password." }, { status: 400 });
    }
    if (body.newPassword.length < 8) {
      return Response.json({ error: "Password baru minimal 8 karakter." }, { status: 400 });
    }
    const row = await findUserById(user.id);
    if (!row || !(await verifyPassword(body.currentPassword, row.passwordHash))) {
      return Response.json({ error: "Password lama salah." }, { status: 400 });
    }
    set.passwordHash = await hashPassword(body.newPassword);
  }

  try {
    await updateUser(user.id, set);
    return Response.json({ ok: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Profil gagal disimpan." }, { status: 503 });
  }
}
