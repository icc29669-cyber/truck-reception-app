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

  // Parse dates as local midnight to avoid UTC offset issues
  let fromDate: Date;
  let toDate: Date;
  if (from) {
    const [y, m, d] = from.split("-").map(Number);
    fromDate = new Date(y, m - 1, d, 0, 0, 0, 0);
  } else {
    const now = new Date();
    fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  }
  if (to) {
    const [y, m, d] = to.split("-").map(Number);
    toDate = new Date(y, m - 1, d + 1, 0, 0, 0, 0);
  } else {
    const now = new Date();
    toDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  }

  try {
    const receptions = await prisma.reception.findMany({
      where: {
        ...(centerId ? { centerId } : {}),
        arrivedAt: { gte: fromDate, lt: toDate },
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
    const fmtLocal = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    const filename = `reception_${from || fmtLocal(fromDate)}_${to || fmtLocal(fromDate)}.csv`;

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
