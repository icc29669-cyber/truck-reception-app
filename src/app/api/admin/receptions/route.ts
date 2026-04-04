import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const centerId = Number(req.nextUrl.searchParams.get("centerId") ?? "0") || undefined;
  const date = req.nextUrl.searchParams.get("date"); // YYYY-MM-DD

  // Parse date as local midnight to avoid UTC offset issues
  let dayStart: Date;
  let dayEnd: Date;
  if (date) {
    const [y, m, d] = date.split("-").map(Number);
    dayStart = new Date(y, m - 1, d, 0, 0, 0, 0);
    dayEnd = new Date(y, m - 1, d + 1, 0, 0, 0, 0);
  } else {
    const now = new Date();
    dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  }

  try {
    const receptions = await prisma.reception.findMany({
      where: {
        ...(centerId ? { centerId } : {}),
        arrivedAt: { gte: dayStart, lt: dayEnd },
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
        arrivedAt: r.arrivedAt.toISOString(),
        centerName: r.center.name,
        companyName: r.companyName,
        driverName: r.driverName,
        phone: r.phone,
        vehicleNumber: r.vehicleNumber,
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
