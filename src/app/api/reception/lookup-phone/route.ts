import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyKioskSecret } from "@/lib/auth";
import { getCenterCached } from "@/lib/centerCache";

export const dynamic = "force-dynamic";

const BERTH_API_URL = process.env.BERTH_API_URL || "";
const BERTH_KIOSK_SECRET = process.env.BERTH_KIOSK_SECRET || "";
// berth-app コールドスタート対策。長過ぎるとキオスク体感が悪化するので 2秒 = 「3秒より短く」まで詰める
const BERTH_TIMEOUT = 2000;

export async function GET(req: NextRequest) {
  const authError = verifyKioskSecret(req);
  if (authError) return authError;

  const phone = req.nextUrl.searchParams.get("phone") ?? "";
  const centerId = Number(req.nextUrl.searchParams.get("centerId") ?? "0");

  if (!phone || !/^\d{10,11}$/.test(phone)) {
    return NextResponse.json({ error: "電話番号が必要です" }, { status: 400 });
  }

  try {
    // ── すべて並列実行: ドライバー + 車両 + センター(キャッシュ) + berth-app ──
    // 旧コードは fetchBerth 内で center.findUnique が同期実行されていたため
    // 外部 HTTP fetch が始まる前に DB 1rtt を待たされていた。
    // ここで center を先取りし、fetchBerth は既に解決済みの center を受け取る形に変更。
    const canFetchBerth = BERTH_API_URL && BERTH_KIOSK_SECRET && centerId > 0;

    const [drivers, vehicles, center] = await Promise.all([
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
      canFetchBerth ? getCenterCached(centerId) : Promise.resolve(null),
    ]);

    // center 取得後に berth-app へ fetch(並列 DB 群が完了 = 典型的には 50-100ms)
    const berthData = canFetchBerth ? await fetchBerth(phone, centerId, center?.code ?? "") : null;

    // ── ローカル結果をマッピング ──
    // source は "local" と "berth" の合併 — 後段で berth 結果を push するため union で確定させる
    type DriverSource = "local" | "berth";
    type DriverItem = {
      id: number;
      name: string;
      companyName: string;
      phone: string;
      source: DriverSource;
    };
    type VehicleItem = {
      id: number;
      vehicleNumber: string;
      plate: { region: string; classNum: string; hira: string; number: string };
      maxLoad: string;
      source: DriverSource;
    };
    const driverList: DriverItem[] = drivers.map((d) => ({
      id: d.id,
      name: d.name,
      companyName: d.companyName,
      phone: d.phone,
      source: "local",
    }));

    const vehicleList: VehicleItem[] = vehicles.map((v) => ({
      id: v.id,
      vehicleNumber: v.vehicleNumber,
      plate: { region: v.region, classNum: v.classNum, hira: v.hira, number: v.number },
      maxLoad: v.maxLoad,
      source: "local",
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

/**
 * berth-app から電話番号でドライバーを検索。
 * center 引き当ては呼び元が済ませている(centerCode を受け取って使う)ので
 * ここでは HTTP fetch のみを行う。DB シリアル実行によるレイテンシ積み上げを解消。
 */
async function fetchBerth(phone: string, centerId: number, centerCode: string) {
  try {
    const centerParam = centerCode
      ? `&centerCode=${encodeURIComponent(centerCode)}`
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
