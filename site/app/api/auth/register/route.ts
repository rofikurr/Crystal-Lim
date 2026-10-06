import { eq } from "drizzle-orm";
import { db } from "../../../../db";
import { roles, users } from "../../../../db/schema";
import { hashPassword } from "../../../../lib/auth/password";
import { sameOrigin, setSessionCookie } from "../../../../lib/auth/session";
import { nowForDb } from "../../../../lib/db-time";

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return Response.json({ error: "Permintaan tidak valid." }, { status: 403 });
  }
  let body: { name?: string; email?: string; phone?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Data tidak valid." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (
    !name || name.length > 140 ||
    !email || email.length > 255 || !/^\S+@\S+\.\S+$/.test(email) ||
    !phone || phone.length > 32 || !/^[+0-9 ()-]{9,20}$/.test(phone) ||
    !password || password.length < 8
  ) {
    return Response.json(
      { error: "Periksa kembali nama, email, nomor telepon, dan kata sandi (minimal 8 karakter)." },
      { status: 400 },
    );
  }

  try {
    const [userRole] = await db.select().from(roles).where(eq(roles.slug, "user")).limit(1);
    if (!userRole) {
      return Response.json({ error: "Pendaftaran belum tersedia. Coba lagi nanti." }, { status: 503 });
    }

    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (existing[0]) {
      return Response.json({ error: "Email sudah terdaftar." }, { status: 409 });
    }

    const now = nowForDb();
    const [inserted] = await db.insert(users).values({
      name,
      email,
      phone,
      passwordHash: await hashPassword(password),
      roleId: userRole.id,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    await setSessionCookie(inserted.insertId);
    return Response.json({ ok: true, roleSlug: "user" }, { status: 201 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Pendaftaran gagal. Coba lagi." }, { status: 503 });
  }
}
