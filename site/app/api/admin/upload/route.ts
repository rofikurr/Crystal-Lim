import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { requirePermissionOrResponse } from "../../../../lib/auth/permissions";
import { sameOrigin } from "../../../../lib/auth/session";

const allowed = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

const uploadDir = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(process.cwd(), "storage", "uploads");

export async function POST(request: Request) {
  const { response } = await requirePermissionOrResponse("products.manage");
  if (response) return response;
  if (!sameOrigin(request)) {
    return Response.json({ error: "Permintaan tidak valid." }, { status: 403 });
  }
  const form = await request.formData();
  const file = form.get("image");
  if (
    !(file instanceof File) ||
    !allowed.has(file.type) ||
    file.size < 1 ||
    file.size > 5_000_000
  ) {
    return Response.json({ error: "Pilih JPG, PNG, atau WebP maksimal 5 MB." }, { status: 400 });
  }
  const key = `${crypto.randomUUID()}.${allowed.get(file.type)}`;
  try {
    await mkdir(uploadDir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadDir, key), buffer);
    return Response.json({ url: `/media/${key}` }, { status: 201 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Foto gagal diunggah." }, { status: 503 });
  }
}
