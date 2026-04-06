import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    if (isNaN(id) || id <= 0) {
      return NextResponse.json({ error: "無効なIDです" }, { status: 400 });
    }
    const body = await req.json();
    const { name, phone, isActive } = body;

    if (name !== undefined && (!name.trim() || name.length > 100)) {
      return NextResponse.json({ error: "会社名は1〜100文字で入力してください" }, { status: 400 });
    }
    if (phone !== undefined && phone && !/^[\d\-]{0,15}$/.test(phone)) {
      return NextResponse.json({ error: "電話番号の形式が不正です" }, { status: 400 });
    }

    const company = await prisma.company.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json(company);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);

    const company = await prisma.company.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json(company);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
  }
}
