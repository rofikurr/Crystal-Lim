import { findUserForLogin } from "../../../../db/users";
import { verifyPassword } from "../../../../lib/auth/password";
import { sameOrigin, setSessionCookie } from "../../../../lib/auth/session";
import { getClientIp, isRateLimited, rateLimitResponse } from "../../../../lib/rate-limit";

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return Response.json({ error: "Permintaan tidak valid." }, { status: 403 });
  }
  if (isRateLimited(`login:${getClientIp(request)}`, 10, 5 * 60 * 1000)) {
    return rateLimitResponse();
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

  const row = await findUserForLogin(email);

  if (!row || row.status === "suspended" || !(await verifyPassword(password, row.passwordHash))) {
    return Response.json({ error: "Email atau kata sandi salah." }, { status: 401 });
  }

  await setSessionCookie(row.id);
  return Response.json({ ok: true, roleSlug: row.roleSlug });
}
