import { NextRequest, NextResponse } from "next/server";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const { phone } = await request.json();
  if (!phone) return NextResponse.json({ error: "電話番号が必要です" }, { status: 400 });

  const origin = request.headers.get("origin") || "http://localhost:3000";
  const rpID = new URL(origin).hostname;

  try {
    // 既存のパスキーを取得
    const driver = await prisma.driver.findFirst({
      where: { phone },
      orderBy: { id: "asc" },
      include: { passkeys: true },
    });

    const options = await generateRegistrationOptions({
      rpName: "機材センター受付予約",
      rpID,
      userName: phone,
      userDisplayName: phone,
      excludeCredentials: driver?.passkeys.map((pk) => ({ id: pk.id })) ?? [],
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "preferred",
        authenticatorAttachment: "platform", // デバイス内蔵認証のみ（指紋・顔）
      },
    });

    // チャレンジをDBに保存（5分間有効）
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
    console.error("passkey/register-options error:", e);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
