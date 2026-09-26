import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { waitUntil } from "@vercel/functions";
import { prisma } from "@/lib/prisma";
import { verifyKioskSecret } from "@/lib/auth";
import { getClientIp, hitRateLimit } from "@/lib/rateLimit";
import { createNumberedReceptionInTransaction, ReceptionNumberLimitError } from "@/lib/receptionNumber";
import { hashRequest, isValidRequestId } from "@/lib/idempotency";
import { formatPlate } from "@/types/reception";

export const dynamic = "force-dynamic";

const BERTH_API_URL = process.env.BERTH_API_URL || "";
const BERTH_KIOSK_SECRET = process.env.BERTH_KIOSK_SECRET || "";
const receiptRelations = {
  center: { select: { code: true, name: true } },
  reservation: { select: { startTime: true, endTime: true } },
} satisfies Prisma.ReceptionInclude;
type SavedReception = Prisma.ReceptionGetPayload<{ include: typeof receiptRelations }>;

class RegistrationError extends Error {
  constructor(message: string, readonly status: number = 400) { super(message); }
}

function inputObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new RegistrationError("リクエストの形式が不正です");
  }
  return value as Record<string, unknown>;
}

function inputText(value: unknown, maxLength: number): string {
  if (value === undefined) return "";
  if (typeof value !== "string" || value.length > maxLength) {
    throw new RegistrationError("入力の形式または文字数が不正です");
  }
  return value;
}

function parseRegistration(value: unknown) {
  const body = inputObject(value);
  const plate = inputObject(body.plate ?? {});
  const driver = inputObject(body.driverInput ?? {});
  const phone = inputText(body.phone, 11);
  if (!/^\d{10,11}$/.test(phone)) throw new RegistrationError("正しい電話番号が必要です");
  if (typeof body.centerId !== "number" || !Number.isInteger(body.centerId) || body.centerId <= 0) {
    throw new RegistrationError("センターIDが必要です");
  }
  const requestId = body.requestId;
  if (requestId !== undefined && !isValidRequestId(requestId)) throw new RegistrationError("受付の送信IDが不正です");
  const reservationId = body.reservationId ?? null;
  if (reservationId !== null && (typeof reservationId !== "number" || !Number.isInteger(reservationId) || reservationId <= 0)) {
    throw new RegistrationError("予約IDが不正です");
  }
  if (body.reservationSource !== undefined && body.reservationSource !== "local" && body.reservationSource !== "berth") {
    throw new RegistrationError("予約の種別が不正です");
  }
  const reservationSource = reservationId ? (body.reservationSource ?? "local") as "local" | "berth" : null;
  if (reservationSource === "berth" && reservationId! <= 1000000) throw new RegistrationError("予約IDが不正です");
  const number = inputText(plate.number, 4);
  if (!/^\d{0,4}$/.test(number)) throw new RegistrationError("車両番号が不正です");
  // キー順や省略値によってハッシュが変わらないよう、業務項目を固定順で組み立てる。
  const payload = {
    phone, centerId: body.centerId,
    plate: { region: inputText(plate.region, 50), classNum: inputText(plate.classNum, 4), hira: inputText(plate.hira, 2), number },
    driverInput: { driverName: inputText(driver.driverName, 50), companyName: inputText(driver.companyName, 100), maxLoad: inputText(driver.maxLoad, 10) },
    reservationId, reservationSource,
  };
  return { payload, requestId, requestHash: requestId ? hashRequest(payload) : null };
}

function receiptResult(reception: SavedReception) {
  return {
    id: reception.id,
    centerDailyNo: reception.centerDailyNo,
    arrivedAt: reception.arrivedAt.toISOString(),
    receptionNo: reception.receptionNo,
    fiscalYear: reception.fiscalYear,
    centerCode: reception.receptionNo?.slice(2, 6) || reception.center.code,
    driver: { name: reception.driverName, companyName: reception.companyName, phone: reception.phone },
    vehicleNumber: reception.vehicleNumber,
    plate: { region: reception.plateRegion, classNum: reception.plateClassNum, kana: reception.plateHira, number: reception.plateNumber },
    maxLoad: reception.maxLoad ? Number(reception.maxLoad) : null,
    centerName: reception.center.name,
    ...(reception.reservation ? { reservation: reception.reservation } : {}),
    barcodeValue: `RC-${reception.id}-${reception.centerDailyNo}`,
  };
}

