import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    if (isNaN(id) || id <= 0) return NextResponse.json({ error: "無効なIDです" }, { status: 400 });
    const body = await req.json();
    const { char, category, sortOrder, isActive } = body;

    const hiragana = await prisma.plateHiragana.update({
      where: { id },
      data: {
        ...(char !== undefined && { char }),
        ...(category !== undefined && { category }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json(hiragana);
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
    if (isNaN(id) || id <= 0) return NextResponse.json({ error: "無効なIDです" }, { status: 400 });

    const hiragana = await prisma.plateHiragana.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json(hiragana);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
  }
}
