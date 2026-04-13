import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyKioskSecret } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * キオスク向け: ドライバー/車両候補をソフトデリート（isActive = false）
 * DELETE /api/reception/delete-candidate
 * Body: { type: "driver" | "vehicle", id: number }
 */
export async function DELETE(req: NextRequest) {
  const authError = verifyKioskSecret(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { type, id } = body as { type: string; id: number };

    if (!type || !id || typeof id !== "number" || !Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "type と有効な id は必須です" }, { status: 400 });
    }

    if (type === "driver") {
      await prisma.driver.update({
        where: { id },
        data: { isActive: false },
      });
    } else if (type === "vehicle") {
      await prisma.vehicle.update({
        where: { id },
        data: { isActive: false },
      });
    } else {
      return NextResponse.json({ error: "type は driver または vehicle です" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("delete-candidate error:", e);
    return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
  }
}
