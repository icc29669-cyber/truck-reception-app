import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/driverAuth";
import { checkAdminAuth } from "@/lib/adminAuth";
import { Prisma } from "@prisma/client";
import { getTodayJST } from "@/lib/fiscalYear";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getSession();
  const isAdmin = await checkAdminAuth();

  if (!session && !isAdmin) {
    return NextResponse.json({ error: "未認証" }, { status: 401 });
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
    date: r.reservationDate.toISOString().slice(0, 10),
  }));

  return NextResponse.json(response);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "未認証" }, { status: 401 });
  }

  const { date, startTime, endTime, vehicleNumber, maxLoad, companyName, driverName, centerId } = await request.json();

  // 入力バリデーション
  if (!date || !startTime || !endTime || !vehicleNumber) {
    return NextResponse.json({ error: "必須項目が不足しています" }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(new Date(date).getTime())) {
    return NextResponse.json({ error: "日付の形式が不正です (YYYY-MM-DD)" }, { status: 400 });
  }
  const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
  if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
    return NextResponse.json({ error: "時刻の形式が不正です (HH:MM, 00:00〜23:59)" }, { status: 400 });
  }
  if (startTime >= endTime) {
    return NextResponse.json({ error: "開始時刻は終了時刻より前である必要があります" }, { status: 400 });
  }
  // 過去日付チェック（JSTベース）
  const jstToday = getTodayJST();
  if (date < jstToday) {
    return NextResponse.json({ error: "過去の日付には予約できません" }, { status: 400 });
  }
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

  // センター別の最大受付数を取得
  // 本スキーマでは Center に maxReservationsPerSlot が無いため AppSetting を使う。
  // centerId 指定時は存在確認のみ行う。
  let maxCapacity = 3;
  if (centerId) {
    const center = await prisma.center.findUnique({ where: { id: centerId } });
    if (!center) {
      return NextResponse.json({ error: "指定されたセンターが存在しません" }, { status: 400 });
    }
  }
  const setting = await prisma.appSetting.findFirst();
  if (setting) maxCapacity = setting.maxReservationsPerSlot;

  // 入力の date (YYYY-MM-DD) を DateTime に変換して Prisma に渡す
  const reservationDate = new Date(date + "T00:00:00Z");

  const where: Prisma.ReservationWhereInput = {
    reservationDate,
    status: { not: "cancelled" },
    OR: [{ startTime: { lt: endTime }, endTime: { gt: startTime } }],
    ...(centerId ? { centerId } : {}),
  };

  try {
    // Serializableトランザクションで同時予約の競合を完全防止
    const reservation = await prisma.$transaction(async (tx) => {
      // 重複予約チェック（同一ドライバー・同日・同時間帯）
      const duplicate = await tx.reservation.findFirst({
        where: {
          driverId: session.id,
          reservationDate,
          startTime,
          endTime,
          status: { not: "cancelled" },
          ...(centerId ? { centerId } : {}),
        },
      });
      if (duplicate) {
        throw new Error("DUPLICATE");
      }

      const count = await tx.reservation.count({ where });
      if (count >= maxCapacity) {
        throw new Error("FULL");
      }
      if (!centerId) {
        throw new Error("CENTER_REQUIRED");
      }
      return tx.reservation.create({
        data: {
          driverId: session.id,
          reservationDate,
          startTime,
          endTime,
          vehicleNumber,
          maxLoad: maxLoad || "",
          companyName: companyName || "",
          driverName: driverName || "",
          centerId,
        },
        include: { driver: true, center: true },
      });
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 5000,
      timeout: 10000,
    });

    // フロントエンド互換のため date (YYYY-MM-DD) を派生して付与
    const responseBody = {
      ...reservation,
      date: reservation.reservationDate.toISOString().slice(0, 10),
    };
    return NextResponse.json(responseBody, { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.message === "DUPLICATE") {
      return NextResponse.json({ error: "この予約は既に登録されています" }, { status: 409 });
    }
    if (e instanceof Error && e.message === "FULL") {
      return NextResponse.json({ error: "この時間帯は満車です" }, { status: 409 });
    }
    if (e instanceof Error && e.message === "CENTER_REQUIRED") {
      return NextResponse.json({ error: "センターの指定が必要です" }, { status: 400 });
    }
    // Serializable競合（同時予約）の場合は満車と同じ扱い
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2034"
    ) {
      return NextResponse.json({ error: "この時間帯は満車です" }, { status: 409 });
    }
    return NextResponse.json({ error: "予約に失敗しました" }, { status: 500 });
  }
}
