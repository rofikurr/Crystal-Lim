import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { requirePermissionOrResponse } from "../../../../lib/auth/permissions";
import { sameOrigin } from "../../../../lib/auth/session";

const allowedImages = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

const allowedVideos = new Map([
  ["video/mp4", "mp4"],
  ["video/webm", "webm"],
  ["video/quicktime", "mov"],
]);

const MAX_IMAGE_BYTES = 5_000_000;
const MAX_VIDEO_BYTES = 300_000_000;

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
  const imageFile = form.get("image");
  const videoFile = form.get("video");

  if (videoFile instanceof File) {
    if (!allowedVideos.has(videoFile.type) || videoFile.size < 1 || videoFile.size > MAX_VIDEO_BYTES) {
      return Response.json({ error: "Pilih MP4, WebM, atau MOV maksimal 300 MB (sekitar 3 menit)." }, { status: 400 });
    }
    const key = `${crypto.randomUUID()}.${allowedVideos.get(videoFile.type)}`;
    try {
      await mkdir(uploadDir, { recursive: true });
      const buffer = Buffer.from(await videoFile.arrayBuffer());
      await writeFile(path.join(uploadDir, key), buffer);
      return Response.json({ url: `/media/${key}` }, { status: 201 });
    } catch (error) {
      console.error(error);
      return Response.json({ error: "Video gagal diunggah." }, { status: 503 });
    }
  }

  if (
    !(imageFile instanceof File) ||
    !allowedImages.has(imageFile.type) ||
    imageFile.size < 1 ||
    imageFile.size > MAX_IMAGE_BYTES
  ) {
    return Response.json({ error: "Pilih JPG, PNG, atau WebP maksimal 5 MB." }, { status: 400 });
  }
  const key = `${crypto.randomUUID()}.${allowedImages.get(imageFile.type)}`;
  try {
    await mkdir(uploadDir, { recursive: true });
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    await writeFile(path.join(uploadDir, key), buffer);
    return Response.json({ url: `/media/${key}` }, { status: 201 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Foto gagal diunggah." }, { status: 503 });
  }
}
