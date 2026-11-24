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
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
};

export async function GET(
  request: Request,
  context: { params: Promise<{ key: string }> },
) {
  const { key } = await context.params;
  if (!/^[0-9a-f-]{36}\.(jpg|png|webp|mp4|webm|mov)$/.test(key)) {
    return new Response("Tidak ditemukan", { status: 404 });
  }
  // `key` sudah divalidasi ketat lewat regex di atas (UUID + ekstensi), jadi
  // aman digabung ke uploadDir tanpa risiko path traversal.
  const filePath = path.join(uploadDir, key);
  let fileSize: number;
  try {
    fileSize = (await stat(filePath)).size;
  } catch {
    return new Response("Tidak ditemukan", { status: 404 });
  }

  const ext = key.split(".").pop() ?? "";
  const contentType = contentTypes[ext] || "application/octet-stream";

  // Dukung Range request (dipakai player video untuk seek/scrub) —
  // tanpa ini, browser hanya bisa load seluruh file sebelum bisa diputar.
  const range = request.headers.get("range");
  if (range) {
    const match = /bytes=(\d*)-(\d*)/.exec(range);
    const start = match?.[1] ? Number(match[1]) : 0;
    const end = match?.[2] ? Number(match[2]) : fileSize - 1;
    if (Number.isNaN(start) || Number.isNaN(end) || start > end || end >= fileSize) {
      return new Response(null, { status: 416, headers: { "content-range": `bytes */${fileSize}` } });
    }
    const stream = Readable.toWeb(
      createReadStream(filePath, { start, end }),
    ) as NodeWebReadableStream;
    return new Response(stream as unknown as BodyInit, {
      status: 206,
      headers: {
        "content-type": contentType,
        "content-range": `bytes ${start}-${end}/${fileSize}`,
        "content-length": String(end - start + 1),
        "accept-ranges": "bytes",
        "cache-control": "public, max-age=31536000, immutable",
        "x-content-type-options": "nosniff",
      },
    });
  }

  const stream = Readable.toWeb(
    createReadStream(filePath),
  ) as NodeWebReadableStream;

  return new Response(stream as unknown as BodyInit, {
    headers: {
      "content-type": contentType,
      "content-length": String(fileSize),
      "accept-ranges": "bytes",
      "cache-control": "public, max-age=31536000, immutable",
      "x-content-type-options": "nosniff",
    },
  });
}
