import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const TIME_FIELDS = [
  "openTime", "closeTime", "hasBreak", "breakStart", "breakEnd",
  "breaks",
  "closedOnSunday", "closedOnHoliday",
  "messageOpen", "messageBreak", "messageClosed", "messageOutsideHours",
  "showInDriverApp",
] as const;

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "無効なIDです" }, { status: 400 });
    }
    const body = await req.json();
    const { code, name, secretKey, isActive } = body;

    if (code !== undefined && !/^\d{4}$/.test(code)) {
      return NextResponse.json({ error: "センターコードは4桁の数字で入力してください" }, { status: 400 });
    }

    if (code !== undefined) {
      const existing = await prisma.center.findFirst({ where: { code, NOT: { id } } });
      if (existing) {
        return NextResponse.json({ error: "このセンターコードは既に使用されています" }, { status: 400 });
      }
    }

    // 動的に更新データ構築
    const data: Record<string, unknown> = {};
    if (code !== undefined) data.code = code;
    if (name !== undefined) data.name = name;
    if (secretKey !== undefined) data.secretKey = secretKey;
    if (isActive !== undefined) data.isActive = isActive;

    // 時間・メッセージフィールド
    for (const field of TIME_FIELDS) {
      if (body[field] !== undefined) data[field] = body[field];
    }

    const center = await prisma.center.update({ where: { id }, data });
    return NextResponse.json(center);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    if (isNaN(id)) return NextResponse.json({ error: "無効なIDです" }, { status: 400 });
    // FK 依存チェック
    const [recCount, resvCount, userCount] = await Promise.all([
      prisma.reception.count({ where: { centerId: id } }),
      prisma.reservation.count({ where: { centerId: id } }),
      prisma.user.count({ where: { centerId: id } }),
    ]);
    const deps: string[] = [];
    if (recCount > 0) deps.push(`受付 ${recCount}件`);
    if (resvCount > 0) deps.push(`予約 ${resvCount}件`);
    if (userCount > 0) deps.push(`ユーザー ${userCount}件`);
    if (deps.length > 0) {
      return NextResponse.json({
        error: `このセンターは ${deps.join(" / ")} に使用中のため削除できません。先に関連データを削除するか、編集画面で「無効化」してください`,
      }, { status: 400 });
    }
    await prisma.center.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
  }
}
