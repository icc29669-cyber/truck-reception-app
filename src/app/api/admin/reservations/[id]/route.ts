import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    // 入力バリデーション
    const timeRe = /^\d{2}:\d{2}$/;
    if (startTime !== undefined && !timeRe.test(startTime)) {
      return NextResponse.json({ error: "開始時刻の形式が不正です (HH:mm)" }, { status: 400 });
    }
    if (endTime !== undefined && !timeRe.test(endTime)) {
      return NextResponse.json({ error: "終了時刻の形式が不正です (HH:mm)" }, { status: 400 });
    }
    if (startTime && endTime && startTime >= endTime) {
      return NextResponse.json({ error: "終了時刻は開始時刻より後にしてください" }, { status: 400 });
    }
    if (reservationDate !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(reservationDate)) {
      return NextResponse.json({ error: "日付の形式が不正です (YYYY-MM-DD)" }, { status: 400 });
    }
    const validStatuses = ["pending", "checked_in", "completed", "cancelled", "no_show"];
    if (status !== undefined && !validStatuses.includes(status)) {
      return NextResponse.json({ error: "無効なステータスです" }, { status: 400 });
    }

    // ステータス遷移バリデーション
    if (status !== undefined) {
      const current = await prisma.reservation.findUnique({ where: { id }, select: { status: true } });
      if (!current) {
        return NextResponse.json({ error: "予約が見つかりません" }, { status: 404 });
      }
      const allowedTransitions: Record<string, string[]> = {
        pending: ["checked_in", "completed", "cancelled", "no_show"],
        checked_in: ["completed", "cancelled"],
        completed: [],
        cancelled: [],
        no_show: [],
      };
      const allowed = allowedTransitions[current.status] ?? [];
      if (!allowed.includes(status)) {
        return NextResponse.json(
          { error: `このステータス変更はできません (${current.status} → ${status})` },
          { status: 400 }
        );
      }
    }

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
          reservationDate: new Date(reservationDate + "T00:00:00+09:00"),
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
