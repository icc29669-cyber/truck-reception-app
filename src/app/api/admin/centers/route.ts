import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const centers = await prisma.center.findMany({
      orderBy: { id: "asc" },
    });

    return NextResponse.json(centers);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, secretKey } = body;

    if (!name) {
      return NextResponse.json({ error: "センター名は必須です" }, { status: 400 });
    }

    const center = await prisma.center.create({
      data: {
        name,
        secretKey: secretKey || "",
      },
    });

    return NextResponse.json(center, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "作成に失敗しました" }, { status: 500 });
  }
}
