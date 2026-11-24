import { sameOrigin } from "../../../lib/auth/session";
import { getClientIp, isRateLimited, rateLimitResponse } from "../../../lib/rate-limit";
import { isValidEmail } from "../../../lib/validation";
import { subscribe } from "../../../db/newsletter";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Permintaan tidak valid." }, { status: 403 });
  if (isRateLimited(`newsletter:${getClientIp(request)}`, 10, 60 * 60 * 1000)) {
    return rateLimitResponse();
  }
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Data tidak valid." }, { status: 400 });
  }
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || email.length > 255 || !isValidEmail(email)) {
    return Response.json({ error: "Email tidak valid." }, { status: 400 });
  }
  try {
    await subscribe(email);
    return Response.json({ ok: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Pendaftaran newsletter gagal." }, { status: 503 });
  }
}
