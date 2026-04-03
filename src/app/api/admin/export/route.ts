import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function toCSV(rows: Record<string, string | number>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      headers.map((h) => `"${String(row[h] ?? "").replace(/"/g, '""')}"`).join(",")
    ),
  ];
  // BOM付きUTF-8 (Excelで文字化けしないように)
  return "\uFEFF" + lines.join("\r\n");
}

export async function GET(req: NextRequest) {
  const centerId = Number(req.nextUrl.searchParams.get("centerId") ?? "0") || undefined;
  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");

  const fromDate = from ? new Date(from) : new Date();
  fromDate.setHours(0, 0, 0, 0);
  const toDate = to ? new Date(to) : new Date();
  toDate.setHours(23, 59, 59, 999);

  try {
    const receptions = await prisma.reception.findMany({
      where: {
        ...(centerId ? { centerId } : {}),
        arrivedAt: { gte: fromDate, lte: toDate },
      },
      include: { center: { select: { name: true } } },
      orderBy: [{ centerId: "asc" }, { arrivedAt: "asc" }],
    });

    const rows = receptions.map((r) => ({
      受付ID: r.id,
      センター受付番号: r.centerDailyNo,
      センター名: r.center.name,
      受付日時: r.arrivedAt.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" }),
      運送会社名: r.companyName,
      ドライバー名: r.driverName,
      電話番号: r.phone,
      車番: r.vehicleNumber,
      最大積載量kg: r.maxLoad,
    }));

    const csv = toCSV(rows as Record<string, string | number>[]);
    const filename = `reception_${fromDate.toISOString().slice(0, 10)}_${toDate.toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "エクスポートに失敗しました" }, { status: 500 });
  }
}
