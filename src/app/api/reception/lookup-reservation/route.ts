import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const phone = req.nextUrl.searchParams.get("phone");
    const centerId = req.nextUrl.searchParams.get("centerId");

    if (!phone) {
      return NextResponse.json({ error: "電話番号は必須です" }, { status: 400 });
    }

    // 今日の日付範囲（ローカルタイムの midnight で区切る）
    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);

    const where: Record<string, unknown> = {
      phone,
      reservationDate: { gte: dayStart, lt: dayEnd },
      status: "pending",
    };
    if (centerId) {
      where.centerId = Number(centerId);
    }

    const reservations = await prisma.reservation.findMany({
      where,
      orderBy: { startTime: "asc" },
    });

    // ReservationCandidate 型に変換して返す
    return NextResponse.json(
      reservations.map((r) => ({
        id: r.id,
        startTime: r.startTime,
        endTime: r.endTime,
        driverName: r.driverName,
        companyName: r.companyName,
        vehicleNumber: r.vehicleNumber,
        maxLoad: r.maxLoad,
        plateRegion: r.plateRegion,
        plateClassNum: r.plateClassNum,
        plateHira: r.plateHira,
        plateNumber: r.plateNumber,
        status: r.status,
      }))
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "予約検索に失敗しました" }, { status: 500 });
  }
}