async function notifyBerthApp(reservationId: number) {
  for (const delay of [0, 3000, 10000]) {
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
    try {
      const res = await fetch(`${BERTH_API_URL}/api/reception/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Kiosk-Secret": BERTH_KIOSK_SECRET },
        body: JSON.stringify({ reservationId }), signal: AbortSignal.timeout(5000),
      });
      if (res.ok) return;
      console.error(`berth-app checkin failed: ${res.status}`);
    } catch (error) { console.error("berth-app checkin error:", error); }
  }
}

function notifyReservation(reservationId: number | null, source: string | null) {
  if (source !== "berth" || !reservationId || !BERTH_API_URL || !BERTH_KIOSK_SECRET) return;
  // 確定後の外部連携・バックグラウンド登録失敗を受付失敗に変えない。
  const notification = notifyBerthApp(reservationId - 1000000);
  try { waitUntil(notification); } catch { void notification; }
}

export async function POST(req: NextRequest) {
  const authError = verifyKioskSecret(req);
  if (authError) return authError;
  if (hitRateLimit(`register:${getClientIp(req)}`, 20, 60)) {
    return NextResponse.json({ error: "一時的にご利用いただけません。しばらく経ってから再度お試しください" }, { status: 429 });
  }
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "リクエストの形式が不正です" }, { status: 400 });
  }

  try {
    const { payload, requestId, requestHash } = parseRegistration(body);
    const { phone, centerId, plate, driverInput, reservationId, reservationSource } = payload;
    const localReservationId = reservationSource === "berth" ? null : reservationId;
    const vehicleNumber = formatPlate(plate);
    const arrivedAt = new Date();

    const replay = async () => {
      if (!requestId) return null; // 切替前の端末との互換。新しい画面は必ずIDを送る。
      const saved = await prisma.reception.findUnique({ where: { requestId }, include: receiptRelations });
      if (!saved) return null;
      if (saved.requestHash !== requestHash) {
        throw new RegistrationError("同じ送信IDで受付内容が変更されています。最初からやり直してください", 409);
      }
      return saved;
    };

    const existing = await replay();
    if (existing) {
      notifyReservation(reservationId, reservationSource);
      return NextResponse.json(receiptResult(existing));
    }

    for (let attempt = 0; ; attempt++) {
      try {
        const saved = await prisma.$transaction(async (tx) => {
          const center = await tx.center.findUnique({ where: { id: centerId }, select: { code: true, name: true } });
          if (!center) throw new RegistrationError("指定されたセンターが存在しません");
          if (!/^\d{4}$/.test(center.code)) throw new RegistrationError("センターコードを4桁の数字に設定してください");
          const reservation = localReservationId
            ? await tx.reservation.findUnique({ where: { id: localReservationId }, select: { centerId: true, startTime: true, endTime: true } })
            : null;
          if (localReservationId && (!reservation || reservation.centerId !== centerId)) {
            throw new RegistrationError("このセンターの予約が見つかりません", 409);
          }
          const driver = await tx.driver.upsert({
            where: { driver_phone_name_company: { phone, name: driverInput.driverName, companyName: driverInput.companyName } },
            create: { phone, name: driverInput.driverName, companyName: driverInput.companyName }, update: { updatedAt: arrivedAt },
          });
          const vehicle = vehicleNumber ? await tx.vehicle.upsert({
            where: { vehicle_number_phone: { vehicleNumber, phone } },
            create: { region: plate.region, classNum: plate.classNum, hira: plate.hira, number: plate.number, vehicleNumber, maxLoad: driverInput.maxLoad, phone },
            update: { maxLoad: driverInput.maxLoad || undefined, updatedAt: arrivedAt },
          }) : null;
          const reception = await createNumberedReceptionInTransaction(tx, center.code, {
            centerId, arrivedAt, requestId, requestHash,
            driverName: driverInput.driverName, companyName: driverInput.companyName, phone,
            plateRegion: plate.region, plateClassNum: plate.classNum, plateHira: plate.hira, plateNumber: plate.number,
            vehicleNumber, maxLoad: driverInput.maxLoad,
            driverId: driver.id, vehicleId: vehicle?.id ?? null, reservationId: localReservationId,
          });
          if (localReservationId) {
            const updated = await tx.reservation.updateMany({
              where: { id: localReservationId, centerId, status: "pending" }, data: { status: "checked_in" },
            });
            if (updated.count !== 1) throw new RegistrationError("この予約は受付済み、または取り消されています。受付担当者に確認してください", 409);
          }
          return { ...reception, center, reservation: reservation ? { startTime: reservation.startTime, endTime: reservation.endTime } : null };
        }, { maxWait: 10000, timeout: 20000 });

        notifyReservation(reservationId, reservationSource);
        return NextResponse.json(receiptResult(saved));
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && ["P2002", "P2034"].includes(error.code)) {
          // 同時再送は一方だけ保存される。失敗したtransactionの外から確定済み受付を読む。
          const saved = await replay();
          if (saved) {
            notifyReservation(reservationId, reservationSource);
            return NextResponse.json(receiptResult(saved));
          }
          if (attempt < 3) continue;
        }
        throw error;
      }
    }
  } catch (error) {
    if (error instanceof RegistrationError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof ReceptionNumberLimitError) return NextResponse.json({ error: error.message }, { status: 503 });
    if (error instanceof Prisma.PrismaClientKnownRequestError && ["P2002", "P2034"].includes(error.code)) {
      return NextResponse.json({ error: "受付の処理が混み合っています。同じ画面で再試行してください。" }, { status: 503 });
    }
    console.error(error);
    return NextResponse.json({ error: "受付処理に失敗しました。同じ画面で再試行してください。" }, { status: 500 });
  }
}
