import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, setSession, clearSession } from "@/lib/driverAuth";
import { getClientIp, isRateLimited, recordFailure, RATE_LIMIT_LOGIN_MAX } from "@/lib/rateLimit";
import { normalizePhone } from "@/lib/phone";
import bcrypt from "bcryptjs";

// ── GET: セッション確認 ──
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "未認証" }, { status: 401 });
  // phone は session に無いので DB から取得
  const driver = await prisma.driver.findUnique({
    where: { id: session.id },
    select: { phone: true, pin: true },
  });
  return NextResponse.json({
    id: session.id,
    name: session.name,
    companyName: session.companyName,
    defaultVehicle: session.defaultVehicle,
    defaultMaxLoad: session.defaultMaxLoad,
    isAdmin: session.isAdmin,
    phone: driver?.phone ?? "",
    hasPin: !!driver?.pin,
  });
}

// ── POST: ログイン / PIN設定 ──
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  try {
    // レート制限チェック
    if (await isRateLimited(ip, RATE_LIMIT_LOGIN_MAX)) {
      return NextResponse.json(
        { error: "試行回数が多すぎます。15分後にお試しください" },
        { status: 429 }
      );
    }

    // 壊れた JSON body は 400 を返す(500 にしない)
    let body: { phone?: unknown; pin?: unknown; newPin?: unknown; agreedToPolicy?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "リクエストの形式が不正です" }, { status: 400 });
    }
    const { phone: rawPhone, pin, newPin, agreedToPolicy } = body;
    const phone = normalizePhone(rawPhone);

    if (!phone) {
      return NextResponse.json({ error: "電話番号を入力してください" }, { status: 400 });
    }

    // ── 未完了登録の自動クリーンアップ（失敗しても続行）──
    // passkeys も空の場合のみ削除 (Passkey FK が Restrict なので登録済みは残す)
    try {
      const STALE_MINUTES = 30;
      await prisma.driver.deleteMany({
        where: {
          name: "",
          companyName: "",
          createdAt: { lt: new Date(Date.now() - STALE_MINUTES * 60 * 1000) },
          reservations: { none: {} },
          receptions: { none: {} },
          passkeys: { none: {} },
        },
      });
    } catch (cleanupErr) {
      console.error("Stale driver cleanup failed (non-blocking):", cleanupErr);
    }

    const driver = await prisma.driver.findUnique({ where: { phone } });

    // ── ステップ１: 電話番号チェックのみ（pin/newPinなし）──
    if (!pin && !newPin) {
      if (!driver) return NextResponse.json({ status: "new_user" });
      const hasPasskey = await prisma.passkey.count({ where: { driverId: driver.id } }) > 0;
      if (!driver.pin && !hasPasskey) return NextResponse.json({ status: "need_setup" });
      return NextResponse.json({ status: "ready", hasPin: !!driver.pin, hasPasskey });
    }

    // ── ステップ２: 初回PIN設定 ──
    if (newPin !== undefined && newPin !== null && newPin !== "") {
      if (!agreedToPolicy && !driver?.agreedToPolicy) {
        return NextResponse.json(
          { error: "プライバシーポリシーへの同意が必要です" },
          { status: 400 }
        );
      }
      // 型ガード: newPin は unknown なので string 化してから検証
      if (typeof newPin !== "string" || !/^\d{4}$/.test(newPin)) {
        return NextResponse.json(
          { error: "PINは4桁の数字で設定してください" },
          { status: 400 }
        );
      }
      const hashedPin = await bcrypt.hash(newPin, 10);
      let result;
      if (driver) {
        result = await prisma.driver.update({
          where: { phone },
          data: { pin: hashedPin, agreedToPolicy: true },
        });
      } else {
        result = await prisma.driver.create({
          data: { phone, pin: hashedPin, agreedToPolicy: true },
        });
      }
      await setSession(result.id);
      return NextResponse.json(
        {
          id: result.id,
          name: result.name,
          companyName: result.companyName,
          defaultVehicle: result.defaultVehicle,
          isAdmin: result.isAdmin,
        },
        { status: 201 }
      );
    }

    // ── ステップ３: PIN認証ログイン ──
    if (pin !== undefined && pin !== null && pin !== "") {
      if (typeof pin !== "string") {
        return NextResponse.json({ error: "PINの形式が不正です" }, { status: 400 });
      }
      if (!driver || !driver.pin) {
        await recordFailure(ip);
        return NextResponse.json(
          { error: "電話番号またはPINが正しくありません" },
          { status: 401 }
        );
      }
      const valid = await bcrypt.compare(pin, driver.pin);
      if (!valid) {
        await recordFailure(ip);
        return NextResponse.json({ error: "PINが正しくありません" }, { status: 401 });
      }
      await setSession(driver.id);
      return NextResponse.json({
        id: driver.id,
        name: driver.name,
        companyName: driver.companyName,
        defaultVehicle: driver.defaultVehicle,
        isAdmin: driver.isAdmin,
      });
    }

    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  } catch (e) {
    console.error("auth POST error:", e);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました。しばらく経ってからお試しください" },
      { status: 500 }
    );
  }
}

// ── DELETE: ログアウト ──
export async function DELETE() {
  await clearSession();
  return NextResponse.json({ ok: true });
}
