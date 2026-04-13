import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyKioskSecret } from "@/lib/auth";
import { getJSTDayRange } from "@/lib/jstDate";

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
  const m = v.match(/^([^\d]+?)(\d{1,4})([ぁ-ん]|[a-zA-Z])(\d{1,4})$/);
  if (m) {
    return { region: m[1], classNum: m[2], hira: m[3], number: m[4] };
  }
  if (parts.length === 3) {
    const m2 = parts[2].match(/^([ぁ-ん]|[a-zA-Z])(\d{1,4})$/);
    if (m2) return { region: parts[0], classNum: parts[1], hira: m2[1], number: m2[2] };
  }
  return empty;
}

export async function GET(req: NextRequest) {
  const authError = verifyKioskSecret(req);
  if (authError) return authError;

  try {
    const phone = req.nextUrl.searchParams.get("phone");
    const centerId = req.nextUrl.searchParams.get("centerId");

    if (!phone || !/^\d{10,11}$/.test(phone)) {
      return NextResponse.json({ error: "電話番号は必須です" }, { status: 400 });
    }

    const results: {
      id: number;
      startTime: string;
      endTime: string;
      driverName: string;
      companyName: string;
      vehicleNumber: string;
      maxLoad: string;
      plateRegion: string;
      plateClassNum: string;
      plateHira: string;
      plateNumber: string;
      status: string;
      source: string;
    }[] = [];

    // ── 1. ローカルDBの予約を検索（JST基準） ──
    // 既存データ(UTC midnight)と新データ(JST midnight)の両方を拾う
    const { start: todayStart } = getJSTDayRange();
    const todayStr = todayStart.toISOString().slice(0, 10); // "YYYY-MM-DD"
    const todayUtcEnd = new Date(todayStr + "T23:59:59.999Z");

    const localWhere: Record<string, unknown> = {
      phone,
      reservationDate: { gte: todayStart, lte: todayUtcEnd },
      status: { notIn: ["completed", "cancelled", "no_show"] },
    };
    if (centerId) {
      localWhere.centerId = Number(centerId);
    }

    const localReservations = await prisma.reservation.findMany({
      where: localWhere,
      orderBy: { startTime: "asc" },
    });

    for (const r of localReservations) {
      results.push({
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
      });
    }

    // ── 2. berth-app API から予約を取得（設定されている場合） ──
    if (BERTH_API_URL && BERTH_KIOSK_SECRET) {
      const clientCenterName = req.nextUrl.searchParams.get("centerName") || "";
      let centerParam = "";
      if (clientCenterName) {
        centerParam = `&centerName=${encodeURIComponent(clientCenterName)}`;
      } else if (centerId) {
        const localCenter = await prisma.center.findUnique({ where: { id: Number(centerId) } });
        if (localCenter) {
          centerParam = `&centerName=${encodeURIComponent(localCenter.name)}`;
        }
      }
      const url = `${BERTH_API_URL}/api/reception/reservations?phone=${encodeURIComponent(phone)}${centerParam}`;
      try {
        const res = await fetch(url, {
          headers: { "X-Kiosk-Secret": BERTH_KIOSK_SECRET },
          cache: "no-store",
          signal: AbortSignal.timeout(8000),
        });

        if (res.ok) {
          const berthReservations = (await res.json()) as {
            id: number;
            startTime: string;
            endTime: string;
            driverName: string;
            companyName: string;
            vehicleNumber: string;
            maxLoad?: string;
            status: string;
          }[];

          // maxLoadをローカルVehicleから補完
          const needLookup = berthReservations.filter((r) => !r.maxLoad && r.vehicleNumber);
          const vehicleNumbers = needLookup.map((r) => r.vehicleNumber);
          const vehicles = vehicleNumbers.length > 0
            ? await prisma.vehicle.findMany({
                where: { vehicleNumber: { in: vehicleNumbers }, isActive: true },
                select: { vehicleNumber: true, maxLoad: true },
              })
            : [];
          const maxLoadMap = new Map(vehicles.map((v) => [v.vehicleNumber, v.maxLoad]));

          for (const r of berthReservations) {
            // ローカルと重複しないようにIDで確認（berth-appのIDにはプレフィックス付与）
            const plate = parseVehicleNumber(r.vehicleNumber);
            results.push({
              id: r.id + 1000000, // berth-app IDとの衝突回避
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
            });
          }
        }
      } catch (e) {
        console.error("berth-app reservations error:", e);
      }
    }

    // endTime + 1時間を過ぎた予約は非表示（JST基準）
    const now = new Date();
    const jstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const nowMinutes = jstNow.getUTCHours() * 60 + jstNow.getUTCMinutes();

    const filtered = results.filter((r) => {
      const [h, m] = r.endTime.split(":").map(Number);
      if (isNaN(h) || isNaN(m)) return true;
      const endMinutes = h * 60 + m + 60; // endTime + 1時間
      return nowMinutes <= endMinutes;
    });

    return NextResponse.json(filtered);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "予約検索に失敗しました" }, { status: 500 });
  }
}
