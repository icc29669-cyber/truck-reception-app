import { NextRequest, NextResponse } from "next/server";
import {
  verifySession, signSession, cookieOptions,
  SESSION_COOKIE, SESSION_TTL_SEC, hashPassword,
} from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 現ユーザー情報を返す + cookie を sliding refresh
export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ authenticated: false }, { status: 401 });
  const session = await verifySession(token);
  if (!session) return NextResponse.json({ authenticated: false }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    include: { center: true },
  });
  if (!user || !user.isActive) return NextResponse.json({ authenticated: false }, { status: 401 });

  const res = NextResponse.json({
    authenticated: true,
    user: {
      id: user.id,
      loginId: user.loginId,
      name: user.name,
      centerId: user.centerId,
      centerName: user.center.name,
      centerCode: user.center.code,
      paperWidth: user.paperWidth,
      autoPrint: user.autoPrint,
    },
  });
  const now = Math.floor(Date.now() / 1000);
  const fresh = await signSession({
    sub: user.id, loginId: user.loginId, name: user.name,
    centerId: user.centerId, iat: now,
  });
  res.cookies.set(SESSION_COOKIE, fresh, cookieOptions(SESSION_TTL_SEC));
  return res;
}

// 自プロフィール更新 (name / password / paperWidth / autoPrint)
export async function PATCH(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "認証が必要" }, { status: 401 });
  const session = await verifySession(token);
  if (!session) return NextResponse.json({ error: "認証が必要" }, { status: 401 });

  const body = await req.json().catch(() => null) as {
    name?: string; password?: string;
    paperWidth?: string; autoPrint?: boolean;
  } | null;
  if (!body) return NextResponse.json({ error: "リクエスト不正" }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (typeof body.name === "string") data.name = body.name;
  if (typeof body.paperWidth === "string") data.paperWidth = body.paperWidth;
  if (typeof body.autoPrint === "boolean") data.autoPrint = body.autoPrint;
  if (typeof body.password === "string") {
    if (body.password.length < 4) return NextResponse.json({ error: "パスワードは4文字以上" }, { status: 400 });
    data.passwordHash = await hashPassword(body.password);
  }
  const updated = await prisma.user.update({
    where: { id: session.sub }, data, include: { center: true },
  });
  return NextResponse.json({
    ok: true,
    user: {
      id: updated.id, loginId: updated.loginId, name: updated.name,
      centerId: updated.centerId, centerName: updated.center.name,
      paperWidth: updated.paperWidth, autoPrint: updated.autoPrint,
    },
  });
}
