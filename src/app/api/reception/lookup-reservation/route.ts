import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyKioskSecret } from "@/lib/auth";
import { getJSTDayRange } from "@/lib/jstDate";

export const dynamic = "force-dynamic";

const BERTH_API_URL = process.env.BERTH_API_URL || "";
const BERTH_KIOSK_SECRET = process.env.BERTH_KIOSK_SECRET || "";
const BERTH_TIMEOUT = 3000; // 3秒（旧: 8秒）

/** 車番文字列をプレート4要素に分解 */
function parseVehicleNumber(v: string) {
  const empty = { region: "", classNum: "", hira: "", number: "" };
  if (!v) return empty;
  const parts = v.split(/\s+/);
  if (parts.length >= 4) return { region: parts[0], classNum: parts[1], hira: parts[2], number: parts[3] };
  const m = v.match(/^([^\d]+?)(\d{1,4})([ぁ-ん]|[a-zA-Z])(\d{1,4})$/);
  if (m) return { region: m[1], classNum: m[2], hira: m[3], number: m[4] };
  if (parts.length === 3) {
    const m2 = parts[2].match(/^([ぁ-ん]|[a-zA-Z])(\d{1,4})$/);
    if (m2) return { region: parts[0], classNum: parts[1], hira: m2[1], number: m2[2] };
  }
  return empty;
}

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

    // ── ローカルDB + berth-app を並列実行 ──
    const berthPromise = (BERTH_API_URL && BERTH_KIOSK_SECRET)
      ? fetchBerthReservations(phone, centerId ? Number(centerId) : 0, centerName)
      : Promise.resolve([]);

    const { start: todayStart } = getJSTDayRange();
    const todayStr = todayStart.toISOString().slice(0, 10);
    const todayUtcEnd = new Date(todayStr + "T23:59:59.999Z");

    const localWhere: Record<string, unknown> = {
      phone,
      reservationDate: { gte: todayStart, lte: todayUtcEnd },
      status: { notIn: ["completed", "cancelled", "no_show"] },
    };
    if (centerId) localWhere.centerId = Number(centerId);

    const [localReservations, berthResults] = await Promise.all([
      prisma.reservation.findMany({
        where: localWhere,
        orderBy: { startTime: "asc" },
      }),
      berthPromise,
    ]);

    // ── ローカル結果マッピング ──
    const results: ReservationResult[] = localReservations.map((r) => ({
      id: r.id,
      startTime: r.startTime,
      endTime: r.endTime,
      driverName: r.driverName,
      companyName: r.companyName,
      vehicleNumber: r.vehicleNumber,
      maxLoad: r.maxLoad,
      plateRegion: r.plateRegion,
      plateClassNum: r.plateClassNum,
      plateHira: r.plateHira,
      plateNumber: r.plateNumber,
      status: r.status,
      source: "local",
    }));

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

/** berth-app から予約を取得（センター名解決 + maxLoad補完含む） */
async function fetchBerthReservations(
  phone: string, centerId: number, centerName: string,
): Promise<ReservationResult[]> {
  try {
    // センター名がなければDB取得
    let resolvedCenterName = centerName;
    if (!resolvedCenterName && centerId > 0) {
      const c = await prisma.center.findUnique({ where: { id: centerId } });
      if (c) resolvedCenterName = c.name;
    }

    const centerParam = resolvedCenterName
      ? `&centerName=${encodeURIComponent(resolvedCenterName)}`
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
    const vehicleNumbers = [...new Set(needLookup.map((r) => r.vehicleNumber))];
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
