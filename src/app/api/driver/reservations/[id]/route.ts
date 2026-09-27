import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/driverAuth";
import { canChangeReservationStatus, normalizeReservationStatus } from "@/lib/reservationStatus";
import { getJSTDayRange, getJSTToday } from "@/lib/jstDate";
import { validateReservationSchedule } from "@/lib/reservationValidation";
import { vehicleSnapshotUpdate } from "@/lib/vehiclePlate";
import { Prisma } from "@prisma/client";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "未認証" }, { status: 401 });
  }

  const { id } = await params;
  const reservationId = parseInt(id);

  try {
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
    });

    if (!reservation) {
      return NextResponse.json({ error: "予約が見つかりません" }, { status: 404 });
    }

    if (reservation.driverId !== session.id && !session.isAdmin) {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    const body = await request.json();

    // ステータス値のバリデーション(lib/reservationStatus.ts に一本化)
    if (body.status !== undefined && !normalizeReservationStatus(body.status)) {
      return NextResponse.json({ error: "不正なステータスです" }, { status: 400 });
    }

    // ドライバーは自分の予約のキャンセルのみ可能
    if (body.status !== undefined && !canChangeReservationStatus(reservation.status, body.status, session.isAdmin ? "admin" : "driver")) {
      return NextResponse.json({ error: "この予約の状態は変更できません。一覧を更新してください" }, { status: 409 });
    }

    // mass assignment 防止：更新可能フィールドのみ許可
    const allowed = session.isAdmin
      ? ["status", "date", "startTime", "endTime", "vehicleNumber", "maxLoad", "companyName", "driverName", "centerId"]
      : ["status"]; // ドライバーはステータス変更（キャンセル）のみ
    const safeData: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) safeData[key] = body[key];
    }

    if ([safeData.date, safeData.startTime, safeData.endTime].some(v => v !== undefined)) {
      const error = validateReservationSchedule(
        safeData.date === undefined ? getJSTToday(reservation.reservationDate) : safeData.date,
        safeData.startTime === undefined ? reservation.startTime : safeData.startTime,
        safeData.endTime === undefined ? reservation.endTime : safeData.endTime,
      );
      if (error) return NextResponse.json({ error }, { status: 400 });
    }
    if (safeData.date !== undefined) safeData.reservationDate = getJSTDayRange(safeData.date as string).start;
    delete safeData.date;
    if (safeData.status !== undefined) safeData.status = normalizeReservationStatus(safeData.status);
    if (safeData.vehicleNumber !== undefined) {
      if (typeof safeData.vehicleNumber !== "string") return NextResponse.json({ error: "車番の形式が不正です" }, { status: 400 });
      Object.assign(safeData, vehicleSnapshotUpdate(reservation, { vehicleNumber: safeData.vehicleNumber }));
    }

    const updated = await prisma.reservation.update({
      where: { id: reservationId, updatedAt: reservation.updatedAt, status: reservation.status },
      data: safeData,
      include: { driver: { select: { id: true, name: true, companyName: true, phone: true } } },
    });

    return NextResponse.json(updated);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "予約が更新されています。一覧を更新して確認してください" }, { status: 409 });
    }
    console.error("reservations-patch error:", e);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
