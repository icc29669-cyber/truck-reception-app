import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/driverAuth";
import { checkAdminAuth } from "@/lib/adminAuth";
import { Prisma } from "@prisma/client";
import { getJSTDayRange, getJSTToday } from "@/lib/jstDate";
import { parseVehicleNumber } from "@/lib/vehiclePlate";
import { hashRequest, isValidRequestId } from "@/lib/idempotency";

import { validateReservationSchedule } from "@/lib/reservationValidation";
import { PENDING_RESERVATION_STATUSES, normalizeReservationStatus } from "@/lib/reservationStatus";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getSession();
  const isAdmin = await checkAdminAuth();

  if (!session && !isAdmin) {
    return NextResponse.json({ error: "未認証" }, { status: 401 });
  }

  const mine = request.nextUrl.searchParams.get("mine") === "true";
  if (mine && !session) return NextResponse.json({ error: "ドライバーのログインが必要です" }, { status: 401 });
  const scope = request.nextUrl.searchParams.get("scope");
  if (mine && scope) {
    const page = Number(request.nextUrl.searchParams.get("page") || "1");
    if (!["upcoming", "past"].includes(scope) || !Number.isInteger(page) || page < 1 || page > 100000) {
      return NextResponse.json({ error: "一覧の条件が不正です" }, { status: 400 });
    }
    const { start } = getJSTDayRange();
    const where: Prisma.ReservationWhereInput = { driverId: session!.id, ...(scope === "upcoming"
      ? { reservationDate: { gte: start }, status: { in: [...PENDING_RESERVATION_STATUSES, "checked_in"] } }
      : { OR: [{ reservationDate: { lt: start } }, { status: { in: ["completed", "cancelled", "no_show"] } }] }) };
    const direction = scope === "past" ? "desc" : "asc";
    const rows = await prisma.reservation.findMany({
      where, skip: (page - 1) * 30, take: 31,
      select: { id: true, driverId: true, centerId: true, reservationDate: true, startTime: true, endTime: true,
        vehicleNumber: true, companyName: true, driverName: true, maxLoad: true, status: true,
        center: { select: { id: true, name: true } } },
      orderBy: [{ reservationDate: direction }, { startTime: direction }, { id: direction }],
    });
    return NextResponse.json(rows.slice(0, 30).map(row => ({ ...row, date: getJSTToday(row.reservationDate), status: normalizeReservationStatus(row.status) ?? row.status })), {
      headers: { "X-Has-More": String(rows.length > 30), "Cache-Control": "private, no-store" },
    });
  }

  // 管理者は全件取得、ドライバーは自分の予約のみ
  const driverOnly = !isAdmin || request.nextUrl.searchParams.get("mine") === "true";
  const where = (driverOnly && session) ? { driverId: session.id } : {};

  const reservations = await prisma.reservation.findMany({
    where,
    include: {
      // driver 全件 include は PIN ハッシュや sessionVersion まで返してしまうため必要項目のみ select
      driver: { select: { id: true, name: true, companyName: true, phone: true } },
      center: { select: { id: true, code: true, name: true } },
      receptions: { select: { id: true, arrivedAt: true, centerDailyNo: true } },
    },
    orderBy: [{ reservationDate: "asc" }, { startTime: "asc" }],
  });

  // フロントエンドは r.date (YYYY-MM-DD) を期待しているため reservationDate から派生
  const response = reservations.map((r) => ({
    ...r,
    requestId: undefined,
    requestHash: undefined,
    date: getJSTToday(r.reservationDate),
  }));

  return NextResponse.json(response);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "未認証" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "入力内容が不正です" }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "入力内容が不正です" }, { status: 400 });
  }
  const { date, startTime, endTime, centerId, requestId } = body;
  const { vehicleNumber, maxLoad = "", companyName = "", driverName = "" } = body;

  // 入力バリデーション
  if (![date, startTime, endTime, vehicleNumber].every((v) => typeof v === "string" && v.trim()) ||
      ![maxLoad, companyName, driverName].every((v) => typeof v === "string")) {
    return NextResponse.json({ error: "必須項目が不足しています" }, { status: 400 });
  }
  const scheduleError = validateReservationSchedule(date, startTime, endTime);
  if (scheduleError) return NextResponse.json({ error: scheduleError }, { status: 400 });
  // 文字数制限
  if (vehicleNumber.length > 50) {
    return NextResponse.json({ error: "車番は50文字以内にしてください" }, { status: 400 });
  }
  if (companyName && companyName.length > 100) {
    return NextResponse.json({ error: "会社名は100文字以内にしてください" }, { status: 400 });
  }
  if (driverName && driverName.length > 100) {
    return NextResponse.json({ error: "ドライバー名は100文字以内にしてください" }, { status: 400 });
  }
  if (maxLoad && (isNaN(Number(maxLoad)) || Number(maxLoad) <= 0)) {
    return NextResponse.json({ error: "最大積載量は正の数値で入力してください" }, { status: 400 });
  }
  if (!Number.isInteger(centerId) || centerId <= 0) {
    return NextResponse.json({ error: "センターの指定が必要です" }, { status: 400 });
  }
  if (requestId !== undefined && !isValidRequestId(requestId)) {
    return NextResponse.json({ error: "送信識別番号が不正です" }, { status: 400 });
  }
  // 連絡先やプロフィールは後から変わるため、同一送信の判定には入力内容と本人IDだけを使う。
  const input = {
    driverId: session.id, date, startTime, endTime, centerId,
    vehicleNumber: vehicleNumber.trim(), maxLoad: maxLoad.trim(),
    companyName: companyName.trim(), driverName: driverName.trim(),
  };
  const requestHash = requestId ? hashRequest(input) : null;
  const { start: reservationDate, end: dayEnd } = getJSTDayRange(date);
  const dayWhere = { gte: reservationDate, lte: dayEnd };
  const plate = parseVehicleNumber(input.vehicleNumber);

  function replay(reservation: ReservationWithDetails) {
    if (reservation.driverId !== session!.id || reservation.requestHash !== requestHash) {
      return NextResponse.json({ error: "同じ送信識別番号で異なる予約は登録できません" }, { status: 409 });
    }
    return reservationResponse(reservation, 200);
  }

  try {
    // 応答が届かなかった再送は、日付が変わった後も保存済みの同じ予約を返す。
    if (requestId) {
      const existing = await prisma.reservation.findUnique({ where: { requestId }, include: reservationInclude });
      if (existing) return replay(existing);
    }
    if (date < getJSTToday()) {
      return NextResponse.json({ error: "過去の日付には予約できません" }, { status: 400 });
    }
    const center = await prisma.center.findUnique({ where: { id: centerId } });
    if (!center) {
      return NextResponse.json({ error: "指定されたセンターが存在しません" }, { status: 400 });
    }
    const setting = await prisma.appSetting.findFirst();
    const maxCapacity = setting?.maxReservationsPerSlot ?? 3;

    // 並行予約の件数競合はトランザクションをやり直し、確定済み件数で判断する。
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const result = await prisma.$transaction(async (tx) => {
          if (requestId) {
            const existing = await tx.reservation.findUnique({ where: { requestId }, include: reservationInclude });
            if (existing) return { reservation: existing, reused: true };
          }
          const duplicate = await tx.reservation.findFirst({
            where: {
              driverId: session.id, reservationDate: dayWhere, startTime, endTime,
              status: { not: "cancelled" }, centerId,
            },
          });
          if (duplicate) throw new Error("DUPLICATE");

          const count = await tx.reservation.count({ where: {
            reservationDate: dayWhere, status: { not: "cancelled" }, centerId,
            startTime: { lt: endTime }, endTime: { gt: startTime },
          } });
          if (count >= maxCapacity) throw new Error("FULL");
          const driver = await tx.driver.findUnique({
            where: { id: session.id }, select: { phone: true, name: true, companyName: true },
          });
          if (!driver) throw new Error("DRIVER_NOT_FOUND");
          const reservation = await tx.reservation.create({
            data: {
              driverId: session.id, centerId, reservationDate, startTime, endTime,
              vehicleNumber: input.vehicleNumber, maxLoad: input.maxLoad,
              companyName: input.companyName || driver.companyName,
              driverName: input.driverName || driver.name,
              phone: driver.phone,
              plateRegion: plate.region, plateClassNum: plate.classNum,
              plateHira: plate.hira, plateNumber: plate.number,
              requestId: requestId ?? null, requestHash,
            },
            include: reservationInclude,
          });
          return { reservation, reused: false };
        }, {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          maxWait: 5000,
          timeout: 10000,
        });
        return result.reused ? replay(result.reservation) : reservationResponse(result.reservation, 201);
      } catch (e) {
        const conflict = e instanceof Prisma.PrismaClientKnownRequestError &&
          (e.code === "P2002" || e.code === "P2034");
        if (!conflict) throw e;
        // 同時送信の片方が既に確定していれば、同じ結果で応答する。
        if (requestId) {
          const existing = await prisma.reservation.findUnique({ where: { requestId }, include: reservationInclude });
          if (existing) return replay(existing);
        }
        if (attempt === 2) throw e;
      }
    }
    throw new Error("RETRY_EXHAUSTED");
  } catch (e) {
    if (e instanceof Error && e.message === "DUPLICATE") {
      return NextResponse.json({ error: "この予約は既に登録されています" }, { status: 409 });
    }
    if (e instanceof Error && e.message === "FULL") {
      return NextResponse.json({ error: "この時間帯は満車です" }, { status: 409 });
    }
    if (e instanceof Error && e.message === "DRIVER_NOT_FOUND") {
      return NextResponse.json({ error: "未認証" }, { status: 401 });
    }
    // 競合だけでは満車と断定しない。同じ送信識別番号で再試行できる。
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2034"
    ) {
      return NextResponse.json({ error: "予約が混み合っています。もう一度お試しください" }, { status: 409 });
    }
    return NextResponse.json({ error: "予約に失敗しました" }, { status: 500 });
  }
}

const reservationInclude = {
  driver: { select: { id: true, name: true, companyName: true, phone: true } },
  center: { select: { id: true, code: true, name: true } },
} as const;

type ReservationWithDetails = Prisma.ReservationGetPayload<{ include: typeof reservationInclude }>;

function reservationResponse(reservation: ReservationWithDetails, status: number) {
  return NextResponse.json({
    ...reservation,
    requestId: undefined,
    requestHash: undefined,
    date: getJSTToday(reservation.reservationDate),
  }, { status });
}
