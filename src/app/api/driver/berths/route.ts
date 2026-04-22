import { NextRequest, NextResponse } from "next/server";
import { prisma, getOrCreateSetting } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date");
  const centerIdStr = request.nextUrl.searchParams.get("centerId");
  const centerId = centerIdStr ? parseInt(centerIdStr) : null;

  try {
    // センター設定を優先、なければ AppSetting フォールバック
    // Center には営業時間/休憩等のセンター固有設定のみ、
    // 土曜ルールやスロット上限数は AppSetting (全社共通) から取得する。
    let setting: Record<string, unknown>;
    if (centerId) {
      const center = await prisma.center.findUnique({ where: { id: centerId } });
      if (center) {
        const appSetting = await getOrCreateSetting();
        // Center.breaks は JSON 文字列 → 配列にパースして extraBreaks として公開
        let extraBreaks: { start: string; end: string }[] = [];
        try {
          const parsed = JSON.parse(center.breaks);
          if (Array.isArray(parsed)) extraBreaks = parsed;
        } catch {
          extraBreaks = [];
        }
        setting = {
          slotDurationMinutes: center.slotDurationMinutes,
          openTime: center.openTime,
          closeTime: center.closeTime,
          closedOnSunday: center.closedOnSunday,
          closedOnHoliday: center.closedOnHoliday,
          hasBreak: center.hasBreak,
          breakStart: center.breakStart,
          breakEnd: center.breakEnd,
          extraBreaks,
          // 全社共通設定は AppSetting から
          maxReservationsPerSlot: appSetting.maxReservationsPerSlot,
          saturdayOddHalfDay: appSetting.saturdayOddHalfDay,
          saturdayOddCloseTime: appSetting.saturdayOddCloseTime,
          saturdayEvenClosed: appSetting.saturdayEvenClosed,
        };
      } else {
        setting = await getOrCreateSetting();
      }
    } else {
      setting = await getOrCreateSetting();
    }

    if (date) {
      // Reservation スキーマは reservationDate (DateTime)。文字列 YYYY-MM-DD を UTC 0:00 に変換
      const reservationDate = new Date(date + "T00:00:00Z");
      const where: Record<string, unknown> = { reservationDate, status: { not: "cancelled" } };
      if (centerId) where.centerId = centerId;

      // ※ プライバシー保護: 他ドライバーの会社名・車番・氏名は返さない。
      //    時間枠の空き計算に必要な startTime/endTime のみ返す。
      const [reservations, holiday] = await Promise.all([
        prisma.reservation.findMany({
          where,
          orderBy: { startTime: "asc" },
          select: { id: true, startTime: true, endTime: true },
        }),
        prisma.holiday.findUnique({ where: { date } }),
      ]);

      // 曜日判定
      const dateObj = new Date(date + "T00:00:00");
      const dow = dateObj.getDay(); // 0=日, 6=土

      let closedInfo: { name: string } | null = null;
      let effectiveCloseTime = setting.closeTime as string;

      // 1. 日曜休業
      if (dow === 0 && setting.closedOnSunday) {
        closedInfo = { name: "日曜休業" };
      }

      // 2. 祝日・手動休日（closedOnHoliday が true のとき）
      if (!closedInfo && holiday && setting.closedOnHoliday !== false) {
        closedInfo = { name: holiday.name || "休日" };
      }

      // 3. 土曜ルール
      if (!closedInfo && dow === 6) {
        const weekOfMonth = Math.ceil(dateObj.getDate() / 7);
        const isOdd = weekOfMonth % 2 === 1; // 第1・3・5
        if (!isOdd && setting.saturdayEvenClosed) {
          // 第2・4土曜は休業
          closedInfo = { name: "第2・4土曜休業" };
        } else if (isOdd && setting.saturdayOddHalfDay) {
          // 第1・3・5土曜はAMのみ
          effectiveCloseTime = setting.saturdayOddCloseTime as string;
        }
      }

      const effectiveSetting = { ...setting, closeTime: effectiveCloseTime };
      return NextResponse.json({ setting: effectiveSetting, reservations, holiday: closedInfo });
    }

    return NextResponse.json({ setting });
  } catch (e) {
    console.error("berths-get error:", e);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
