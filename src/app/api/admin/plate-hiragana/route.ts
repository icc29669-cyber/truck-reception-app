import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const category = req.nextUrl.searchParams.get("category") || "";

    const hiragana = await prisma.plateHiragana.findMany({
      where: category ? { category } : undefined,
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(hiragana);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { char, category, sortOrder, isActive } = body;

    if (!char) {
      return NextResponse.json({ error: "文字は必須です" }, { status: 400 });
    }

    const hiragana = await prisma.plateHiragana.create({
      data: {
        char,
        category: category || "business",
        sortOrder: sortOrder ?? 0,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json(hiragana, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "作成に失敗しました" }, { status: 500 });
  }
}
