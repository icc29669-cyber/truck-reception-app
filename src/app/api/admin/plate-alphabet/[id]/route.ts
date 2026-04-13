import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    if (isNaN(id) || id <= 0) return NextResponse.json({ error: "無効なIDです" }, { status: 400 });
    const body = await req.json();
    const { char, sortOrder, isActive } = body;

    const alphabet = await prisma.plateAlphabet.update({
      where: { id },
      data: {
        ...(char !== undefined && { char }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json(alphabet);
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

    const alphabet = await prisma.plateAlphabet.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json(alphabet);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
  }
}
