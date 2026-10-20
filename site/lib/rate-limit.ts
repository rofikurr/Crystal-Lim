type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
let lastSweep = 0;

function sweep(now: number) {
  for (const [key, bucket] of buckets) {
    if (now > bucket.resetAt) buckets.delete(key);
  }
}

/**
 * Pembatas laju sederhana dalam memori (per-IP), bukan pengganti rate limiter
 * terdistribusi (Redis dkk). Cukup untuk menahan brute-force/spam pada skala
 * toko kecil ini; pada deployment multi-instance proteksinya per-instance,
 * bukan global — tapi tetap jauh lebih baik daripada tanpa batas sama sekali.
 */
export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  if (now - lastSweep > windowMs) {
    sweep(now);
    lastSweep = now;
  }
  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  bucket.count += 1;
  return bucket.count > limit;
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export function rateLimitResponse(): Response {
  return Response.json(
    { error: "Terlalu banyak percobaan. Coba lagi beberapa menit lagi." },
    { status: 429 },
  );
}
