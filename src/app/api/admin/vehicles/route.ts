import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams.get("search") || "";

    const vehicles = await prisma.vehicle.findMany({
      where: search
        ? {
            OR: [
              { vehicleNumber: { contains: search, mode: "insensitive" } },
              { phone: { contains: search } },
              { region: { contains: search, mode: "insensitive" } },
              { number: { contains: search } },
            ],
          }
        : undefined,
      orderBy: { id: "asc" },
    });

    return NextResponse.json(vehicles);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { region, classNum, hira, number, vehicleNumber, maxLoad, phone } = body;

    if (!vehicleNumber) {
      return NextResponse.json({ error: "車両番号は必須です" }, { status: 400 });
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        region: region || "",
        classNum: classNum || "",
        hira: hira || "",
        number: number || "",
        vehicleNumber,
        maxLoad: maxLoad || "",
        phone: phone || "",
      },
    });

    return NextResponse.json(vehicle, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "作成に失敗しました" }, { status: 500 });
  }
}
