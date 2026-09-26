import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getJSTDayRange } from "@/lib/jstDate";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const centerId = Number(req.nextUrl.searchParams.get("centerId") ?? "0") || undefined;
  const date = req.nextUrl.searchParams.get("date"); // YYYY-MM-DD

  const { start: dayStart, end: dayEnd } = getJSTDayRange(date || undefined);

  try {
    const receptions = await prisma.reception.findMany({
      where: {
        ...(centerId ? { centerId } : {}),
        arrivedAt: { gte: dayStart, lte: dayEnd },
      },
      include: {
        center: { select: { name: true } },
        reservation: { select: { id: true, startTime: true, endTime: true, status: true } },
      },
      orderBy: { arrivedAt: "desc" },
    });

    return NextResponse.json(
      receptions.map((r) => ({
        id: r.id,
        centerDailyNo: r.centerDailyNo,
        receptionNo: r.receptionNo,
        arrivedAt: r.arrivedAt.toISOString(),
        centerName: r.center.name,
        companyName: r.companyName,
        driverName: r.driverName,
        phone: r.phone,
        vehicleNumber: r.vehicleNumber,
        plateRegion: r.plateRegion,
        plateClassNum: r.plateClassNum,
        plateHira: r.plateHira,
        plateNumber: r.plateNumber,
        maxLoad: r.maxLoad,
        reservation: r.reservation
          ? { id: r.reservation.id, startTime: r.reservation.startTime, endTime: r.reservation.endTime, status: r.reservation.status }
          : null,
      }))
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}
