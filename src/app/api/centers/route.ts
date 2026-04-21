import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const forDriver = url.searchParams.get("forDriver") === "1";
    const where: Record<string, unknown> = { isActive: true };
    if (forDriver) where.showInDriverApp = true;
    const centers = await prisma.center.findMany({
      where,
      select: { id: true, code: true, name: true },
      orderBy: { code: "asc" },
    });
    return NextResponse.json(centers);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "センター情報の取得に失敗しました" }, { status: 500 });
  }
}
