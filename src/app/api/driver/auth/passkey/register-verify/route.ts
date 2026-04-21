import { NextRequest, NextResponse } from "next/server";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import type { AuthenticatorTransportFuture } from "@simplewebauthn/types";
import { prisma } from "@/lib/prisma";
import { setSession } from "@/lib/driverAuth";

export async function POST(request: NextRequest) {
  const { phone, credential, agreedToPolicy } = await request.json();
  if (!phone || !credential) {
    return NextResponse.json({ error: "パラメータが不足しています" }, { status: 400 });
  }

  const origin = request.headers.get("origin") || "http://localhost:3000";
  const rpID = new URL(origin).hostname;

  try {
    // チャレンジを取得・検証
    const stored = await prisma.authChallenge.findUnique({ where: { phone } });
    if (!stored || stored.expiresAt < new Date()) {
      return NextResponse.json({ error: "セッションが期限切れです。やり直してください" }, { status: 400 });
    }

    let verification;
    try {
      verification = await verifyRegistrationResponse({
        response: credential,
        expectedChallenge: stored.challenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
      });
    } catch (e) {
      return NextResponse.json({ error: "認証に失敗しました" }, { status: 400 });
    }

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json({ error: "認証に失敗しました" }, { status: 400 });
    }

    const { credentialPublicKey, counter, credentialDeviceType, credentialBackedUp } =
      verification.registrationInfo;

    // ブラウザが送ってきた credential.id は常に base64url 文字列のため、
    // そのまま使用する（registrationInfo.credentialID はバージョンによって
    // Uint8Array か string か異なるため信頼しない）
    const credentialIDStr = credential.id as string;

    // ドライバーを作成または取得
    let driver = await prisma.driver.findUnique({ where: { phone } });
    if (!driver) {
      driver = await prisma.driver.create({
        data: { phone, agreedToPolicy: !!agreedToPolicy },
      });
    } else if (!driver.agreedToPolicy && agreedToPolicy) {
      driver = await prisma.driver.update({
        where: { phone },
        data: { agreedToPolicy: true },
      });
    }

    // トランスポートを取得（registrationレスポンスから）
    const transports = (credential?.response?.transports ?? []) as AuthenticatorTransportFuture[];

    // パスキーを保存
    await prisma.passkey.create({
      data: {
        id: credentialIDStr,
        driverId: driver.id,
        publicKey: Buffer.from(credentialPublicKey).toString("base64"),
        counter: counter,
        transports: JSON.stringify(transports),
        deviceType: credentialDeviceType,
        backedUp: credentialBackedUp,
      },
    });

    // チャレンジを削除
    await prisma.authChallenge.delete({ where: { phone } }).catch(() => {});

    await setSession(driver.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("passkey/register-verify error:", e);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
