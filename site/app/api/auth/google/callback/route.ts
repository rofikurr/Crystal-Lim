import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import {
  exchangeGoogleCode,
  GoogleOAuthError,
  GOOGLE_OAUTH_INTENT_COOKIE,
  GOOGLE_OAUTH_RETURN_TO_COOKIE,
  GOOGLE_OAUTH_STATE_COOKIE,
  originFromRequest,
} from "../../../../../lib/auth/google";
import { findRoleBySlug } from "../../../../../db/roles";
import { createUser, findUserForLogin } from "../../../../../db/users";
import { hashPassword } from "../../../../../lib/auth/password";
import { setSessionCookie } from "../../../../../lib/auth/session";
import { nowForDb } from "../../../../../lib/db-time";
import { getClientIp, isRateLimited, rateLimitResponse } from "../../../../../lib/rate-limit";

export async function GET(request: Request) {
  if (isRateLimited(`google-oauth-callback:${getClientIp(request)}`, 20, 5 * 60 * 1000)) {
    return rateLimitResponse();
  }
  const origin = originFromRequest(request);
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const store = await cookies();
  const expectedState = store.get(GOOGLE_OAUTH_STATE_COOKIE)?.value;
  const returnTo = store.get(GOOGLE_OAUTH_RETURN_TO_COOKIE)?.value;
  const intent = store.get(GOOGLE_OAUTH_INTENT_COOKIE)?.value === "register" ? "register" : "login";
  store.set(GOOGLE_OAUTH_STATE_COOKIE, "", { path: "/", maxAge: 0 });
  store.set(GOOGLE_OAUTH_RETURN_TO_COOKIE, "", { path: "/", maxAge: 0 });
  store.set(GOOGLE_OAUTH_INTENT_COOKIE, "", { path: "/", maxAge: 0 });

  if (!code || !state || !expectedState || state !== expectedState) {
    return Response.redirect(`${origin}/login?error=google_failed`);
  }

  try {
    const redirectUri = `${origin}/api/auth/google/callback`;
    const googleUser = await exchangeGoogleCode(code, redirectUri);
    if (!googleUser.emailVerified) {
      return Response.redirect(`${origin}/login?error=google_unverified`);
    }

    const existing = await findUserForLogin(googleUser.email);
    let userId: number;
    let roleSlug: string;

    if (existing) {
      if (intent === "register") {
        // Sudah punya akun — jangan buat dobel, arahkan untuk masuk biasa.
        return Response.redirect(`${origin}/login?error=google_already_registered`);
      }
      if (existing.status === "suspended") {
        return Response.redirect(`${origin}/login?error=google_suspended`);
      }
      userId = existing.id;
      roleSlug = existing.roleSlug;
    } else {
      if (intent === "login") {
        // Belum punya akun — jangan auto-daftar diam-diam, arahkan ke halaman
        // daftar (yang juga punya tombol "Daftar dengan Google" sendiri).
        return Response.redirect(`${origin}/daftar?notice=google_not_registered&email=${encodeURIComponent(googleUser.email)}`);
      }
      const userRole = await findRoleBySlug("user");
      if (!userRole) {
        return Response.redirect(`${origin}/login?error=google_failed`);
      }
      const now = nowForDb();
      // Akun yang dibuat lewat Google tidak pernah login pakai password — isi
      // dengan hash acak yang tidak mungkin ditebak, bukan string kosong,
      // supaya kolom NOT NULL tetap terpenuhi secara aman.
      const unusablePassword = randomBytes(32).toString("hex");
      userId = await createUser({
        name: googleUser.name,
        email: googleUser.email,
        passwordHash: await hashPassword(unusablePassword),
        roleId: userRole.id,
        status: "active",
        createdAt: now,
        updatedAt: now,
      });
      roleSlug = "user";
    }

    await setSessionCookie(userId);
    const fallback = roleSlug === "user" ? "/user/dashboard" : "/admin";
    const destination = returnTo && returnTo.startsWith("/") ? returnTo : fallback;
    return Response.redirect(`${origin}${destination}`);
  } catch (error) {
    console.error(error instanceof GoogleOAuthError ? error.message : error);
    return Response.redirect(`${origin}/login?error=google_failed`);
  }
}
