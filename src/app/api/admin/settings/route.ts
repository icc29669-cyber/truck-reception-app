import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const ALLOWED_KEYS = [
  "kiosk_center_id",
  "last_center_sync",
  "last_driver_sync",
  "last_holiday_sync",
  "last_reservation_sync",
  "holidays",
];

// GET: 全設定を取得
export async function GET() {
  try {
    const settings = await prisma.setting.findMany();
    const map: Record<string, string> = {};
    for (const s of settings) map[s.key] = s.value;
    return NextResponse.json(map);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}

// PUT: 設定を更新（{ key, value }）
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { key, value } = body;
    if (!key) {
      return NextResponse.json({ error: "keyは必須です" }, { status: 400 });
    }
    if (!ALLOWED_KEYS.includes(key)) {
      return NextResponse.json({ error: "許可されていない設定キーです" }, { status: 400 });
    }
    const setting = await prisma.setting.upsert({
      where: { key },
      create: { key, value: String(value ?? "") },
      update: { value: String(value ?? "") },
    });
    return NextResponse.json(setting);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 });
  }
}
