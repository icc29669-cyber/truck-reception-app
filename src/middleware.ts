import { NextRequest, NextResponse } from "next/server";

/**
 * Middleware: セキュリティヘッダー + Admin Basic認証
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ─── Admin認証 ───
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    const user = process.env.ADMIN_USER;
    const pass = process.env.ADMIN_PASS;

    // 本番で環境変数未設定 → fail-closed（デフォルト admin/admin にフォールバックしない）
    if (!user || !pass) {
      if (process.env.NODE_ENV === "production") {
        return new NextResponse("Admin credentials not configured", { status: 503 });
      }
      // 開発環境のみ admin/admin を許容（便宜のため）
    }
    const effectiveUser = user || "admin";
    const effectivePass = pass || "admin";

    const authHeader = req.headers.get("authorization");
    if (authHeader) {
      const [scheme, encoded] = authHeader.split(" ");
      if (scheme === "Basic" && encoded) {
        const decoded = atob(encoded);
        const [u, p] = decoded.split(":");
        if (u === effectiveUser && p === effectivePass) {
          const res = NextResponse.next();
          addSecurityHeaders(res);
          return res;
        }
      }
    }

    return new NextResponse("Unauthorized", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Admin Area"',
      },
    });
  }

  // ─── 通常リクエスト：セキュリティヘッダーのみ追加 ───
  const res = NextResponse.next();
  addSecurityHeaders(res);
  return res;
}

function addSecurityHeaders(res: NextResponse) {
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.headers.set("X-XSS-Protection", "1; mode=block");
  res.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
