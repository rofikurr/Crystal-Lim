import { sameOrigin } from "../../../lib/auth/session";
import { subscribeToNewsletter, BrevoError } from "../../../lib/brevo";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Permintaan tidak valid." }, { status: 403 });
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Data tidak valid." }, { status: 400 });
  }
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || email.length > 255 || !/^\S+@\S+\.\S+$/.test(email)) {
    return Response.json({ error: "Email tidak valid." }, { status: 400 });
  }
  try {
    await subscribeToNewsletter(email);
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof BrevoError) {
      console.error(error);
      return Response.json({ error: "Pendaftaran newsletter gagal. Coba lagi nanti." }, { status: 503 });
    }
    console.error(error);
    return Response.json({ error: "Pendaftaran newsletter gagal." }, { status: 503 });
  }
}
