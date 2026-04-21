import { NextRequest, NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import type { AuthenticatorTransportFuture } from "@simplewebauthn/types";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const { phone } = await request.json();
  if (!phone) return NextResponse.json({ error: "電話番号が必要です" }, { status: 400 });

  const origin = request.headers.get("origin") || "http://localhost:3000";
  const rpID = new URL(origin).hostname;

  try {
    const driver = await prisma.driver.findUnique({
      where: { phone },
      include: { passkeys: true },
    });

    if (!driver || driver.passkeys.length === 0) {
      return NextResponse.json({ error: "生体認証が登録されていません" }, { status: 404 });
    }

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: driver.passkeys.map((pk) => ({
        id: pk.id,
        transports: JSON.parse(pk.transports) as AuthenticatorTransportFuture[],
      })),
      userVerification: "preferred",
    });

    // チャレンジを保存（5分間有効）
    await prisma.authChallenge.upsert({
      where: { phone },
      update: {
        challenge: options.challenge,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
      create: {
        phone,
        challenge: options.challenge,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    return NextResponse.json(options);
  } catch (e) {
    console.error("passkey/auth-options error:", e);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
