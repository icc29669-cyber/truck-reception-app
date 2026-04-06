import { NextRequest, NextResponse } from "next/server";

/**
 * Kiosk API用のシークレット検証
 * 環境変数 KIOSK_SECRET が設定されている場合のみ検証する
 * 未設定の場合はパススルー（開発環境向け）
 */
export function verifyKioskSecret(req: NextRequest): NextResponse | null {
  const secret = process.env.KIOSK_SECRET;
  // シークレット未設定なら検証スキップ（開発環境）
  if (!secret) return null;

  const provided = req.headers.get("x-kiosk-secret") ?? "";
  if (provided !== secret) {
    return NextResponse.json(
      { error: "認証エラー" },
      { status: 403 }
    );
  }
  return null;
}
