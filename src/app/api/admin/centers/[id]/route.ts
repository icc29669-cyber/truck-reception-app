import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    const body = await req.json();
    const { name, secretKey, isActive } = body;

    const center = await prisma.center.update({
      where: { id },
      data: {
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
