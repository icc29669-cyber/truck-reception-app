import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  verifyPassword, signSession, cookieOptions,
  SESSION_COOKIE, SESSION_TTL_SEC,
} from "@/lib/session";
import { hitRateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  if (hitRateLimit(`login:${ip}`, 10, 60)) {
    return NextResponse.json({ error: "試行回数が多すぎます。しばらくお待ちください" }, { status: 429 });
  }

  const body = await req.json().catch(() => null) as { loginId?: string; password?: string } | null;
  const loginId = (body?.loginId || "").trim();
  const password = body?.password || "";
  if (!loginId || !password) {
    return NextResponse.json({ error: "ログインIDとパスワードを入力してください" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { loginId },
    include: { center: true },
  });
  if (!user || !user.isActive) {
    return NextResponse.json({ error: "ログインに失敗しました" }, { status: 401 });
  }
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "ログインに失敗しました" }, { status: 401 });
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  const now = Math.floor(Date.now() / 1000);
  const token = await signSession({
    sub: user.id,
    loginId: user.loginId,
    name: user.name,
    centerId: user.centerId,
    iat: now,
  });

  const res = NextResponse.json({
    ok: true,
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
  res.cookies.set(SESSION_COOKIE, token, cookieOptions(SESSION_TTL_SEC));
  return res;
}
