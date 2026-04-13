import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams.get("search") || "";
    const companyId = req.nextUrl.searchParams.get("companyId");

    const where: Record<string, unknown> = { isActive: true };

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
      include: {
        company: { select: { id: true, name: true } },
        receptions: {
          orderBy: { arrivedAt: "desc" },
          take: 1,
          select: { arrivedAt: true },
        },
      },
      orderBy: { id: "asc" },
    });

    const result = drivers.map((d) => ({
      ...d,
      lastReceptionAt: d.receptions[0]?.arrivedAt ?? null,
      receptions: undefined,
    }));

    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, companyName, phone, companyId } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "名前は必須です" }, { status: 400 });
    }
    if (name.length > 50) {
      return NextResponse.json({ error: "名前は50文字以内にしてください" }, { status: 400 });
    }
    if (companyName && companyName.length > 100) {
      return NextResponse.json({ error: "会社名は100文字以内にしてください" }, { status: 400 });
    }
    if (phone && !/^[\d\-]{0,15}$/.test(phone)) {
      return NextResponse.json({ error: "電話番号の形式が不正です" }, { status: 400 });
    }

    const driver = await prisma.driver.create({
      data: {
        name: name.trim(),
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
