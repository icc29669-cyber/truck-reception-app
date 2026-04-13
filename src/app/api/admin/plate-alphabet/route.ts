import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const alphabets = await prisma.plateAlphabet.findMany({
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(alphabets);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { char, sortOrder, isActive } = body;

    if (!char) {
      return NextResponse.json({ error: "文字は必須です" }, { status: 400 });
    }

    const alphabet = await prisma.plateAlphabet.create({
      data: {
        char,
        sortOrder: sortOrder ?? 0,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json(alphabet, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "作成に失敗しました" }, { status: 500 });
  }
}
