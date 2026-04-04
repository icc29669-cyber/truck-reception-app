import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const date = req.nextUrl.searchParams.get("date") || "";
    const centerId = req.nextUrl.searchParams.get("centerId");
    const status = req.nextUrl.searchParams.get("status");

    const where: Record<string, unknown> = {};

    if (date) {
      // date is "YYYY-MM-DD" — parse as local midnight to avoid UTC offset issues
      const [y, m, day] = date.split("-").map(Number);
      const d = new Date(y, m - 1, day, 0, 0, 0, 0);
      const next = new Date(y, m - 1, day + 1, 0, 0, 0, 0);
      where.reservationDate = { gte: d, lt: next };
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
        reservationDate: (() => {
          const [y, m, d] = reservationDate.split("-").map(Number);
          return new Date(y, m - 1, d, 0, 0, 0, 0);
        })(),
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
