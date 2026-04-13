import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyKioskSecret } from "@/lib/auth";

export const dynamic = "force-dynamic";

const BERTH_API_URL = process.env.BERTH_API_URL || "";
const BERTH_KIOSK_SECRET = process.env.BERTH_KIOSK_SECRET || "";
const BERTH_TIMEOUT = 3000; // 3秒（旧: 8秒）

export async function GET(req: NextRequest) {
  const authError = verifyKioskSecret(req);
  if (authError) return authError;

  const phone = req.nextUrl.searchParams.get("phone") ?? "";
  const centerId = Number(req.nextUrl.searchParams.get("centerId") ?? "0");

  if (!phone || !/^\d{10,11}$/.test(phone)) {
    return NextResponse.json({ error: "電話番号が必要です" }, { status: 400 });
  }

  try {
    // ── すべて並列実行: ドライバー + 車両 + センター + berth-app ──
    const berthPromise = (BERTH_API_URL && BERTH_KIOSK_SECRET && centerId > 0)
      ? fetchBerth(phone, centerId)
      : Promise.resolve(null);

    const [drivers, vehicles, berthData] = await Promise.all([
      prisma.driver.findMany({
        where: { phone, isActive: true },
        orderBy: { updatedAt: "desc" },
        take: 10,
      }),
      prisma.vehicle.findMany({
        where: { phone, isActive: true },
        orderBy: { updatedAt: "desc" },
        take: 10,
      }),
      berthPromise,
    ]);

    // ── ローカル結果をマッピング ──
    const driverList = drivers.map((d) => ({
      id: d.id,
      name: d.name,
      companyName: d.companyName,
      phone: d.phone,
      source: "local" as const,
    }));

    const vehicleList = vehicles.map((v) => ({
      id: v.id,
      vehicleNumber: v.vehicleNumber,
      plate: { region: v.region, classNum: v.classNum, hira: v.hira, number: v.number },
      maxLoad: v.maxLoad,
      source: "local" as const,
    }));

    // ── berth-app 結果をマージ ──
    if (berthData?.driver) {
      const bd = berthData.driver;
      const alreadyExists = driverList.some(
        (d) => d.name === bd.name && d.companyName === bd.companyName
      );
      if (!alreadyExists && bd.name) {
        driverList.push({
          id: bd.id + 1000000,
          name: bd.name,
          companyName: bd.companyName,
          phone: bd.phone,
          source: "berth",
        });
      }
      if (bd.defaultVehicle && vehicleList.length === 0) {
        const parts = bd.defaultVehicle.split(/\s+/);
        if (parts.length >= 4) {
          vehicleList.push({
            id: bd.id + 1000000,
            vehicleNumber: bd.defaultVehicle,
            plate: { region: parts[0], classNum: parts[1], hira: parts[2], number: parts[3] },
            maxLoad: bd.defaultMaxLoad || "",
            source: "berth",
          });
        }
      }
    }

    return NextResponse.json({ drivers: driverList, vehicles: vehicleList });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "検索に失敗しました" }, { status: 500 });
  }
}

/** berth-app から電話番号でドライバーを検索（センターコード取得含む） */
async function fetchBerth(phone: string, centerId: number) {
  try {
    const center = await prisma.center.findUnique({ where: { id: centerId } });
    const centerParam = center?.code
      ? `&centerCode=${encodeURIComponent(center.code)}`
      : `&centerId=${centerId}`;

    const url = `${BERTH_API_URL}/api/reception/lookup?phone=${encodeURIComponent(phone)}${centerParam}`;
    const res = await fetch(url, {
      headers: { "X-Kiosk-Secret": BERTH_KIOSK_SECRET },
      cache: "no-store",
      signal: AbortSignal.timeout(BERTH_TIMEOUT),
    });

    if (!res.ok) return null;
    return (await res.json()) as {
      driver: {
        id: number; name: string; companyName: string;
        defaultVehicle: string; defaultMaxLoad: string; phone: string;
      } | null;
    };
  } catch (e) {
    console.error("berth-app lookup (non-blocking):", e);
    return null;
  }
}
