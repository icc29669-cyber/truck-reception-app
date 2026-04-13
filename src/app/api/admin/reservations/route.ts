import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const date = req.nextUrl.searchParams.get("date") || "";
    const centerId = req.nextUrl.searchParams.get("centerId");
    const status = req.nextUrl.searchParams.get("status");

    const where: Record<string, unknown> = {};

    if (date) {
      // 既存データ(UTC midnight)と新データ(JST midnight=UTC 15:00)の両方を拾う
      // UTC前日15:00(=JST当日00:00) 〜 UTC当日23:59(=JST翌日08:59)
      const jstStart = new Date(date + "T00:00:00+09:00");  // JST 00:00
      const utcEnd = new Date(date + "T23:59:59.999Z");     // UTC 23:59
      where.reservationDate = { gte: jstStart, lte: utcEnd };
    }

    if (centerId) {
      where.centerId = Number(centerId);
    }

    if (status) {
      where.status = status;
    }

    const reservations = await prisma.reservation.findMany({
      where,
      include: { center: { select: { id: true, name: true } } },
      orderBy: { reservationDate: "asc" },
    });

    return NextResponse.json(reservations);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}

function isValidTime(t: string): boolean {
  if (!/^\d{2}:\d{2}$/.test(t)) return false;
  const [h, m] = t.split(":").map(Number);
  return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      centerId, phone, driverName, companyName,
      plateRegion, plateClassNum, plateHira, plateNumber,
      vehicleNumber, maxLoad,
      reservationDate, startTime, endTime, notes,
    } = body;

    if (!centerId || !reservationDate || !startTime || !endTime) {
      return NextResponse.json({ error: "必須項目が不足しています" }, { status: 400 });
    }

    // 入力バリデーション
    if (!isValidTime(startTime)) {
      return NextResponse.json({ error: "開始時刻が不正です (HH:mm, 00:00〜23:59)" }, { status: 400 });
    }
    if (!isValidTime(endTime)) {
      return NextResponse.json({ error: "終了時刻が不正です (HH:mm, 00:00〜23:59)" }, { status: 400 });
    }
    if (startTime >= endTime) {
      return NextResponse.json({ error: "終了時刻は開始時刻より後にしてください" }, { status: 400 });
    }
    const dateRe = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRe.test(reservationDate)) {
      return NextResponse.json({ error: "日付の形式が不正です (YYYY-MM-DD)" }, { status: 400 });
    }
    if (phone && !/^\d{0,15}$/.test(phone)) {
      return NextResponse.json({ error: "電話番号の形式が不正です" }, { status: 400 });
    }

    const reservation = await prisma.reservation.create({
      data: {
        centerId: Number(centerId),
        phone: phone || "",
        driverName: driverName || "",
        companyName: companyName || "",
        plateRegion: plateRegion || "",
        plateClassNum: plateClassNum || "",
        plateHira: plateHira || "",
        plateNumber: plateNumber || "",
        vehicleNumber: vehicleNumber || "",
        maxLoad: maxLoad || "",
        reservationDate: new Date(reservationDate + "T00:00:00+09:00"),
        startTime,
        endTime,
        notes: notes || "",
      },
    });

    return NextResponse.json(reservation, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "作成に失敗しました" }, { status: 500 });
  }
}
