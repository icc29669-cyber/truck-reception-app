import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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
 * GET /api/kiosk-config?code=3101
 * センター設定（営業時間・メッセージ含む）を返却
 */
export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get("code");

    if (code) {
      const center = await prisma.center.findFirst({
        where: { code, isActive: true },
        select: CENTER_SELECT,
      });
      if (!center) {
        return NextResponse.json(
          { error: `センターCD「${code}」が見つかりません` },
          { status: 404 }
        );
      }
      return NextResponse.json(center);
    }

    const setting = await prisma.setting.findUnique({ where: { key: "kiosk_center_id" } });
    if (!setting || !setting.value) {
      return NextResponse.json({ error: "センターが設定されていません" }, { status: 404 });
    }
    const center = await prisma.center.findUnique({
      where: { id: Number(setting.value) },
      select: { ...CENTER_SELECT, isActive: true },
    });
    if (!center || !center.isActive) {
      return NextResponse.json({ error: "設定されたセンターが無効です" }, { status: 404 });
    }
    return NextResponse.json(center);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "設定の取得に失敗しました" }, { status: 500 });
  }
}
