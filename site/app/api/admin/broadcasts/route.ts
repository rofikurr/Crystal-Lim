import { requirePermissionOrResponse } from "../../../../lib/auth/permissions";
import { sameOrigin } from "../../../../lib/auth/session";
import { sendMail, MailerError } from "../../../../lib/mailer";
import { listActiveSubscribers } from "../../../../db/newsletter";
import { listBroadcasts, recordBroadcast } from "../../../../db/broadcasts";

export const dynamic = "force-dynamic";

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] || char,
  );

function buildHtml(subject: string, body: string, unsubscribeUrl: string): string {
  const paragraphs = body
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p style="margin:0 0 16px;color:#25211b;line-height:1.6">${escapeHtml(line)}</p>`)
    .join("");
  return `<!doctype html><html><body style="background:#f3ede1;padding:32px 16px;font-family:Arial,sans-serif">
    <div style="max-width:560px;margin:0 auto;background:#fff;padding:32px;border:1px solid #e6dfd4">
      <h1 style="margin:0 0 20px;font-size:20px;color:#25211b">${escapeHtml(subject)}</h1>
      ${paragraphs}
      <p style="margin:24px 0 0;font-size:12px;color:#948c7c">Crystal Lim · Natural Crystal Collection</p>
      <p style="margin:8px 0 0;font-size:12px"><a href="${unsubscribeUrl}" style="color:#948c7c">Berhenti berlangganan</a></p>
    </div>
  </body></html>`;
}

export async function GET() {
  const { response } = await requirePermissionOrResponse("broadcast.manage");
  if (response) return response;
  try {
    return Response.json({ broadcasts: await listBroadcasts() }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Riwayat broadcast gagal dimuat." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const { response } = await requirePermissionOrResponse("broadcast.manage");
  if (response) return response;
  if (!sameOrigin(request)) return Response.json({ error: "Permintaan tidak valid." }, { status: 403 });

  let body: { subject?: string; body?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Data tidak valid." }, { status: 400 });
  }
  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const content = typeof body.body === "string" ? body.body.trim() : "";
  if (!subject || subject.length > 200 || !content) {
    return Response.json({ error: "Subjek dan isi pesan wajib diisi." }, { status: 400 });
  }

  try {
    const subscribers = await listActiveSubscribers();
    if (subscribers.length === 0) {
      return Response.json({ error: "Belum ada subscriber aktif." }, { status: 400 });
    }
    const origin = new URL(request.url).origin;
    let failedCount = 0;
    for (const subscriber of subscribers) {
      const unsubscribeUrl = `${origin}/unsubscribe?token=${encodeURIComponent(subscriber.unsubscribeToken)}`;
      try {
        await sendMail({
          to: subscriber.email,
          subject,
          html: buildHtml(subject, content, unsubscribeUrl),
        });
      } catch (error) {
        console.error(`Gagal kirim broadcast ke ${subscriber.email}`, error);
        failedCount++;
        if (error instanceof MailerError) {
          // SMTP belum dikonfigurasi sama sekali — semua kirim berikutnya pasti gagal juga, hentikan lebih awal.
          failedCount = subscribers.length;
          break;
        }
      }
    }
    await recordBroadcast({
      subject,
      body: content,
      recipientCount: subscribers.length,
      failedCount,
    });
    return Response.json({ ok: true, recipientCount: subscribers.length, failedCount });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Broadcast gagal diproses." }, { status: 503 });
  }
}
