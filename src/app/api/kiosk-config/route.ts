import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: キオスクの設定センター情報を返す
export async function GET() {
  try {
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
