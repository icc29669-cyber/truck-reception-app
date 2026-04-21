import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 初回セットアップ: User テーブル空の時のみ動作。最初の 1 人を作る
export async function GET() {
  const count = await prisma.user.count();
  const centers = count === 0
    ? await prisma.center.findMany({ where: { isActive: true }, orderBy: { code: "asc" }, select: { id: true, code: true, name: true } })
    : [];
  return NextResponse.json({ bootstrappable: count === 0, userCount: count, centers });
}

export async function POST(req: NextRequest) {
  const count = await prisma.user.count();
  if (count > 0) {
    return NextResponse.json({ error: "既にユーザーが登録されています" }, { status: 403 });
  }
  const body = await req.json().catch(() => null) as {
    loginId?: string; password?: string; name?: string; centerId?: number;
  } | null;
  const loginId = (body?.loginId || "").trim();
  const password = body?.password || "";
  const name = (body?.name || "").trim() || "管理者";
  const centerId = body?.centerId;
  if (!loginId || password.length < 4 || !centerId) {
    return NextResponse.json({ error: "ログインID・パスワード(4文字以上)・センターは必須" }, { status: 400 });
  }
  const center = await prisma.center.findUnique({ where: { id: centerId } });
  if (!center) return NextResponse.json({ error: "指定センターが存在しません" }, { status: 400 });

  const passwordHash = await hashPassword(password);
  const created = await prisma.user.create({
    data: { loginId, passwordHash, name, centerId, isActive: true },
  });
  return NextResponse.json({ ok: true, id: created.id });
}
