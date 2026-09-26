import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { waitUntil } from "@vercel/functions";
import { prisma } from "@/lib/prisma";
import { verifyKioskSecret } from "@/lib/auth";
import { getJSTToday, getJSTDayRange } from "@/lib/jstDate";
import { getClientIp, hitRateLimit } from "@/lib/rateLimit";
import { createNumberedReception, ReceptionNumberLimitError } from "@/lib/receptionNumber";

export const dynamic = "force-dynamic";

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

  // レート制限: 同一IP から 60秒間に 20 回まで。正常利用では絶対超えない閾値だが
  // curl で sec-fetch-site 偽装した大量受付攻撃に対する防御として設置。
  const ip = getClientIp(req);
  if (hitRateLimit(`register:${ip}`, 20, 60)) {
    return NextResponse.json(
      { error: "一時的にご利用いただけません。しばらく経ってから再度お試しください" },
      { status: 429 }
    );
  }

  // JSON パースは try/catch で 400 を返す（500 にしない）
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "リクエストの形式が不正です" }, { status: 400 });
  }

  // 日付をまたいでも受付日時・採番日・集計日を一致させる。
  const arrivedAt = new Date();
  const jstRange = getJSTDayRange(getJSTToday(arrivedAt));

  try {
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
    if (!Number.isInteger(centerId) || centerId <= 0) {
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

    const center = await prisma.center.findUnique({
      where: { id: centerId },
      select: { id: true, code: true, name: true },
    });
    if (!center) {
      return NextResponse.json({ error: "指定されたセンターが存在しません" }, { status: 400 });
    }
    if (!/^\d{4}$/.test(center.code)) {
      return NextResponse.json({ error: "センターコードを4桁の数字に設定してください" }, { status: 400 });
    }

    const [driver, vehicle] = await Promise.all([
      prisma.driver.upsert({
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
        update: { updatedAt: new Date() },
      }),
      vehicleNumber
        ? prisma.vehicle.upsert({
            where: {
              vehicle_number_phone: { vehicleNumber, phone: effectivePhone },
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
          })
        : Promise.resolve(null),
    ]);

    const reception = await createNumberedReception(prisma, center.code, {
      centerId,
      arrivedAt,
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
    });

    // ─── フェーズ3: 予約 checked_in 更新 + 待機台数 を **並列** で ─────
    // 旧コードは updateMany → count を直列実行していた。どちらも reception.create 完了後は
    // 独立して走れるため並列化(rtt × 2 → rtt × 1)。
    const [_updated, waitingCount] = await Promise.all([
      localReservationId
        ? prisma.reservation.updateMany({
            where: { id: localReservationId, status: { not: "cancelled" } },
            data: { status: "checked_in" },
          })
        : Promise.resolve(null),
      prisma.reception.count({
        where: { centerId, arrivedAt: { gte: jstRange.start, lte: jstRange.end } },
      }),
    ]);

    const responseData: Record<string, unknown> = {
      id: reception.id,
      centerDailyNo: reception.centerDailyNo,
      arrivedAt: reception.arrivedAt.toISOString(),
      waitingCount,
      receptionNo: reception.receptionNo,
      fiscalYear: reception.fiscalYear,
      centerCode: center?.code ?? "",
      driver: {
        name: driverInput.driverName,
        companyName: driverInput.companyName,
        phone: effectivePhone,
      },
      vehicleNumber,
      plate: {
        region: plate.region,
        classNum: plate.classNum,
        kana: plate.hira,
        number: plate.number,
      },
      maxLoad: driverInput.maxLoad ? Number(driverInput.maxLoad) : null,
      centerName: center?.name ?? "",
      barcodeValue: `RC-${reception.id}-${reception.centerDailyNo}`,
    };

    // ── berth-app に予約チェックインを通知 ──
    // Vercel では waitUntil でレスポンス後も処理を継続。
    // 非 Vercel 環境（Docker self-host 等）では waitUntil が TypeError を投げるので
    // fire-and-forget に fallback する。
    if (originalBerthId && BERTH_API_URL && BERTH_KIOSK_SECRET) {
      const notify = notifyBerthApp(BERTH_API_URL, BERTH_KIOSK_SECRET, originalBerthId);
      try {
        waitUntil(notify);
      } catch {
        void notify; // fire-and-forget
      }
    }

    return NextResponse.json(responseData);
  } catch (e) {
    if (e instanceof ReceptionNumberLimitError) {
      return NextResponse.json({ error: e.message }, { status: 503 });
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && ["P2002", "P2034"].includes(e.code)) {
      return NextResponse.json({ error: "受付番号を発番できませんでした。管理者に連絡してください。" }, { status: 503 });
    }
    console.error(e);
    return NextResponse.json({ error: "受付処理に失敗しました" }, { status: 500 });
  }
}
