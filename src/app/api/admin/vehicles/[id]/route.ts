import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    const body = await req.json();
    const { region, classNum, hira, number, vehicleNumber, maxLoad, phone, isActive } = body;

    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: {
        ...(region !== undefined && { region }),
        ...(classNum !== undefined && { classNum }),
        ...(hira !== undefined && { hira }),
        ...(number !== undefined && { number }),
        ...(vehicleNumber !== undefined && { vehicleNumber }),
        ...(maxLoad !== undefined && { maxLoad }),
        ...(phone !== undefined && { phone }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json(vehicle);
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

    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json(vehicle);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
  }
}
