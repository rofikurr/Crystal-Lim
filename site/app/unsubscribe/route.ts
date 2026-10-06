import { renderContentPage } from "../../lib/storefront-shell";
import { unsubscribeByToken } from "../../db/newsletter";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") || "";
  let success = false;
  try {
    success = token ? await unsubscribeByToken(token) : false;
  } catch (error) {
    console.error(error);
  }
  const body = success
    ? `<h1>Berhasil berhenti berlangganan</h1><p>Kamu tidak akan menerima email broadcast dari Crystal Lim lagi. Kalau berubah pikiran, kamu bisa daftar ulang lewat form newsletter di situs kami.</p>`
    : `<h1>Link tidak valid</h1><p>Link berhenti berlangganan ini sudah tidak berlaku atau salah. Hubungi kami lewat WhatsApp kalau butuh bantuan.</p>`;
  const html = renderContentPage("Berhenti Berlangganan — Crystal Lim", body);
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}
