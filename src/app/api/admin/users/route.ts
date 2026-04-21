import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const users = await prisma.user.findMany({
    include: { center: { select: { id: true, code: true, name: true } } },
    orderBy: [{ centerId: "asc" }, { loginId: "asc" }],
  });
  return NextResponse.json(users.map((u) => ({
    id: u.id, loginId: u.loginId, name: u.name,
    centerId: u.centerId, centerName: u.center.name, centerCode: u.center.code,
    paperWidth: u.paperWidth, autoPrint: u.autoPrint,
    isActive: u.isActive,
    lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
    createdAt: u.createdAt.toISOString(),
  })));
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as {
    loginId?: string; password?: string; name?: string; centerId?: number;
    paperWidth?: string; autoPrint?: boolean;
  } | null;
  if (!body) return NextResponse.json({ error: "リクエスト不正" }, { status: 400 });
  const { loginId, password, name, centerId, paperWidth = "80", autoPrint = true } = body;
  if (!loginId || !password || !name || !centerId) {
    return NextResponse.json({ error: "全項目必須" }, { status: 400 });
  }
  if (password.length < 4) return NextResponse.json({ error: "パスワードは4文字以上" }, { status: 400 });
  const center = await prisma.center.findUnique({ where: { id: centerId } });
  if (!center) return NextResponse.json({ error: "指定センターが存在しません" }, { status: 400 });
  const dup = await prisma.user.findUnique({ where: { loginId } });
  if (dup) return NextResponse.json({ error: "そのログインIDは既に使用中" }, { status: 409 });

  const passwordHash = await hashPassword(password);
  const created = await prisma.user.create({
    data: { loginId, passwordHash, name, centerId, paperWidth, autoPrint },
  });
  return NextResponse.json({ ok: true, id: created.id });
}
