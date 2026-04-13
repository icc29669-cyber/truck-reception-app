import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyKioskSecret } from "@/lib/auth";
import { getJSTToday, getJSTDayRange } from "@/lib/jstDate";

const BERTH_API_URL = process.env.BERTH_API_URL || "";
const BERTH_KIOSK_SECRET = process.env.BERTH_KIOSK_SECRET || "";

async function notifyBerthApp(url: string, secret: string, reservationId: number) {
  const maxRetries = 3;
  const delays = [0, 3000, 10000]; // immediate, 3s, 10s
  for (let i = 0; i < maxRetries; i++) {
    if (i > 0) await new Promise(r => setTimeout(r, delays[i]));
    try {
      const res = await fetch(`${url}/api/reception/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Kiosk-Secret": secret },
        body: JSON.stringify({ reservationId }),
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) return;
      console.error(`berth-app checkin attempt ${i+1} failed: ${res.status}`);
    } catch (e) {
      console.error(`berth-app checkin attempt ${i+1} error:`, e);
    }
  }
  console.error(`berth-app checkin failed after ${maxRetries} attempts for reservation ${reservationId}`);
}

function formatPlate(p: {
  region: string;
  classNum: string;
  hira: string;
  number: string;
}): string {
  if (!p.region && !p.classNum) return "";
  return [p.region, p.classNum, p.hira, p.number].filter(Boolean).join(" ");
}

export async function POST(req: NextRequest) {
  const authError = verifyKioskSecret(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const {
      phone,
      centerId,
      plate = { region: "", classNum: "", hira: "", number: "" },
      driverInput = { companyName: "", driverName: "", phone: "", maxLoad: "" },
      reservationId,
      reservationSource,
    } = body as {
      phone: string;
      centerId: number;
      plate?: { region: string; classNum: string; hira: string; number: string };
      driverInput?: { companyName: string; driverName: string; phone: string; maxLoad: string };
      reservationId?: number;
      reservationSource?: "local" | "berth";
    };

    // berth-app予約の場合、オフセット(+1000000)を除去して元のIDを取得
    const isBerthReservation = reservationSource === "berth";
    const originalBerthId = isBerthReservation && reservationId ? reservationId - 1000000 : undefined;
    // ローカルDB用のreservationId（berth予約の場合はnull — ローカルDBには存在しない）
    const localReservationId = isBerthReservation ? null : (reservationId ?? null);

    if (!phone || !/^\d{10,11}$/.test(phone)) {
      return NextResponse.json({ error: "正しい電話番号が必要です" }, { status: 400 });
    }
    if (!centerId || isNaN(centerId) || centerId <= 0) {
      return NextResponse.json({ error: "センターIDが必要です" }, { status: 400 });
    }
    // 入力文字数制限（XSS/インジェクション対策）
    if (driverInput.driverName && driverInput.driverName.length > 50) {
      return NextResponse.json({ error: "名前が長すぎます" }, { status: 400 });
    }
    if (driverInput.companyName && driverInput.companyName.length > 100) {
      return NextResponse.json({ error: "会社名が長すぎます" }, { status: 400 });
    }
    if (plate.number && !/^\d{0,4}$/.test(plate.number)) {
      return NextResponse.json({ error: "車両番号が不正です" }, { status: 400 });
    }

    const vehicleNumber = formatPlate(plate);
    const effectivePhone = phone || driverInput.phone;

    // ─── トランザクションで一括処理 ─────────────────────────
    const result = await prisma.$transaction(async (tx) => {
      // 0. センター存在チェック
      const center = await tx.center.findUnique({ where: { id: centerId } });
      if (!center) {
        throw new Error("INVALID_CENTER");
      }

      // 1. ドライバーをupsert（ユニーク制約: phone+name+companyName）
      const driver = await tx.driver.upsert({
        where: {
          driver_phone_name_company: {
            phone: effectivePhone,
            name: driverInput.driverName,
            companyName: driverInput.companyName,
          },
        },
        create: {
          phone: effectivePhone,
          name: driverInput.driverName,
          companyName: driverInput.companyName,
        },
        update: {
          updatedAt: new Date(),
        },
      });

      // 2. 車両をupsert（ユニーク制約: vehicleNumber+phone）
      let vehicle = null;
      if (vehicleNumber) {
        vehicle = await tx.vehicle.upsert({
          where: {
            vehicle_number_phone: {
              vehicleNumber,
              phone: effectivePhone,
            },
          },
          create: {
            region: plate.region,
            classNum: plate.classNum,
            hira: plate.hira,
            number: plate.number,
            vehicleNumber,
            maxLoad: driverInput.maxLoad ?? "",
            phone: effectivePhone,
          },
          update: {
            maxLoad: driverInput.maxLoad || undefined,
            updatedAt: new Date(),
          },
        });
      }

      // 3. 本日のセンター受付連番を算出（JST基準・MAXで欠番にも対応）
      const { start: todayStart, end: todayEnd } = getJSTDayRange();

      const maxResult = await tx.reception.aggregate({
        where: {
          centerId,
          arrivedAt: { gte: todayStart, lte: todayEnd },
        },
        _max: { centerDailyNo: true },
      });
      const centerDailyNo = (maxResult._max.centerDailyNo ?? 0) + 1;

      // 4. 受付記録を作成
      const reception = await tx.reception.create({
        data: {
          centerId,
          centerDailyNo,
          driverName: driverInput.driverName,
          companyName: driverInput.companyName,
          phone: effectivePhone,
          plateRegion: plate.region,
          plateClassNum: plate.classNum,
          plateHira: plate.hira,
          plateNumber: plate.number,
          vehicleNumber,
          maxLoad: driverInput.maxLoad ?? "",
          driverId: driver.id,
          vehicleId: vehicle?.id ?? null,
          reservationId: localReservationId,
        },
        include: { center: true },
      });

      // 5. ローカル予約があれば checked_in に更新（berth-app予約は後でHTTP通知）
      if (localReservationId) {
        const resv = await tx.reservation.findUnique({ where: { id: localReservationId } });
        if (resv && resv.status !== "cancelled") {
          await tx.reservation.update({
            where: { id: localReservationId },
            data: { status: "checked_in" },
          });
        }
      }

      return { reception, centerDailyNo };
    });

    // 現在の待機台数（本日受付済み件数・JST基準）
    const { start: todayStartOut } = getJSTDayRange();
    const waitingCount = await prisma.reception.count({
      where: { centerId, arrivedAt: { gte: todayStartOut } },
    });

    const center = await prisma.center.findUnique({ where: { id: centerId } });

    const responseData: Record<string, unknown> = {
      id: result.reception.id,
      centerDailyNo: result.centerDailyNo,
      arrivedAt: result.reception.arrivedAt.toISOString(),
      waitingCount,
      driver: {
        name: driverInput.driverName,
        companyName: driverInput.companyName,
        phone: effectivePhone,
      },
      vehicleNumber,
      centerName: center?.name ?? "",
      barcodeValue: `RC-${result.reception.id}-${result.centerDailyNo}`,
    };

    // ── berth-app に予約チェックインを通知（非同期・リトライ付き・失敗しても受付は完了） ──
    // berth-app予約の場合のみ通知（オフセット除去済みの元IDを使用）
    if (originalBerthId && BERTH_API_URL && BERTH_KIOSK_SECRET) {
      notifyBerthApp(BERTH_API_URL, BERTH_KIOSK_SECRET, originalBerthId);
    }

    return NextResponse.json(responseData);
  } catch (e) {
    if (e instanceof Error && e.message === "INVALID_CENTER") {
      return NextResponse.json({ error: "指定されたセンターが存在しません" }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "受付処理に失敗しました" }, { status: 500 });
  }
}
