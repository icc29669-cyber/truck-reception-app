/**
 * CORS ヘッダー（キオスク受付アプリ向け）
 * 本番環境では KIOSK_ORIGIN 必須、開発環境のみワイルドカード許可
 */
let corsWarned = false;

export function kioskCorsHeaders(): Record<string, string> {
  const origin = process.env.KIOSK_ORIGIN;
  if (!origin) {
    if (process.env.NODE_ENV === "production") {
      // 本番ではワイルドカードを使わず、ログ出力のみ
      if (!corsWarned) {
        console.error("CRITICAL: KIOSK_ORIGIN is not set in production — CORS restricted to localhost.");
        corsWarned = true;
      }
      return {
        "Access-Control-Allow-Origin": "http://localhost:3001",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Kiosk-Secret",
      };
    }
    if (!corsWarned) {
      console.warn("KIOSK_ORIGIN is not set — CORS allows all origins (dev only).");
      corsWarned = true;
    }
  }
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Kiosk-Secret",
  };
}
