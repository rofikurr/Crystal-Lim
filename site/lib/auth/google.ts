const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

export function isGoogleOAuthConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export const GOOGLE_OAUTH_STATE_COOKIE = "google_oauth_state";
export const GOOGLE_OAUTH_RETURN_TO_COOKIE = "google_oauth_return_to";
export const GOOGLE_OAUTH_INTENT_COOKIE = "google_oauth_intent";

export type GoogleOAuthIntent = "login" | "register";

/**
 * Bangun origin dari header Host, bukan `request.url` — saat server di-bind
 * ke 0.0.0.0 (mis. di Docker), `request.url` dibentuk dari alamat bind itu
 * sendiri, bukan dari Host yang dikirim klien (sama seperti alasan di
 * `sameOrigin()` pada lib/auth/session.ts).
 */
export function originFromRequest(request: Request): string {
  const host = request.headers.get("host") ?? "";
  const proto = request.headers.get("x-forwarded-proto") ?? (process.env.NODE_ENV === "production" ? "https" : "http");
  return `${proto}://${host}`;
}

export function buildGoogleAuthUrl(redirectUri: string, state: string): string {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error("GOOGLE_CLIENT_ID belum diset.");
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export type GoogleUserInfo = { email: string; emailVerified: boolean; name: string };

export class GoogleOAuthError extends Error {}

export async function exchangeGoogleCode(code: string, redirectUri: string): Promise<GoogleUserInfo> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new GoogleOAuthError("Google OAuth belum dikonfigurasi.");

  const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  const tokenData = await tokenResponse.json().catch(() => ({}));
  if (!tokenResponse.ok || typeof tokenData.access_token !== "string") {
    throw new GoogleOAuthError(tokenData.error_description || "Gagal menukar kode otorisasi Google.");
  }

  const userResponse = await fetch(GOOGLE_USERINFO_URL, {
    headers: { authorization: `Bearer ${tokenData.access_token}` },
  });
  const userData = await userResponse.json().catch(() => ({}));
  if (!userResponse.ok || typeof userData.email !== "string") {
    throw new GoogleOAuthError("Gagal mengambil data akun Google.");
  }
  const name = typeof userData.name === "string" && userData.name.trim() ? userData.name.trim() : userData.email;
  return {
    email: userData.email.toLowerCase(),
    emailVerified: userData.email_verified === true,
    name,
  };
}
