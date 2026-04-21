import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/driverAuth";
import { isReservationStatus } from "@/lib/reservationStatus";

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
    if (body.status && !isReservationStatus(body.status)) {
      return NextResponse.json({ error: "不正なステータスです" }, { status: 400 });
    }

    // ドライバーは自分の予約のキャンセルのみ可能
    if (!session.isAdmin && body.status && body.status !== "cancelled") {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    // mass assignment 防止：更新可能フィールドのみ許可
    const allowed = session.isAdmin
      ? ["status", "date", "startTime", "endTime", "vehicleNumber", "maxLoad", "companyName", "driverName", "centerId"]
      : ["status"]; // ドライバーはステータス変更（キャンセル）のみ
    const safeData: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) safeData[key] = body[key];
    }

    // 日付・時間フィールドのバリデーション
    if (safeData.date && typeof safeData.date === "string") {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(safeData.date) || isNaN(new Date(safeData.date as string).getTime())) {
        return NextResponse.json({ error: "日付の形式が不正です (YYYY-MM-DD)" }, { status: 400 });
      }
    }
    const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (safeData.startTime && typeof safeData.startTime === "string" && !timeRegex.test(safeData.startTime)) {
      return NextResponse.json({ error: "開始時間の形式が不正です (HH:MM)" }, { status: 400 });
    }
    if (safeData.endTime && typeof safeData.endTime === "string" && !timeRegex.test(safeData.endTime)) {
      return NextResponse.json({ error: "終了時間の形式が不正です (HH:MM)" }, { status: 400 });
    }
    if (safeData.startTime && safeData.endTime && (safeData.startTime as string) >= (safeData.endTime as string)) {
      return NextResponse.json({ error: "開始時間は終了時間より前にしてください" }, { status: 400 });
    }

    const updated = await prisma.reservation.update({
      where: { id: reservationId },
      data: safeData,
      include: { driver: { select: { id: true, name: true, companyName: true, phone: true } } },
    });

    return NextResponse.json(updated);
  } catch (e) {
    console.error("reservations-patch error:", e);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
