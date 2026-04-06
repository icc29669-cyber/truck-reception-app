import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyKioskSecret } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const authError = verifyKioskSecret(req);
  if (authError) return authError;
  const plate = req.nextUrl.searchParams.get("plate") ?? "";

  if (!plate) {
    return NextResponse.json({ error: "車番が必要です" }, { status: 400 });
  }

  try {
    // 車番文字列で完全一致検索
    const vehicles = await prisma.vehicle.findMany({
      where: { vehicleNumber: plate },
      orderBy: { updatedAt: "desc" },
      take: 5,
    });

    // 対応するドライバーを電話番号経由で取得
    const phones = Array.from(new Set(vehicles.map((v) => v.phone)));
    const drivers = await prisma.driver.findMany({
      where: { phone: { in: phones } },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(
      drivers.map((d) => ({
        id: d.id,
        name: d.name,
        companyName: d.companyName,
        phone: d.phone,
      }))
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "検索に失敗しました" }, { status: 500 });
  }
}
