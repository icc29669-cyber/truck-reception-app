import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    if (isNaN(id) || id <= 0) {
      return NextResponse.json({ error: "無効なIDです" }, { status: 400 });
    }

    const reception = await prisma.reception.findUnique({
      where: { id },
      include: {
        center: { select: { name: true } },
        reservation: { select: { id: true, startTime: true, endTime: true, status: true } },
      },
    });

    if (!reception) {
      return NextResponse.json({ error: "受付が見つかりません" }, { status: 404 });
    }

    return NextResponse.json(reception);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}

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
    const {
      companyName, driverName, phone,
      plateRegion, plateClassNum, plateHira, plateNumber,
      vehicleNumber, maxLoad,
    } = body;

    // バリデーション
    if (driverName !== undefined && driverName.length > 50) {
      return NextResponse.json({ error: "ドライバー名は50文字以内にしてください" }, { status: 400 });
    }
    if (companyName !== undefined && companyName.length > 100) {
      return NextResponse.json({ error: "会社名は100文字以内にしてください" }, { status: 400 });
    }
    if (phone !== undefined && phone && !/^[\d]{0,15}$/.test(phone)) {
      return NextResponse.json({ error: "電話番号の形式が不正です" }, { status: 400 });
    }
    if (plateNumber !== undefined && plateNumber && !/^\d{0,4}$/.test(plateNumber)) {
      return NextResponse.json({ error: "番号は4桁以内の数字にしてください" }, { status: 400 });
    }

    const reception = await prisma.reception.update({
      where: { id },
      data: {
        ...(companyName !== undefined && { companyName }),
        ...(driverName !== undefined && { driverName }),
        ...(phone !== undefined && { phone }),
        ...(plateRegion !== undefined && { plateRegion }),
        ...(plateClassNum !== undefined && { plateClassNum }),
        ...(plateHira !== undefined && { plateHira }),
        ...(plateNumber !== undefined && { plateNumber }),
        ...(vehicleNumber !== undefined && { vehicleNumber }),
        ...(maxLoad !== undefined && { maxLoad }),
      },
    });

    return NextResponse.json(reception);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 });
  }
}
