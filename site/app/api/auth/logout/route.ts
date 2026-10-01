import { clearSessionCookie, sameOrigin } from "../../../../lib/auth/session";

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return Response.json({ error: "Permintaan tidak valid." }, { status: 403 });
  }
  await clearSessionCookie();
  return Response.json({ ok: true });
}
