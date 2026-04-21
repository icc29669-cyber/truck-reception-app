import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession, invalidateAllSessions, setSession } from "@/lib/driverAuth";
import { getClientIp, isRateLimited, recordFailure, RATE_LIMIT_SENSITIVE_MAX } from "@/lib/rateLimit";
import { normalizePhone } from "@/lib/phone";
import bcrypt from "bcryptjs";

// ── POST: 本人による電話番号変更（要 PIN 再認証）──
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "未認証" }, { status: 401 });
  }

  const ip = getClientIp(request);
  // PIN ブルートフォース対策: 15分間に 5回失敗でブロック
  if (await isRateLimited(ip, RATE_LIMIT_SENSITIVE_MAX)) {
    return NextResponse.json(
      { error: "試行回数が多すぎます。15分後にお試しください" },
      { status: 429 }
    );
  }

  try {
    const { pin, newPhone } = await request.json();
    const normalizedNew = normalizePhone(newPhone);

    if (!pin || typeof pin !== "string" || !/^\d{4}$/.test(pin)) {
      return NextResponse.json({ error: "PINを4桁で入力してください" }, { status: 400 });
    }
    if (!/^0\d{9,10}$/.test(normalizedNew)) {
      return NextResponse.json({ error: "電話番号の形式が正しくありません" }, { status: 400 });
    }

    const driver = await prisma.driver.findUnique({ where: { id: session.id } });
    if (!driver) {
      return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
    }
    if (!driver.pin) {
      return NextResponse.json({
        error: "PIN未設定のため本人確認できません。管理者にお問い合わせください",
      }, { status: 400 });
    }

    const valid = await bcrypt.compare(pin, driver.pin);
    if (!valid) {
      await recordFailure(ip);
      return NextResponse.json({ error: "PINが正しくありません" }, { status: 401 });
    }

    if (normalizedNew === driver.phone) {
      return NextResponse.json({ error: "現在の電話番号と同じです" }, { status: 400 });
    }

    // 原子的な update + sessionVersion インクリメント（race condition 対策）
    let updated;
    try {
      updated = await prisma.driver.update({
        where: { id: driver.id },
        data: {
          phone: normalizedNew,
          sessionVersion: { increment: 1 },
        },
      });
    } catch (e) {
      // Prisma unique 制約違反 → 既に別ドライバーが使用中
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        return NextResponse.json(
          { error: "この電話番号は既に登録されています。別の番号を入力するか、管理者にお問い合わせください" },
          { status: 409 }
        );
      }
      throw e;
    }

    // 新しい sessionVersion で Cookie を更新（自分のセッションは継続、他の端末は失効）
    await setSession(updated.id);

    return NextResponse.json({
      ok: true,
      phone: updated.phone,
    });
  } catch (e) {
    console.error("profile-phone-POST error");  // PII を含む可能性があるので詳細を書かない
    if (process.env.NODE_ENV !== "production") console.error(e);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
