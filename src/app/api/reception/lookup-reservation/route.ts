import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyKioskSecret } from "@/lib/auth";

const BERTH_API_URL = process.env.BERTH_API_URL || "";
const BERTH_KIOSK_SECRET = process.env.BERTH_KIOSK_SECRET || "";

/**
 * 車番文字列をプレート4要素に分解
 * "世田谷 100 を 1212" or "世田谷100を1212" → { region:"世田谷", classNum:"100", hira:"を", number:"1212" }
 */
function parseVehicleNumber(v: string): { region: string; classNum: string; hira: string; number: string } {
  const empty = { region: "", classNum: "", hira: "", number: "" };
  if (!v) return empty;
  // スペース区切りの場合 (例: "多摩 500 あ 7917")
  const parts = v.split(/\s+/);
  if (parts.length >= 4) {
    return { region: parts[0], classNum: parts[1], hira: parts[2], number: parts[3] };
  }
  // スペースなしの場合 (例: "世田谷100を1212") - 正規表現でパース
  const m = v.match(/^([^\d]+?)(\d{1,4})([ぁ-ん]|[a-zA-Z])(\d{1,4})$/);
  if (m) {
    return { region: m[1], classNum: m[2], hira: m[3], number: m[4] };
  }
  // 3パーツの場合 (例: "多摩 500 あ1212")
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

    // ── berth-app API から予約を取得 ──
    if (BERTH_API_URL && BERTH_KIOSK_SECRET) {
      // クライアントから centerName が渡されたらDB参照不要、なければDB検索
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
      const res = await fetch(url, {
        headers: { "X-Kiosk-Secret": BERTH_KIOSK_SECRET },
        cache: "no-store",
      });

      if (!res.ok) {
        console.error("berth-app reservations error:", res.status, await res.text());
        return NextResponse.json([]);
      }

      const berthReservations = (await res.json()) as {
        id: number;
        startTime: string;
        endTime: string;
        driverName: string;
        companyName: string;
        vehicleNumber: string;
        status: string;
      }[];

      // 車番から reception-app の Vehicle テーブルで maxLoad を検索
      const vehicleNumbers = berthReservations.map((r) => r.vehicleNumber).filter(Boolean);
      const vehicles = vehicleNumbers.length > 0
        ? await prisma.vehicle.findMany({
            where: { vehicleNumber: { in: vehicleNumbers }, isActive: true },
            select: { vehicleNumber: true, maxLoad: true },
          })
        : [];
      const maxLoadMap = new Map(vehicles.map((v) => [v.vehicleNumber, v.maxLoad]));

      // ReservationCandidate 型に変換（車番を分解 + maxLoad 補完）
      return NextResponse.json(
        berthReservations.map((r) => {
          const plate = parseVehicleNumber(r.vehicleNumber);
          return {
            id: r.id,
            startTime: r.startTime,
            endTime: r.endTime,
            driverName: r.driverName,
            companyName: r.companyName,
            vehicleNumber: r.vehicleNumber,
            maxLoad: maxLoadMap.get(r.vehicleNumber) ?? "",
            plateRegion: plate.region,
            plateClassNum: plate.classNum,
            plateHira: plate.hira,
            plateNumber: plate.number,
            status: r.status,
          };
        })
      );
    }

    // ── berth-app 未設定時: 空配列を返す ──
    return NextResponse.json([]);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "予約検索に失敗しました" }, { status: 500 });
  }
}
