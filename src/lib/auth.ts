import { NextRequest, NextResponse } from "next/server";

/**
 * Kiosk API の認証。
 * 2つの経路をサポートする:
 *   (A) berth-app など外部サーバからの呼び出し   → `x-kiosk-secret` ヘッダーで認証
 *   (B) キオスク自身の画面（同一オリジン）からの呼び出し → Origin ヘッダー一致で認証
 *
 * 以前は `NEXT_PUBLIC_KIOSK_SECRET` をクライアントバンドルにも含めていたが、
 * 公開される変数で保護にならないため廃止。Origin 判定＋サーバ間ヘッダー認証に統一。
 */
export function verifyKioskSecret(req: NextRequest): NextResponse | null {
  const serverSecret = process.env.KIOSK_SECRET;
  const providedSecret = req.headers.get("x-kiosk-secret");

  // (A) サーバ間認証: ヘッダー提示あり → 一致必須
  if (providedSecret) {
    if (serverSecret && providedSecret === serverSecret) return null;
    return NextResponse.json({ error: "認証エラー" }, { status: 403 });
  }

  // (B) 同一オリジン判定
  // ブラウザは same-origin の GET に Origin ヘッダーを付けないため、
  // `sec-fetch-site: same-origin` を優先して見る（モダンブラウザ全対応）。
  // フォールバックとして Origin/Referer を確認。
  const secFetchSite = req.headers.get("sec-fetch-site");
  if (secFetchSite === "same-origin") return null;

  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (origin && host) {
    try {
      const originHost = new URL(origin).host;
      if (originHost === host) return null;
      return NextResponse.json({ error: "別オリジンからのアクセスは拒否されました" }, { status: 403 });
    } catch {
      return NextResponse.json({ error: "Origin が不正です" }, { status: 403 });
    }
  }

  // Origin も sec-fetch-site も無い → Referer で最終確認（古いブラウザ対策）
  const referer = req.headers.get("referer");
  if (referer && host) {
    try {
      const refererHost = new URL(referer).host;
      if (refererHost === host) return null;
    } catch { /* fall through */ }
  }

  return NextResponse.json({ error: "認証エラー" }, { status: 403 });
}
