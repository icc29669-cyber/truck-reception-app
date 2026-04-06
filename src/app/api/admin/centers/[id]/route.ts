import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "無効なIDです" }, { status: 400 });
    }
    const body = await req.json();
    const { code, name, secretKey, isActive } = body;

    // コード形式チェック
    if (code !== undefined && !/^\d{4}$/.test(code)) {
      return NextResponse.json({ error: "センターコードは4桁の数字で入力してください" }, { status: 400 });
    }

    // コード重複チェック
    if (code !== undefined) {
      const existing = await prisma.center.findFirst({ where: { code, NOT: { id } } });
      if (existing) {
        return NextResponse.json({ error: "このセンターコードは既に使用されています" }, { status: 400 });
      }
    }

    const center = await prisma.center.update({
      where: { id },
      data: {
        ...(code !== undefined && { code }),
        ...(name !== undefined && { name }),
        ...(secretKey !== undefined && { secretKey }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json(center);
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

    const center = await prisma.center.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json(center);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
  }
}
