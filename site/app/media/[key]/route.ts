import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import type { ReadableStream as NodeWebReadableStream } from "node:stream/web";

const uploadDir = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(process.cwd(), "storage", "uploads");

const contentTypes: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ key: string }> },
) {
  const { key } = await context.params;
  if (!/^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(key)) {
    return new Response("Tidak ditemukan", { status: 404 });
  }
  // `key` sudah divalidasi ketat lewat regex di atas (UUID + ekstensi), jadi
  // aman digabung ke uploadDir tanpa risiko path traversal.
  const filePath = path.join(uploadDir, key);
  try {
    await stat(filePath);
  } catch {
    return new Response("Tidak ditemukan", { status: 404 });
  }

  const ext = key.split(".").pop() ?? "";
  const stream = Readable.toWeb(
    createReadStream(filePath),
  ) as NodeWebReadableStream;

  return new Response(stream as unknown as BodyInit, {
    headers: {
      "content-type": contentTypes[ext] || "application/octet-stream",
      "cache-control": "public, max-age=31536000, immutable",
      "x-content-type-options": "nosniff",
    },
  });
}
