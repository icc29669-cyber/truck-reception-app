import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getJSTDayRange, getJSTToday } from "@/lib/jstDate";
import { Prisma } from "@prisma/client";
import { validateReservationSchedule } from "@/lib/reservationValidation";
import { canChangeReservationStatus, normalizeReservationStatus } from "@/lib/reservationStatus";
import { vehicleSnapshotUpdate } from "@/lib/vehiclePlate";

export const dynamic = "force-dynamic";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    if (isNaN(id) || id <= 0) {
      return NextResponse.json({ error: "無効なIDです" }, { status: 400 });
    }
    const body = await req.json();
    const {
      centerId, phone, driverName, companyName,
      plateRegion, plateClassNum, plateHira, plateNumber,
      vehicleNumber, maxLoad,
      reservationDate, startTime, endTime, status, notes,
    } = body;

    const current = await prisma.reservation.findUnique({ where: { id } });
    if (!current) return NextResponse.json({ error: "予約が見つかりません" }, { status: 404 });
    if ([reservationDate, startTime, endTime].some(v => v !== undefined)) {
      const error = validateReservationSchedule(
        reservationDate === undefined ? getJSTToday(current.reservationDate) : reservationDate,
        startTime === undefined ? current.startTime : startTime,
        endTime === undefined ? current.endTime : endTime,
      );
      if (error) return NextResponse.json({ error }, { status: 400 });
    }
    if (status !== undefined && !normalizeReservationStatus(status)) {
      return NextResponse.json({ error: "無効なステータスです" }, { status: 400 });
    }
    if (status !== undefined && !canChangeReservationStatus(current.status, status, "admin")) {
      return NextResponse.json({ error: "このステータス変更はできません" }, { status: 409 });
    }

    const reservation = await prisma.reservation.update({
      where: { id, updatedAt: current.updatedAt, status: current.status },
      data: {
        ...(centerId !== undefined && { centerId: Number(centerId) }),
        ...(phone !== undefined && { phone }),
        ...(driverName !== undefined && { driverName }),
        ...(companyName !== undefined && { companyName }),
        ...vehicleSnapshotUpdate(current, { plateRegion, plateClassNum, plateHira, plateNumber, vehicleNumber }),
        ...(maxLoad !== undefined && { maxLoad }),
        ...(reservationDate !== undefined && {
          reservationDate: getJSTDayRange(reservationDate).start,
        }),
        ...(startTime !== undefined && { startTime }),
        ...(endTime !== undefined && { endTime }),
        ...(status !== undefined && { status: normalizeReservationStatus(status)! }),
        ...(notes !== undefined && { notes }),
      },
    });

    return NextResponse.json(reservation);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "予約が更新されています。一覧を更新して確認してください" }, { status: 409 });
    }
    console.error(e);
    return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    const current = await prisma.reservation.findUnique({ where: { id } });
    if (!current) return NextResponse.json({ error: "予約が見つかりません" }, { status: 404 });

    // Check if any receptions reference this reservation
    const receptionCount = await prisma.reception.count({
      where: { reservationId: id },
    });
    if (receptionCount > 0) {
      if (!canChangeReservationStatus(current.status, "cancelled", "admin")) {
        return NextResponse.json({ error: "この予約は取り消せません" }, { status: 409 });
      }
      const reservation = await prisma.reservation.update({
        where: { id, updatedAt: current.updatedAt, status: current.status },
        data: { status: "cancelled" },
      });
      return NextResponse.json(reservation);
    }

    await prisma.reservation.delete({ where: { id, updatedAt: current.updatedAt, status: current.status } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && ["P2025", "P2003"].includes(e.code)) {
      return NextResponse.json({ error: "予約が更新されています。一覧を更新して確認してください" }, { status: 409 });
    }
    console.error(e);
    return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
  }
}
