import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyKioskSecret } from "@/lib/auth";
import { getJSTDayRange } from "@/lib/jstDate";
import { getCenterCached } from "@/lib/centerCache";
import { parseVehicleNumber } from "@/lib/vehiclePlate";

export const dynamic = "force-dynamic";

const BERTH_API_URL = process.env.BERTH_API_URL || "";
const BERTH_KIOSK_SECRET = process.env.BERTH_KIOSK_SECRET || "";
const BERTH_TIMEOUT = 2000;

type ReservationResult = {
  id: number; startTime: string; endTime: string;
  driverName: string; companyName: string;
  vehicleNumber: string; maxLoad: string;
  plateRegion: string; plateClassNum: string; plateHira: string; plateNumber: string;
  status: string; source: string;
};

export async function GET(req: NextRequest) {
  const authError = verifyKioskSecret(req);
  if (authError) return authError;

  try {
    const phone = req.nextUrl.searchParams.get("phone");
    const centerId = req.nextUrl.searchParams.get("centerId");
    const centerName = req.nextUrl.searchParams.get("centerName") || "";

    if (!phone || !/^\d{10,11}$/.test(phone)) {
      return NextResponse.json({ error: "電話番号は必須です" }, { status: 400 });
    }

    // ── ローカルDB + centerCache + berth-app 用の前準備 を並列実行 ──
    // 旧コードは fetchBerthReservations 内で center.findUnique が同期実行されていた。
    // ここで center 引き当てを先頭の並列に混ぜて、HTTP fetch の待ち時間と重ねない。
    // getJSTDayRange() の end を直接使う。
    // todayStart.toISOString() は UTC 日付文字列になるため、
    // そこから再計算すると JST との日付ズレで当日予約が消える。
    const { start: todayStart, end: todayEnd } = getJSTDayRange();

    const localWhere: Record<string, unknown> = {
      // 以前のドライバー予約は phone が空欄。明示された電話番号は優先し、空欄のみ補完。
      OR: [{ phone }, { phone: "", driver: { is: { phone } } }],
      reservationDate: { gte: todayStart, lte: todayEnd },
      status: { notIn: ["completed", "cancelled", "no_show"] },
    };
    if (centerId) localWhere.centerId = Number(centerId);

    const needCenter = !!(BERTH_API_URL && BERTH_KIOSK_SECRET && !centerName && centerId);
    const [localReservations, centerRow] = await Promise.all([
      prisma.reservation.findMany({
        where: localWhere,
        include: { driver: { select: { name: true, companyName: true } } },
        orderBy: { startTime: "asc" },
      }),
      needCenter ? getCenterCached(Number(centerId)) : Promise.resolve(null),
    ]);

    const resolvedCenterName = centerName || centerRow?.name || "";
    const berthResults = (BERTH_API_URL && BERTH_KIOSK_SECRET)
      ? await fetchBerthReservations(phone, resolvedCenterName)
      : [];

    // ── ローカル結果マッピング ──
    const results: ReservationResult[] = localReservations.map((r) => {
      const plate = parseVehicleNumber(r.vehicleNumber);
      return {
        id: r.id,
        startTime: r.startTime,
        endTime: r.endTime,
        driverName: r.driverName || r.driver?.name || "",
        companyName: r.companyName || r.driver?.companyName || "",
        vehicleNumber: r.vehicleNumber,
        maxLoad: r.maxLoad,
        plateRegion: r.plateRegion || plate.region,
        plateClassNum: r.plateClassNum || plate.classNum,
        plateHira: r.plateHira || plate.hira,
        plateNumber: r.plateNumber || plate.number,
        status: r.status,
        source: "local",
      };
    });

    // ── berth-app 結果マージ ──
    results.push(...berthResults);

    // ── endTime + 1時間を過ぎた予約を除外（JST基準） ──
    const now = new Date();
    const jstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const nowMinutes = jstNow.getUTCHours() * 60 + jstNow.getUTCMinutes();

    const filtered = results.filter((r) => {
      const [h, m] = r.endTime.split(":").map(Number);
      if (isNaN(h) || isNaN(m)) return true;
      return nowMinutes <= h * 60 + m + 60;
    });

    return NextResponse.json(filtered);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "予約検索に失敗しました" }, { status: 500 });
  }
}

/**
 * berth-app から予約を取得(maxLoad 補完含む)。
 * センター名は呼び元が解決済み — 旧版の内部 DB シリアル呼び出しを削除。
 */
async function fetchBerthReservations(
  phone: string, centerName: string,
): Promise<ReservationResult[]> {
  try {
    const centerParam = centerName
      ? `&centerName=${encodeURIComponent(centerName)}`
      : "";

    const url = `${BERTH_API_URL}/api/reception/reservations?phone=${encodeURIComponent(phone)}${centerParam}`;
    const res = await fetch(url, {
      headers: { "X-Kiosk-Secret": BERTH_KIOSK_SECRET },
      cache: "no-store",
      signal: AbortSignal.timeout(BERTH_TIMEOUT),
    });

    if (!res.ok) return [];

    const berthReservations = (await res.json()) as {
      id: number; startTime: string; endTime: string;
      driverName: string; companyName: string;
      vehicleNumber: string; maxLoad?: string; status: string;
    }[];

    // maxLoad が無い車両をローカルDBから補完
    const needLookup = berthReservations.filter((r) => !r.maxLoad && r.vehicleNumber);
    // Set の spread は tsconfig.target に応じて downlevelIteration 警告を出すので Array.from で安全化
    const vehicleNumbers = Array.from(new Set(needLookup.map((r) => r.vehicleNumber)));
    const vehicles = vehicleNumbers.length > 0
      ? await prisma.vehicle.findMany({
          where: { vehicleNumber: { in: vehicleNumbers }, isActive: true },
          select: { vehicleNumber: true, maxLoad: true },
        })
      : [];
    const maxLoadMap = new Map(vehicles.map((v) => [v.vehicleNumber, v.maxLoad]));

    return berthReservations.map((r) => {
      const plate = parseVehicleNumber(r.vehicleNumber);
      return {
        id: r.id + 1000000,
        startTime: r.startTime,
        endTime: r.endTime,
        driverName: r.driverName,
        companyName: r.companyName,
        vehicleNumber: r.vehicleNumber,
        maxLoad: r.maxLoad || maxLoadMap.get(r.vehicleNumber) || "",
        plateRegion: plate.region,
        plateClassNum: plate.classNum,
        plateHira: plate.hira,
        plateNumber: plate.number,
        status: r.status,
        source: "berth",
      };
    });
  } catch (e) {
    console.error("berth-app reservations (non-blocking):", e);
    return [];
  }
}
