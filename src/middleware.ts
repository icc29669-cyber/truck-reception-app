import { NextRequest, NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE } from "@/lib/session";

/**
 * 統一認証 middleware
 *   - /login, /api/auth/*, /_next, assets は通す
 *   - /admin, /kiosk, /api/admin, /api/kiosk は session cookie 必須
 *   - 未認証なら /login へリダイレクト (API なら 401)
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // driver 関連は独自 cookie (driver_session) を使うため middleware では通す
  // driver 側の各 API / page ハンドラが自身で認証チェックする
  const isPublic =
    pathname === "/login" ||
    pathname.startsWith("/api/auth/") ||
    pathname === "/" ||
    pathname.startsWith("/driver") ||
    pathname.startsWith("/api/driver") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/icon-") ||
    pathname === "/manifest.json" ||
    pathname === "/sw.js" ||
    pathname.startsWith("/api/public/");

  if (isPublic) return withSecurityHeaders(NextResponse.next());

  const needsAuth =
    pathname.startsWith("/admin") || pathname.startsWith("/api/admin") ||
    pathname.startsWith("/kiosk") || pathname.startsWith("/api/kiosk") ||
    pathname.startsWith("/api/reception");

  if (!needsAuth) return withSecurityHeaders(NextResponse.next());

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "認証が必要" }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return withSecurityHeaders(NextResponse.next());
}

function withSecurityHeaders(res: NextResponse) {
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.headers.set("X-XSS-Protection", "1; mode=block");
  res.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
