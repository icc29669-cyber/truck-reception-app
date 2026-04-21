import { NextRequest, NextResponse } from "next/server";
import pg from "pg";
import { prisma } from "@/lib/prisma";
import { verifySession, SESSION_COOKIE } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5分

/**
 * berth-app の旧 DB から reception の DB へデータ移行 (一度きり)。
 * 既に移行済みの行 (phone+name+companyName で一致) はスキップするので再実行安全。
 *
 * 必要: BERTH_DATABASE_URL env + 管理者セッション
 * POST /api/admin/migrate-berth?dry=1 で dry-run
 */
export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "認証が必要" }, { status: 401 });

  const berthUrl = process.env.BERTH_DATABASE_URL;
  if (!berthUrl) return NextResponse.json({ error: "BERTH_DATABASE_URL env 未設定" }, { status: 500 });

  const dryRun = req.nextUrl.searchParams.get("dry") === "1";
  const pool = new pg.Pool({ connectionString: berthUrl, connectionTimeoutMillis: 30_000 });
  const log: string[] = [];
  const summary = {
    centers: { matched: 0, created: 0, unmatched: 0 },
    drivers: { total: 0, existing: 0, created: 0 },
    passkeys: { total: 0, created: 0, skipped: 0 },
    holidays: { total: 0, created: 0, existing: 0 },
    reservations: { total: 0, created: 0, skipped: 0 },
  };

  try {
    const q = async (sql: string, params: unknown[] = []) => {
      const r = await pool.query(sql, params);
      return r.rows as Record<string, unknown>[];
    };

    // ── センターマッピング: code 優先→name 一致→無ければ自動作成 ──
    const berthCenters = await q(`SELECT id, code, name, "openTime", "closeTime", "closedOnSunday", "closedOnHoliday", "hasBreak", "breakStart", "breakEnd" FROM "Center"`);
    const recCenters = await prisma.center.findMany({ select: { id: true, code: true, name: true } });
    const centerMap = new Map<number, number>();
    for (const b of berthCenters) {
      const bcode = (b.code as string) || "";
      const bname = b.name as string;
      let r: { id: number } | null = null;
      if (bcode) r = recCenters.find((r) => r.code === bcode) ?? null;
      if (!r) r = recCenters.find((r) => r.name === bname) ?? null;
      if (r) { centerMap.set(b.id as number, r.id); summary.centers.matched++; continue; }
      // 無ければ作成
      if (dryRun) { summary.centers.created++; continue; }
      const created = await prisma.center.create({
        data: {
          code: bcode, name: bname,
          openTime: (b.openTime as string) ?? "08:00",
          closeTime: (b.closeTime as string) ?? "18:00",
          closedOnSunday: (b.closedOnSunday as boolean) ?? true,
          closedOnHoliday: (b.closedOnHoliday as boolean) ?? true,
          hasBreak: (b.hasBreak as boolean) ?? false,
          breakStart: (b.breakStart as string) ?? "12:00",
          breakEnd: (b.breakEnd as string) ?? "13:00",
          isActive: true,
        },
      });
      centerMap.set(b.id as number, created.id);
      summary.centers.created++;
      log.push(`[INFO] center 作成: ${bname} (id=${created.id})`);
    }

    // ── Driver 移行 ──
    const drivers = await q(`SELECT id, phone, name, "companyName", "isAdmin", pin, "sessionVersion", "agreedToPolicy", "defaultVehicle", "defaultMaxLoad", "createdAt" FROM "Driver"`);
    summary.drivers.total = drivers.length;
    const driverMap = new Map<number, number>();
    for (const d of drivers) {
      const existing = await prisma.driver.findFirst({
        where: {
          phone: d.phone as string,
          name: d.name as string,
          companyName: d.companyName as string,
        },
      });
      if (existing) { driverMap.set(d.id as number, existing.id); summary.drivers.existing++; continue; }
      if (dryRun) continue;
      const created = await prisma.driver.create({
        data: {
          phone: d.phone as string,
          name: d.name as string,
          companyName: d.companyName as string,
          isAdmin: (d.isAdmin as boolean) ?? false,
          pin: (d.pin as string) ?? "",
          sessionVersion: (d.sessionVersion as number) ?? 0,
          agreedToPolicy: (d.agreedToPolicy as boolean) ?? false,
          defaultVehicle: (d.defaultVehicle as string) ?? "",
          defaultMaxLoad: (d.defaultMaxLoad as string) ?? "",
          createdAt: d.createdAt as Date,
        },
      });
      driverMap.set(d.id as number, created.id);
      summary.drivers.created++;
    }

    // ── Passkey 移行 ──
    const passkeys = await q(`SELECT id, "driverId", "publicKey", counter, transports, "deviceType", "backedUp", "createdAt" FROM "Passkey"`);
    summary.passkeys.total = passkeys.length;
    for (const p of passkeys) {
      const recDriverId = driverMap.get(p.driverId as number);
      if (!recDriverId) { summary.passkeys.skipped++; continue; }
      const exists = await prisma.passkey.findUnique({ where: { id: p.id as string } });
      if (exists) { summary.passkeys.skipped++; continue; }
      if (dryRun) { summary.passkeys.created++; continue; }
      await prisma.passkey.create({
        data: {
          id: p.id as string, driverId: recDriverId,
          publicKey: p.publicKey as string,
          counter: BigInt((p.counter as bigint | number) ?? 0),
          transports: (p.transports as string) ?? "[]",
          deviceType: (p.deviceType as string) ?? "",
          backedUp: (p.backedUp as boolean) ?? false,
          createdAt: p.createdAt as Date,
        },
      });
      summary.passkeys.created++;
    }

    // ── Holiday 移行 ──
    const holidays = await q(`SELECT date, name FROM "Holiday"`);
    summary.holidays.total = holidays.length;
    for (const h of holidays) {
      const e = await prisma.holiday.findUnique({ where: { date: h.date as string } });
      if (e) { summary.holidays.existing++; continue; }
      if (dryRun) { summary.holidays.created++; continue; }
      await prisma.holiday.create({ data: { date: h.date as string, name: (h.name as string) ?? "" } });
      summary.holidays.created++;
    }

    // ── Reservation 移行 ──
    const reservations = await q(`SELECT id, "driverId", "centerId", date, "startTime", "endTime", "vehicleNumber", "maxLoad", "companyName", "driverName", status, "createdAt" FROM "Reservation"`);
    summary.reservations.total = reservations.length;
    for (const r of reservations) {
      const recCenterId = centerMap.get(r.centerId as number);
      if (!recCenterId) { summary.reservations.skipped++; continue; }
      const recDriverId = driverMap.get(r.driverId as number);
      const resvDate = new Date(((r.date as string) + "T00:00:00+09:00"));
      const dup = await prisma.reservation.findFirst({
        where: {
          centerId: recCenterId, reservationDate: resvDate,
          startTime: r.startTime as string, endTime: r.endTime as string,
          driverName: (r.driverName as string) ?? "",
          companyName: (r.companyName as string) ?? "",
        },
      });
      if (dup) { summary.reservations.skipped++; continue; }
      if (dryRun) { summary.reservations.created++; continue; }
      const status = r.status === "cancelled" ? "cancelled"
        : r.status === "completed" ? "completed"
        : "pending";
      await prisma.reservation.create({
        data: {
          centerId: recCenterId, driverId: recDriverId ?? null,
          phone: "",
          driverName: (r.driverName as string) ?? "",
          companyName: (r.companyName as string) ?? "",
          vehicleNumber: (r.vehicleNumber as string) ?? "",
          maxLoad: (r.maxLoad as string) ?? "",
          reservationDate: resvDate,
          startTime: r.startTime as string, endTime: r.endTime as string,
          status, createdAt: r.createdAt as Date,
        },
      });
      summary.reservations.created++;
    }

    return NextResponse.json({ ok: true, dryRun, summary, log });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg, summary, log }, { status: 500 });
  } finally {
    await pool.end().catch(() => {});
  }
}
