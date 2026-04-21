import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/driverAuth";

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "未認証" }, { status: 401 });
  }

  const { name, companyName, defaultVehicle, defaultMaxLoad } = await request.json();

  // バリデーション
  if (name !== undefined && (typeof name !== "string" || name.length > 100)) {
    return NextResponse.json({ error: "名前は100文字以内にしてください" }, { status: 400 });
  }
  if (companyName !== undefined && (typeof companyName !== "string" || companyName.length > 100)) {
    return NextResponse.json({ error: "会社名は100文字以内にしてください" }, { status: 400 });
  }
  if (defaultVehicle !== undefined && (typeof defaultVehicle !== "string" || defaultVehicle.length > 50)) {
    return NextResponse.json({ error: "車両番号は50文字以内にしてください" }, { status: 400 });
  }
  if (defaultMaxLoad !== undefined && (typeof defaultMaxLoad !== "string" || (defaultMaxLoad && isNaN(Number(defaultMaxLoad))))) {
    return NextResponse.json({ error: "最大積載量は数値で入力してください" }, { status: 400 });
  }

  try {
    const driver = await prisma.driver.update({
      where: { id: session.id },
      data: {
        ...(name !== undefined && { name }),
        ...(companyName !== undefined && { companyName }),
        ...(defaultVehicle !== undefined && { defaultVehicle }),
        ...(defaultMaxLoad !== undefined && { defaultMaxLoad }),
      },
    });

    return NextResponse.json({
      id: driver.id,
      name: driver.name,
      companyName: driver.companyName,
      defaultVehicle: driver.defaultVehicle,
      defaultMaxLoad: driver.defaultMaxLoad,
    });
  } catch (e) {
    console.error("profile-put error:", e);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
