import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "id 不正" }, { status: 400 });
  const body = await req.json().catch(() => null) as {
    loginId?: string; name?: string; centerId?: number;
    paperWidth?: string; autoPrint?: boolean;
    isActive?: boolean; password?: string;
  } | null;
  if (!body) return NextResponse.json({ error: "リクエスト不正" }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (typeof body.loginId === "string") {
    const dup = await prisma.user.findUnique({ where: { loginId: body.loginId } });
    if (dup && dup.id !== id) return NextResponse.json({ error: "そのIDは使用中" }, { status: 409 });
    data.loginId = body.loginId;
  }
  if (typeof body.name === "string") data.name = body.name;
  if (typeof body.centerId === "number") {
    const c = await prisma.center.findUnique({ where: { id: body.centerId } });
    if (!c) return NextResponse.json({ error: "指定センターが存在しません" }, { status: 400 });
    data.centerId = body.centerId;
  }
  if (typeof body.paperWidth === "string") data.paperWidth = body.paperWidth;
  if (typeof body.autoPrint === "boolean") data.autoPrint = body.autoPrint;
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;
  if (typeof body.password === "string") {
    if (body.password.length < 4) return NextResponse.json({ error: "パスワードは4文字以上" }, { status: 400 });
    data.passwordHash = await hashPassword(body.password);
  }

  const updated = await prisma.user.update({ where: { id }, data });
  return NextResponse.json({ ok: true, id: updated.id });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "id 不正" }, { status: 400 });
  // 自分自身 or 最後の 1人の削除はブロック
  const totalActive = await prisma.user.count({ where: { isActive: true } });
  if (totalActive <= 1) return NextResponse.json({ error: "最後の有効ユーザーは削除できません" }, { status: 400 });
  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
