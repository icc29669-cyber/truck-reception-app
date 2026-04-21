import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySession, SESSION_COOKIE } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * ログイン中ユーザーが所属するセンターの KPI を返す
 *   - 本日受付数 / 本日予約数 / 未チェックイン / 最終受付時刻 / 稼働ユーザー数 / 営業状態
 */
export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "認証が必要" }, { status: 401 });

  // JST 当日 0:00–24:00
  const nowUtc = new Date();
  const jst = new Date(nowUtc.getTime() + 9 * 60 * 60 * 1000);
  const y = jst.getUTCFullYear(); const m = jst.getUTCMonth(); const d = jst.getUTCDate();
  const startUtc = new Date(Date.UTC(y, m, d, -9, 0, 0, 0));
  const endUtc   = new Date(Date.UTC(y, m, d, 15, 0, 0, 0));
  const centerId = session.centerId;

  const center = await prisma.center.findUnique({ where: { id: centerId } });
  if (!center) return NextResponse.json({ error: "センターが見つかりません" }, { status: 404 });

  const [recCount, resvCount, unchecked, lastRec, userCount, nextResvs, recentReceptions] = await Promise.all([
    prisma.reception.count({ where: { centerId, arrivedAt: { gte: startUtc, lt: endUtc } } }),
    prisma.reservation.count({ where: { centerId, reservationDate: { gte: startUtc, lt: endUtc } } }),
    prisma.reservation.count({
      where: { centerId, reservationDate: { gte: startUtc, lt: endUtc }, status: "pending" },
    }),
    prisma.reception.findFirst({
      where: { centerId, arrivedAt: { gte: startUtc, lt: endUtc } },
      orderBy: { arrivedAt: "desc" }, select: { arrivedAt: true },
    }),
    prisma.user.count({ where: { centerId, isActive: true } }),
    prisma.reservation.findMany({
      where: { centerId, reservationDate: { gte: startUtc, lt: endUtc }, status: "pending" },
      orderBy: { startTime: "asc" }, take: 5,
      select: { id: true, startTime: true, endTime: true, companyName: true, driverName: true, plateNumber: true },
    }),
    prisma.reception.findMany({
      where: { centerId, arrivedAt: { gte: startUtc, lt: endUtc } },
      orderBy: { arrivedAt: "desc" }, take: 5,
      select: { id: true, centerDailyNo: true, arrivedAt: true, companyName: true, driverName: true, vehicleNumber: true },
    }),
  ]);

  const hhmm = jst.toISOString().slice(11, 16);
  const isOpenNow = (() => {
    const day = jst.getUTCDay();
    if (day === 0 && center.closedOnSunday) return false;
    return hhmm >= center.openTime && hhmm <= center.closeTime;
  })();

  return NextResponse.json({
    center: {
      id: center.id, code: center.code, name: center.name,
      openTime: center.openTime, closeTime: center.closeTime,
    },
    kpi: {
      receptionsToday: recCount,
      reservationsToday: resvCount,
      uncheckedInToday: unchecked,
      userCount,
      lastReceptionAt: lastRec?.arrivedAt.toISOString() ?? null,
      isOpenNow,
    },
    nextReservations: nextResvs,
    recentReceptions: recentReceptions.map((r) => ({ ...r, arrivedAt: r.arrivedAt.toISOString() })),
    jstDate: `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
  });
}
