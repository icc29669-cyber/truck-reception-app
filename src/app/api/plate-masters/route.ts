import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [regions, hiragana, alphabet] = await Promise.all([
      prisma.plateRegion.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.plateHiragana.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.plateAlphabet.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      }),
    ]);

    return NextResponse.json({ regions, hiragana, alphabet });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "ナンバープレートマスタの取得に失敗しました" },
      { status: 500 }
    );
  }
}
