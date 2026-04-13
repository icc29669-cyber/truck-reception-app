import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * 既存の予約データの reservationDate を UTC midnight → JST midnight に修正
 * UTC 2026-04-13T00:00:00.000Z → JST 2026-04-13T00:00:00+09:00 = UTC 2026-04-12T15:00:00.000Z
 *
 * POST /api/admin/fix-dates
 * 一度だけ実行する移行用エンドポイント
 */
export async function POST() {
  try {
    // UTC midnight (xx:00:00.000Z) で保存されている予約を全件取得
    const reservations = await prisma.reservation.findMany({
      select: { id: true, reservationDate: true },
    });

    let fixed = 0;
    let skipped = 0;

    for (const r of reservations) {
      const hours = r.reservationDate.getUTCHours();
      // UTC 00:00 = UTC midnight で保存されているデータのみ修正
      // JST midnight(+09:00)は UTC 15:00 なので、15:00のデータはスキップ
      if (hours === 0) {
        // UTC 00:00 → 9時間引いて UTC 15:00 (= JST midnight) にする
        const corrected = new Date(r.reservationDate.getTime() - 9 * 60 * 60 * 1000);
        await prisma.reservation.update({
          where: { id: r.id },
          data: { reservationDate: corrected },
        });
        fixed++;
      } else {
        skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      total: reservations.length,
      fixed,
      skipped,
      message: `${fixed}件の予約日を修正しました（${skipped}件はスキップ）`,
    });
  } catch (e) {
    console.error("fix-dates error:", e);
    return NextResponse.json({ error: "修正に失敗しました" }, { status: 500 });
  }
}
