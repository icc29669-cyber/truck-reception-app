import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const centers = await prisma.center.findMany({
      orderBy: { code: "asc" },
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
    const { code, name, secretKey } = body;

    if (!code || !name) {
      return NextResponse.json({ error: "センターコードとセンター名は必須です" }, { status: 400 });
    }
    if (!/^\d{4}$/.test(code)) {
      return NextResponse.json({ error: "センターコードは4桁の数字で入力してください" }, { status: 400 });
    }

    // コード重複チェック
    const existing = await prisma.center.findFirst({ where: { code } });
    if (existing) {
      return NextResponse.json({ error: "このセンターコードは既に使用されています" }, { status: 400 });
    }

    const center = await prisma.center.create({
      data: {
        code,
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
