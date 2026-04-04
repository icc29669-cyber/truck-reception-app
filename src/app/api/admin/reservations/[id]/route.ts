import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    const body = await req.json();
    const {
      centerId, phone, driverName, companyName,
      plateRegion, plateClassNum, plateHira, plateNumber,
      vehicleNumber, maxLoad,
      reservationDate, startTime, endTime, status, notes,
    } = body;

    const reservation = await prisma.reservation.update({
      where: { id },
      data: {
        ...(centerId !== undefined && { centerId: Number(centerId) }),
        ...(phone !== undefined && { phone }),
        ...(driverName !== undefined && { driverName }),
        ...(companyName !== undefined && { companyName }),
        ...(plateRegion !== undefined && { plateRegion }),
        ...(plateClassNum !== undefined && { plateClassNum }),
        ...(plateHira !== undefined && { plateHira }),
        ...(plateNumber !== undefined && { plateNumber }),
        ...(vehicleNumber !== undefined && { vehicleNumber }),
        ...(maxLoad !== undefined && { maxLoad }),
        ...(reservationDate !== undefined && {
          reservationDate: (() => {
            const [y, m, d] = reservationDate.split("-").map(Number);
            return new Date(y, m - 1, d, 0, 0, 0, 0);
          })(),
        }),
        ...(startTime !== undefined && { startTime }),
        ...(endTime !== undefined && { endTime }),
        ...(status !== undefined && { status }),
        ...(notes !== undefined && { notes }),
      },
    });

    return NextResponse.json(reservation);
  } catch (e) {
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

    // Check if any receptions reference this reservation
    const receptionCount = await prisma.reception.count({
      where: { reservationId: id },
    });
    if (receptionCount > 0) {
      // If receptions exist, soft-delete by cancelling instead
      const reservation = await prisma.reservation.update({
        where: { id },
        data: { status: "cancelled" },
      });
      return NextResponse.json(reservation);
    }

    await prisma.reservation.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
  }
}
