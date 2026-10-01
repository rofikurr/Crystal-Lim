import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SESSION_COOKIE = "session";
const VIEW_AS_COOKIE = "view_as_role";
const ALG = "HS256";

function secretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET belum diset. Isi file .env sebelum login.");
  }
  return new TextEncoder().encode(secret);
}

export type SessionPayload = { userId: number };

export async function createSessionToken(userId: number): Promise<string> {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey());
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (typeof payload.userId !== "number") return null;
    return { userId: payload.userId };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function setSessionCookie(userId: number) {
  const token = await createSessionToken(userId);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

// `cookies().delete()` tidak selalu mengirim atribut Expires/Max-Age yang
// dikenali benar oleh semua client sebagai "hapus sekarang" — set eksplisit
// value kosong + maxAge 0 supaya browser/klien pasti membuang cookie lama.
function expireCookie(
  store: Awaited<ReturnType<typeof cookies>>,
  name: string,
) {
  store.set(name, "", { path: "/", maxAge: 0 });
}

export async function clearSessionCookie() {
  const store = await cookies();
  expireCookie(store, SESSION_COOKIE);
  expireCookie(store, VIEW_AS_COOKIE);
}

export async function setViewAsRole(roleSlug: string) {
  const store = await cookies();
  store.set(VIEW_AS_COOKIE, roleSlug, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
}

export async function clearViewAsRole() {
  const store = await cookies();
  expireCookie(store, VIEW_AS_COOKIE);
}

export async function getViewAsRole(): Promise<string | null> {
  const store = await cookies();
  return store.get(VIEW_AS_COOKIE)?.value ?? null;
}

/**
 * Bandingkan header Origin terhadap Host request — bukan `request.url`,
 * karena saat server di-bind ke 0.0.0.0 (mis. di Docker), Next.js membangun
 * `request.url` dari alamat bind itu sendiri, bukan dari Host yang dikirim
 * klien, sehingga perbandingan origin lewat `request.url` selalu meleset.
 */
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
