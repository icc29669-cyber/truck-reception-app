import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const centers = await prisma.center.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { id: "asc" },
    });
    return NextResponse.json(centers);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "センター情報の取得に失敗しました" }, { status: 500 });
  }
}
