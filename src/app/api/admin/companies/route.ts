import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams.get("search") || "";

    const companies = await prisma.company.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { phone: { contains: search } },
            ],
          }
        : undefined,
      orderBy: { id: "asc" },
    });

    return NextResponse.json(companies);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone } = body;

    if (!name) {
      return NextResponse.json({ error: "会社名は必須です" }, { status: 400 });
    }

    const company = await prisma.company.create({
      data: { name, phone: phone || "" },
    });

    return NextResponse.json(company, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "作成に失敗しました" }, { status: 500 });
  }
}
