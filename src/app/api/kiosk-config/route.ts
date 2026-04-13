import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/kiosk-config?code=3101
 *   code パラメータがあればセンターCDで直接取得（URL指定方式）
 *   なければ従来どおり Setting テーブルから取得
 */
export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get("code");

    // ── URLでセンターCD指定 ──
    if (code) {
      const center = await prisma.center.findFirst({
        where: { code, isActive: true },
        select: { id: true, code: true, name: true },
      });
      if (!center) {
        return NextResponse.json(
          { error: `センターCD「${code}」が見つかりません` },
          { status: 404 }
        );
      }
      return NextResponse.json({ id: center.id, code: center.code, name: center.name });
    }

    // ── 従来方式: Setting テーブルから ──
    const setting = await prisma.setting.findUnique({ where: { key: "kiosk_center_id" } });
    if (!setting || !setting.value) {
      return NextResponse.json({ error: "センターが設定されていません" }, { status: 404 });
    }
    const center = await prisma.center.findUnique({
      where: { id: Number(setting.value) },
      select: { id: true, code: true, name: true, isActive: true },
    });
    if (!center || !center.isActive) {
      return NextResponse.json({ error: "設定されたセンターが無効です" }, { status: 404 });
    }
    return NextResponse.json({ id: center.id, code: center.code, name: center.name });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "設定の取得に失敗しました" }, { status: 500 });
  }
}
