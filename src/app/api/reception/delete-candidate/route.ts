import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyKioskSecret } from "@/lib/auth";
import { getClientIp, hitRateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

/**
 * キオスク向け: ドライバー/車両候補をソフトデリート（isActive = false）
 * DELETE /api/reception/delete-candidate
 * Body: { type: "driver" | "vehicle", id: number, phone: string }
 *
 * セキュリティ:
 *   - verifyKioskSecret: 同一オリジン or ヘッダー認証(同一オリジンは sec-fetch-site で判定)
 *   - phone 必須: 指定された driver/vehicle の phone が body.phone と一致することを確認
 *     → 攻撃者が sec-fetch-site 偽装して任意 id を一括削除するのを防ぐ
 *   - レート制限: 同一 IP 60 秒で 5 回まで(正常利用では絶対超えない閾値)
 */
export async function DELETE(req: NextRequest) {
  const authError = verifyKioskSecret(req);
  if (authError) return authError;

  // レート制限: 候補削除は通常 1-2 回しか発生しない
  const ip = getClientIp(req);
  if (hitRateLimit(`delete-candidate:${ip}`, 5, 60)) {
    return NextResponse.json(
      { error: "一時的にご利用いただけません。しばらく経ってから再度お試しください" },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "リクエストの形式が不正です" }, { status: 400 });
  }
  const { type, id, phone } = (body as { type?: unknown; id?: unknown; phone?: unknown }) ?? {};

  if (typeof type !== "string" || typeof id !== "number" || !Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "type と有効な id は必須です" }, { status: 400 });
  }
  // phone オーナーシップチェック: body の phone と DB レコードの phone が一致しないと削除不可
  if (typeof phone !== "string" || !/^\d{10,11}$/.test(phone)) {
    return NextResponse.json({ error: "有効な電話番号が必要です" }, { status: 400 });
  }

  try {
    if (type === "driver") {
      const existing = await prisma.driver.findUnique({ where: { id }, select: { phone: true } });
      if (!existing) return NextResponse.json({ error: "該当ドライバーが見つかりません" }, { status: 404 });
      if (existing.phone !== phone) {
        return NextResponse.json({ error: "この電話番号のドライバーではありません" }, { status: 403 });
      }
      await prisma.driver.update({ where: { id }, data: { isActive: false } });
    } else if (type === "vehicle") {
      const existing = await prisma.vehicle.findUnique({ where: { id }, select: { phone: true } });
      if (!existing) return NextResponse.json({ error: "該当車両が見つかりません" }, { status: 404 });
      if (existing.phone !== phone) {
        return NextResponse.json({ error: "この電話番号の車両ではありません" }, { status: 403 });
      }
      await prisma.vehicle.update({ where: { id }, data: { isActive: false } });
    } else {
      return NextResponse.json({ error: "type は driver または vehicle です" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("delete-candidate error:", e);
    return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
  }
}
