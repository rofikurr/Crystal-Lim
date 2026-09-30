import { env } from "cloudflare:workers";

export async function GET(_request: Request, context: { params: Promise<{ key: string }> }) {
  const { key } = await context.params;
  if (!/^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(key) || !env.BUCKET) return new Response("Tidak ditemukan", { status: 404 });
  const object = await env.BUCKET.get(key);
  if (!object) return new Response("Tidak ditemukan", { status: 404 });
  return new Response(object.body, { headers: {
    "content-type": object.httpMetadata?.contentType || "application/octet-stream",
    "cache-control": "public, max-age=31536000, immutable",
    "x-content-type-options": "nosniff",
  } });
}
