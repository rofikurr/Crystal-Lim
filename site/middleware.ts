import { NextResponse, type NextRequest } from "next/server";
import { verifySessionToken } from "./lib/auth/session";

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

// Gerbang cepat: cuma cek token valid ada atau tidak (jalan di Edge runtime,
// tanpa akses database). Pengecekan permission granular dilakukan di masing-
// masing page/route handler (Node.js runtime) lewat lib/auth/permissions.ts.
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/admin/login")) return NextResponse.next();

  const token = request.cookies.get("session")?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    if (pathname.startsWith("/api/admin")) {
      return NextResponse.json({ error: "Akses admin ditolak." }, { status: 401 });
    }
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("return_to", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}
