import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    const body = await req.json();
    const { name, phone, isActive } = body;

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
