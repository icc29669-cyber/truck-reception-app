import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getJSTDayRange, isValidJSTDate } from "@/lib/jstDate";

import { validateReservationSchedule } from "@/lib/reservationValidation";
import { normalizeReservationStatus, PENDING_RESERVATION_STATUSES } from "@/lib/reservationStatus";
import { vehicleSnapshotUpdate } from "@/lib/vehiclePlate";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const date = req.nextUrl.searchParams.get("date") || "";
    const centerId = req.nextUrl.searchParams.get("centerId");
    const status = req.nextUrl.searchParams.get("status");

    const where: Record<string, unknown> = {};

    if (date) {
      if (!isValidJSTDate(date)) {
        return NextResponse.json({ error: "日付の形式が不正です (YYYY-MM-DD)" }, { status: 400 });
      }
      // JST の当日24時間なら旧 UTC 00:00 も含み、翌日 JST 00:00 は混ざらない。
      const { start, end } = getJSTDayRange(date);
      where.reservationDate = { gte: start, lte: end };
    }

    if (centerId) {
      where.centerId = Number(centerId);
    }

    if (status) {
      where.status = normalizeReservationStatus(status) === "pending" ? { in: PENDING_RESERVATION_STATUSES } : status;
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

    const scheduleError = validateReservationSchedule(reservationDate, startTime, endTime);
    if (scheduleError) return NextResponse.json({ error: scheduleError }, { status: 400 });
    if (phone && !/^\d{0,15}$/.test(phone)) {
      return NextResponse.json({ error: "電話番号の形式が不正です" }, { status: 400 });
    }

    const reservation = await prisma.reservation.create({
      data: {
        centerId: Number(centerId),
        phone: phone || "",
        driverName: driverName || "",
        companyName: companyName || "",
        ...vehicleSnapshotUpdate({ plateRegion: "", plateClassNum: "", plateHira: "", plateNumber: "", vehicleNumber: "" }, { plateRegion, plateClassNum, plateHira, plateNumber, vehicleNumber }),
        status: "pending",
        maxLoad: maxLoad || "",
        reservationDate: getJSTDayRange(reservationDate).start,
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
