import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyKioskSecret } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const authError = verifyKioskSecret(req);
  if (authError) return authError;

  const phone = req.nextUrl.searchParams.get("phone") ?? "";
  const centerId = Number(req.nextUrl.searchParams.get("centerId") ?? "0");

  if (!phone || !/^\d{10,11}$/.test(phone)) {
    return NextResponse.json({ error: "電話番号が必要です" }, { status: 400 });
  }

  try {
    // 同じ電話番号のドライバー候補・車両候補を並列取得
    const [drivers, vehicles] = await Promise.all([
      prisma.driver.findMany({
        where: { phone, isActive: true },
        orderBy: { updatedAt: "desc" },
        take: 10,
      }),
      prisma.vehicle.findMany({
        where: { phone, isActive: true },
        orderBy: { updatedAt: "desc" },
        take: 10,
      }),
    ]);

    return NextResponse.json({
      drivers: drivers.map((d) => ({
        id: d.id,
        name: d.name,
        companyName: d.companyName,
        phone: d.phone,
      })),
      vehicles: vehicles.map((v) => ({
        id: v.id,
        vehicleNumber: v.vehicleNumber,
        plate: {
          region: v.region,
          classNum: v.classNum,
          hira: v.hira,
          number: v.number,
        },
        maxLoad: v.maxLoad,
      })),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "検索に失敗しました" }, { status: 500 });
  }
}
