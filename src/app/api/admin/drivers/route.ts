import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams.get("search") || "";
    const companyId = req.nextUrl.searchParams.get("companyId");

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { companyName: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
      ];
    }

    if (companyId) {
      where.companyId = Number(companyId);
    }

    const drivers = await prisma.driver.findMany({
      where,
      include: { company: { select: { id: true, name: true } } },
      orderBy: { id: "asc" },
    });

    return NextResponse.json(drivers);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, companyName, phone, companyId } = body;

    if (!name) {
      return NextResponse.json({ error: "名前は必須です" }, { status: 400 });
    }

    const driver = await prisma.driver.create({
      data: {
        name,
        companyName: companyName || "",
        phone: phone || "",
        ...(companyId ? { companyId: Number(companyId) } : {}),
      },
    });

    return NextResponse.json(driver, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "作成に失敗しました" }, { status: 500 });
  }
}
