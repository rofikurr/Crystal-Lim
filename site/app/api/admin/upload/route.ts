import { env } from "cloudflare:workers";
import { getAdmin, sameOrigin } from "../../../admin/auth";

const allowed = new Map([["image/jpeg","jpg"],["image/png","png"],["image/webp","webp"]]);

export async function POST(request: Request) {
  if (!await getAdmin()) return Response.json({ error: "Akses admin ditolak." }, { status: 403 });
  if (!sameOrigin(request)) return Response.json({ error: "Permintaan tidak valid." }, { status: 403 });
  const form = await request.formData();
  const file = form.get("image");
  if (!(file instanceof File) || !allowed.has(file.type) || file.size < 1 || file.size > 5_000_000) {
    return Response.json({ error: "Pilih JPG, PNG, atau WebP maksimal 5 MB." }, { status: 400 });
  }
  if (!env.BUCKET) return Response.json({ error: "Penyimpanan foto belum tersedia." }, { status: 503 });
  const key = `${crypto.randomUUID()}.${allowed.get(file.type)}`;
  try {
    await env.BUCKET.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
    return Response.json({ url: `/media/${key}` }, { status: 201 });
  } catch (error) { console.error(error); return Response.json({ error: "Foto gagal diunggah." }, { status: 503 }); }
}
