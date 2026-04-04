import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const regions = await prisma.plateRegion.findMany({
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(regions);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, kana, sortOrder, isActive } = body;

    if (!name) {
      return NextResponse.json({ error: "地名は必須です" }, { status: 400 });
    }

    const region = await prisma.plateRegion.create({
      data: {
        name,
        kana: kana || "",
        sortOrder: sortOrder ?? 0,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json(region, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "作成に失敗しました" }, { status: 500 });
  }
}
