import { eq } from "drizzle-orm";
import { db } from "../../../../db";
import { roles, users } from "../../../../db/schema";
import { verifyPassword } from "../../../../lib/auth/password";
import { sameOrigin, setSessionCookie } from "../../../../lib/auth/session";

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return Response.json({ error: "Permintaan tidak valid." }, { status: 403 });
  }
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Data tidak valid." }, { status: 400 });
  }
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password) {
    return Response.json({ error: "Email dan kata sandi wajib diisi." }, { status: 400 });
  }

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
  const row = rows[0];

  if (!row || row.status === "suspended" || !(await verifyPassword(password, row.passwordHash))) {
    return Response.json({ error: "Email atau kata sandi salah." }, { status: 401 });
  }

  await setSessionCookie(row.id);
  return Response.json({ ok: true, roleSlug: row.roleSlug });
}
