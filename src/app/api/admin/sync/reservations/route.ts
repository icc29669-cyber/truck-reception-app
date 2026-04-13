import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const BERTH_API_URL = process.env.BERTH_API_URL || "";
const BERTH_KIOSK_SECRET = process.env.BERTH_KIOSK_SECRET || "";

/**
 * 車番文字列をプレート4要素に分解
 */
function parseVehicleNumber(v: string): { region: string; classNum: string; hira: string; number: string } {
  const empty = { region: "", classNum: "", hira: "", number: "" };
  if (!v) return empty;
  const parts = v.split(/\s+/);
  if (parts.length >= 4) {
    return { region: parts[0], classNum: parts[1], hira: parts[2], number: parts[3] };
  }
  return empty;
}

/**
 * 予約システム（berth-app）から予約イベントを同期
 * POST /api/admin/sync/reservations
 * berth-appの /api/export/events を利用して差分同期
 */
export async function POST() {
  if (!BERTH_API_URL || !BERTH_KIOSK_SECRET) {
    return NextResponse.json(
      { error: "予約システムとの連携が設定されていません" },
      { status: 400 }
    );
  }

  // CSV_SYNC_KEY が必要（berth-appのexport/events用）
  const syncKey = process.env.BERTH_SYNC_KEY || "";
  if (!syncKey) {
    return NextResponse.json(
      { error: "BERTH_SYNC_KEY が設定されていません" },
      { status: 400 }
    );
  }

  try {
    // 最終同期日時を取得
    const lastSyncSetting = await prisma.setting.findUnique({
      where: { key: "last_reservation_sync" },
    });
    const since = lastSyncSetting?.value || "";
    const sinceParam = since ? `&since=${encodeURIComponent(since)}` : "";

    const url = `${BERTH_API_URL}/api/export/events?key=${encodeURIComponent(syncKey)}${sinceParam}`;
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(15000) });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `予約イベント取得失敗: ${res.status} ${text}` },
        { status: 502 }
      );
    }

    const data = (await res.json()) as {
      events: {
        type: string; // "予約" | "取消"
        centerCode: string;
        center: string;
        date: string; // YYYY-MM-DD
        time: string; // "HH:MM〜HH:MM"
        companyName: string;
        driverName: string;
        vehicleNumber: string;
        timestamp: string;
      }[];
      count: number;
    };

    let created = 0;
    let cancelled = 0;
    let skipped = 0;

    for (const ev of data.events) {
      // センターコードからローカルセンターを取得
      const center = ev.centerCode
        ? await prisma.center.findFirst({ where: { code: ev.centerCode, isActive: true } })
        : null;

      if (!center) {
        console.warn(`Reservation sync: skipping event with unknown center code: ${ev.centerCode || "(empty)"}`);
        skipped++;
        continue;
      }

      // 時間帯パース "HH:MM〜HH:MM"
      const timeParts = ev.time.split("〜");
      const startTime = timeParts[0]?.trim() || "";
      const endTime = timeParts[1]?.trim() || "";
      const reservationDate = new Date(ev.date + "T00:00:00+09:00");

      // 車番パース
      const plate = parseVehicleNumber(ev.vehicleNumber);

      if (ev.type === "予約") {
        // 重複チェック: 同じセンター・日付・時間・ドライバー名の予約がなければ作成
        const existing = await prisma.reservation.findFirst({
          where: {
            centerId: center.id,
            reservationDate,
            startTime,
            driverName: ev.driverName,
            status: { not: "cancelled" },
          },
        });

        if (!existing) {
          await prisma.reservation.create({
            data: {
              centerId: center.id,
              reservationDate,
              startTime,
              endTime,
              driverName: ev.driverName,
              companyName: ev.companyName,
              vehicleNumber: ev.vehicleNumber,
              plateRegion: plate.region,
              plateClassNum: plate.classNum,
              plateHira: plate.hira,
              plateNumber: plate.number,
              status: "pending",
            },
          });
          created++;
        } else {
          skipped++;
        }
      } else if (ev.type === "取消") {
        // 対応する予約をキャンセル
        const target = await prisma.reservation.findFirst({
          where: {
            centerId: center.id,
            reservationDate,
            startTime,
            driverName: ev.driverName,
            status: { not: "cancelled" },
          },
        });

        if (target) {
          await prisma.reservation.update({
            where: { id: target.id },
            data: { status: "cancelled" },
          });
          cancelled++;
        } else {
          skipped++;
        }
      }
    }

    // 同期日時を保存
    const now = new Date().toISOString();
    await prisma.setting.upsert({
      where: { key: "last_reservation_sync" },
      update: { value: now },
      create: { key: "last_reservation_sync", value: now },
    });

    return NextResponse.json({
      success: true,
      eventsReceived: data.count,
      created,
      cancelled,
      skipped,
      syncedAt: now,
    });
  } catch (e) {
    console.error("Reservation sync error:", e);
    return NextResponse.json({ error: "予約同期処理に失敗しました" }, { status: 500 });
  }
}

/**
 * 最終同期日時を返す
 * GET /api/admin/sync/reservations
 */
export async function GET() {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: "last_reservation_sync" } });
    return NextResponse.json({ lastSyncedAt: setting?.value || null });
  } catch {
    return NextResponse.json({ lastSyncedAt: null });
  }
}
