import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams.get("search") || "";

    const page = Number(req.nextUrl.searchParams.get("page") || "1");
    if (!Number.isSafeInteger(page) || page < 1 || page > 1_000_000) {
      return NextResponse.json({ error: "ページ番号が不正です" }, { status: 400 });
    }
    const pageSize = 100;
    const where: Prisma.VehicleWhereInput = {
      isActive: true,
      ...(search
        ? {
            OR: [
              { vehicleNumber: { contains: search, mode: "insensitive" } },
              { phone: { contains: search } },
              { region: { contains: search, mode: "insensitive" } },
              { number: { contains: search } },
            ],
          }
        : {}),
    };
    const [vehicles, total] = await Promise.all([
      prisma.vehicle.findMany({
        where,
        take: pageSize,
        skip: (page - 1) * pageSize,
        include: {
          receptions: {
            orderBy: { arrivedAt: "desc" },
            take: 1,
            select: { arrivedAt: true },
          },
        },
        orderBy: { id: "asc" },
      }),
      prisma.vehicle.count({ where }),
    ]);

    const result = vehicles.map((v) => ({
      ...v,
      lastReceptionAt: v.receptions[0]?.arrivedAt ?? null,
      receptions: undefined,
    }));

    return NextResponse.json(result, {
      headers: {
        "X-Total-Count": String(total),
        "X-Page": String(page),
        "X-Page-Size": String(pageSize),
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { region, classNum, hira, number, vehicleNumber, maxLoad, phone } = body;

    if (!vehicleNumber || !vehicleNumber.trim()) {
      return NextResponse.json({ error: "車両番号は必須です" }, { status: 400 });
    }
    if (number && !/^\d{0,4}$/.test(number)) {
      return NextResponse.json({ error: "番号は4桁以内の数字にしてください" }, { status: 400 });
    }
    if (maxLoad && !/^\d+$/.test(maxLoad)) {
      return NextResponse.json({ error: "最大積載量は数値で入力してください" }, { status: 400 });
    }
    if (phone && !/^[\d\-]{0,15}$/.test(phone)) {
      return NextResponse.json({ error: "電話番号の形式が不正です" }, { status: 400 });
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
