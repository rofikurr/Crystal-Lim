import { eq } from "drizzle-orm";
import { db } from "@/db";
import { roles, users } from "@/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { requirePermissionOrResponse } from "@/lib/auth/permissions";
import { sameOrigin } from "@/lib/auth/session";
import { nowForDb } from "@/lib/db-time";

export const dynamic = "force-dynamic";

async function serializeUsers() {
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

export async function GET() {
  const { response } = await requirePermissionOrResponse("users.manage");
  if (response) return response;
  try {
    return Response.json({ users: await serializeUsers() }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Data user gagal dimuat." }, { status: 503 });
  }
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const { response } = await requirePermissionOrResponse("users.manage");
  if (response) return response;
  if (!sameOrigin(request)) {
    return Response.json({ error: "Permintaan tidak valid." }, { status: 403 });
  }
  let body: { name?: string; email?: string; password?: string; roleId?: number };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Data tidak valid." }, { status: 400 });
  }
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const roleId = Number(body.roleId);
  if (
    !name ||
    name.length > 140 ||
    !emailPattern.test(email) ||
    password.length < 8 ||
    !Number.isInteger(roleId)
  ) {
    return Response.json(
      { error: "Periksa nama, email, kata sandi (minimal 8 karakter), dan role." },
      { status: 400 },
    );
  }

  try {
    const [existingEmail] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingEmail) {
      return Response.json({ error: "Email sudah dipakai user lain." }, { status: 409 });
    }
    const [role] = await db.select().from(roles).where(eq(roles.id, roleId)).limit(1);
    if (!role) return Response.json({ error: "Role tidak ditemukan." }, { status: 400 });

    const now = nowForDb();
    const [inserted] = await db.insert(users).values({
      name,
      email,
      passwordHash: await hashPassword(password),
      roleId,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
    return Response.json({ ok: true, id: inserted.insertId }, { status: 201 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "User gagal dibuat." }, { status: 503 });
  }
}
