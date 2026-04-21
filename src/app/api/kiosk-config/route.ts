import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySession, SESSION_COOKIE } from "@/lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CENTER_SELECT = {
  id: true, code: true, name: true,
  openTime: true, closeTime: true,
  hasBreak: true, breakStart: true, breakEnd: true,
  breaks: true,
  closedOnSunday: true, closedOnHoliday: true,
  messageOpen: true, messageBreak: true,
  messageClosed: true, messageOutsideHours: true,
} as const;

/**
 * GET /api/kiosk-config
 *   ログイン中ユーザーのセンター設定を返す
 *   ?code=3101 で明示指定も可能 (旧URL互換)
 */
export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get("code");
    if (code) {
      const center = await prisma.center.findFirst({
        where: { code, isActive: true }, select: CENTER_SELECT,
      });
      if (!center) return NextResponse.json({ error: `センターCD「${code}」が見つかりません` }, { status: 404 });
      return NextResponse.json(center);
    }

    // セッションから centerId を取得
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    const session = token ? await verifySession(token) : null;
    if (!session) {
      return NextResponse.json({ error: "認証が必要" }, { status: 401 });
    }
    const center = await prisma.center.findUnique({
      where: { id: session.centerId },
      select: { ...CENTER_SELECT, isActive: true },
    });
    if (!center || !center.isActive) {
      return NextResponse.json({ error: "所属センターが無効です。管理者にお問い合わせください" }, { status: 404 });
    }
    return NextResponse.json(center);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "設定の取得に失敗しました" }, { status: 500 });
  }
}
