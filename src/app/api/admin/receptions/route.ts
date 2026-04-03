import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const centerId = Number(req.nextUrl.searchParams.get("centerId") ?? "0") || undefined;
  const date = req.nextUrl.searchParams.get("date"); // YYYY-MM-DD

  const targetDate = date ? new Date(date) : new Date();
  const dayStart = new Date(targetDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(targetDate);
  dayEnd.setHours(23, 59, 59, 999);

  try {
    const receptions = await prisma.reception.findMany({
      where: {
        ...(centerId ? { centerId } : {}),
        arrivedAt: { gte: dayStart, lte: dayEnd },
      },
      include: { center: { select: { name: true } } },
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
      }))
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}
