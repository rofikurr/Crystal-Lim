import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import {
  buildGoogleAuthUrl,
  GOOGLE_OAUTH_RETURN_TO_COOKIE,
  GOOGLE_OAUTH_STATE_COOKIE,
  isGoogleOAuthConfigured,
  originFromRequest,
} from "../../../../lib/auth/google";
import { getClientIp, isRateLimited, rateLimitResponse } from "../../../../lib/rate-limit";

export async function GET(request: Request) {
  if (isRateLimited(`google-oauth:${getClientIp(request)}`, 20, 5 * 60 * 1000)) {
    return rateLimitResponse();
  }
  if (!isGoogleOAuthConfigured()) {
    return Response.redirect(`${originFromRequest(request)}/login?error=google_not_configured`);
  }

  const state = randomBytes(16).toString("hex");
  const store = await cookies();
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 10,
  };
  store.set(GOOGLE_OAUTH_STATE_COOKIE, state, cookieOptions);

  const returnTo = new URL(request.url).searchParams.get("return_to");
  if (returnTo && returnTo.startsWith("/")) {
    store.set(GOOGLE_OAUTH_RETURN_TO_COOKIE, returnTo, cookieOptions);
  }

  const redirectUri = `${originFromRequest(request)}/api/auth/google/callback`;
  return Response.redirect(buildGoogleAuthUrl(redirectUri, state));
}
