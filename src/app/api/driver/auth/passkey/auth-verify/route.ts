import { NextRequest, NextResponse } from "next/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import type { AuthenticatorTransportFuture } from "@simplewebauthn/types";
import { prisma } from "@/lib/prisma";
import { setSession } from "@/lib/driverAuth";

export async function POST(request: NextRequest) {
  const { phone, credential } = await request.json();
  if (!phone || !credential) {
    return NextResponse.json({ error: "パラメータが不足しています" }, { status: 400 });
  }

  const origin = request.headers.get("origin") || "http://localhost:3000";
  const rpID = new URL(origin).hostname;

  try {
    // チャレンジを取得
    const stored = await prisma.authChallenge.findUnique({ where: { phone } });
    if (!stored || stored.expiresAt < new Date()) {
      return NextResponse.json({ error: "セッションが期限切れです。やり直してください" }, { status: 400 });
    }

    // 使用されたパスキーを取得
    const passkey = await prisma.passkey.findUnique({ where: { id: credential.id } });
    if (!passkey) {
      return NextResponse.json({ error: "認証情報が見つかりません" }, { status: 404 });
    }

    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response: credential,
        expectedChallenge: stored.challenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        authenticator: {
          // DBにはbase64url文字列で保存されているため、Uint8Arrayに変換して渡す
          credentialID: passkey.id,
          credentialPublicKey: new Uint8Array(Buffer.from(passkey.publicKey, "base64")),
          counter: Number(passkey.counter),
          transports: JSON.parse(passkey.transports) as AuthenticatorTransportFuture[],
        },
      });
    } catch {
      return NextResponse.json({ error: "認証に失敗しました" }, { status: 400 });
    }

    if (!verification.verified) {
      return NextResponse.json({ error: "認証に失敗しました" }, { status: 401 });
    }

    // カウンターを更新
    await prisma.passkey.update({
      where: { id: passkey.id },
      data: { counter: verification.authenticationInfo.newCounter },
    });

    // チャレンジを削除
    await prisma.authChallenge.delete({ where: { phone } }).catch(() => {});

    const driver = await prisma.driver.findUnique({ where: { id: passkey.driverId } });
    if (!driver) return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });

    await setSession(driver.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("passkey/auth-verify error:", e);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
