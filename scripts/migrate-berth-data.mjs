/**
 * berth-app (旧) の Neon DB から reception-app の Neon DB へデータを移行するスクリプト。
 *
 * 前提:
 *   - BERTH_DATABASE_URL env: berth-app の Neon 接続 URL
 *   - DATABASE_URL env:       reception-app の Neon 接続 URL (このアプリの .env)
 *
 * 移行対象:
 *   - Driver      (phone+name+companyName で dedupe)
 *   - Passkey     (driver にマッピング)
 *   - Holiday
 *   - Reservation (driverId と centerId をマッピング)
 *
 * 使い方:
 *   BERTH_DATABASE_URL="postgres://..." node scripts/migrate-berth-data.mjs --dry-run
 *   BERTH_DATABASE_URL="postgres://..." node scripts/migrate-berth-data.mjs
 */
import { PrismaClient } from "@prisma/client";
import pg from "pg";

const { Pool } = pg;
const dryRun = process.argv.includes("--dry-run");

if (!process.env.BERTH_DATABASE_URL) {
  console.error("BERTH_DATABASE_URL env を設定してください");
  process.exit(1);
}

const berth = new Pool({ connectionString: process.env.BERTH_DATABASE_URL });
const rec = new PrismaClient();

async function q(sql, params = []) {
  const res = await berth.query(sql, params);
  return res.rows;
}

async function mapCenters() {
  const berthCenters = await q(`SELECT id, code, name FROM "Center"`);
  const recCenters = await rec.center.findMany({ select: { id: true, code: true, name: true } });
  const map = new Map(); // berthId -> recId
  for (const b of berthCenters) {
    const r = recCenters.find((r) => r.code === b.code);
    if (r) map.set(b.id, r.id);
    else console.warn(`[WARN] berth center code=${b.code} name=${b.name} が reception に未登録`);
  }
  console.log(`center マッピング: ${map.size}/${berthCenters.length}`);
  return map;
}

async function migrateDrivers() {
  const drivers = await q(`SELECT id, phone, name, "companyName", "isAdmin", pin, "sessionVersion", "agreedToPolicy", "defaultVehicle", "defaultMaxLoad", "createdAt" FROM "Driver"`);
  console.log(`drivers: ${drivers.length} 件`);
  const map = new Map(); // berthId -> recId
  for (const d of drivers) {
    const existing = await rec.driver.findFirst({
      where: { phone: d.phone, name: d.name, companyName: d.companyName },
    });
    if (existing) { map.set(d.id, existing.id); continue; }
    if (dryRun) { console.log(`  DRY: would create ${d.phone} ${d.name}`); continue; }
    const created = await rec.driver.create({
      data: {
        phone: d.phone, name: d.name, companyName: d.companyName,
        isAdmin: d.isAdmin ?? false, pin: d.pin ?? "",
        sessionVersion: d.sessionVersion ?? 0,
        agreedToPolicy: d.agreedToPolicy ?? false,
        defaultVehicle: d.defaultVehicle ?? "",
        defaultMaxLoad: d.defaultMaxLoad ?? "",
        createdAt: d.createdAt,
      },
    });
    map.set(d.id, created.id);
  }
  console.log(`  マッピング: ${map.size}`);
  return map;
}

async function migratePasskeys(driverMap) {
  const rows = await q(`SELECT id, "driverId", "publicKey", counter, transports, "deviceType", "backedUp", "createdAt" FROM "Passkey"`);
  console.log(`passkeys: ${rows.length}`);
  let created = 0;
  for (const p of rows) {
    const recDriverId = driverMap.get(p.driverId);
    if (!recDriverId) continue;
    const exists = await rec.passkey.findUnique({ where: { id: p.id } });
    if (exists) continue;
    if (dryRun) { created++; continue; }
    await rec.passkey.create({
      data: {
        id: p.id, driverId: recDriverId,
        publicKey: p.publicKey, counter: BigInt(p.counter ?? 0),
        transports: p.transports ?? "[]",
        deviceType: p.deviceType ?? "",
        backedUp: p.backedUp ?? false,
        createdAt: p.createdAt,
      },
    });
    created++;
  }
  console.log(`  作成: ${created}`);
}

async function migrateHolidays() {
  const rows = await q(`SELECT date, name FROM "Holiday"`);
  console.log(`holidays: ${rows.length}`);
  let created = 0;
  for (const h of rows) {
    const e = await rec.holiday.findUnique({ where: { date: h.date } });
    if (e) continue;
    if (dryRun) { created++; continue; }
    await rec.holiday.create({ data: { date: h.date, name: h.name ?? "" } });
    created++;
  }
  console.log(`  作成: ${created}`);
}

async function migrateReservations(driverMap, centerMap) {
  const rows = await q(`SELECT id, "driverId", "centerId", date, "startTime", "endTime", "vehicleNumber", "maxLoad", "companyName", "driverName", status, "createdAt" FROM "Reservation"`);
  console.log(`reservations: ${rows.length}`);
  let created = 0;
  for (const r of rows) {
    const recDriverId = driverMap.get(r.driverId);
    const recCenterId = centerMap.get(r.centerId);
    if (!recCenterId) continue;
    const dup = await rec.reservation.findFirst({
      where: {
        centerId: recCenterId,
        reservationDate: new Date(r.date + "T00:00:00+09:00"),
        startTime: r.startTime, endTime: r.endTime,
        driverName: r.driverName, companyName: r.companyName,
      },
    });
    if (dup) continue;
    if (dryRun) { created++; continue; }
    // berth status "confirmed" → reception "pending"
    const status = r.status === "cancelled" ? "cancelled"
      : r.status === "completed" ? "completed"
      : "pending";
    await rec.reservation.create({
      data: {
        centerId: recCenterId, driverId: recDriverId ?? null,
        phone: "", // berth ではドライバー紐づけ。reception は phone もスナップショット。未指定可。
        driverName: r.driverName ?? "", companyName: r.companyName ?? "",
        vehicleNumber: r.vehicleNumber ?? "", maxLoad: r.maxLoad ?? "",
        reservationDate: new Date(r.date + "T00:00:00+09:00"),
        startTime: r.startTime, endTime: r.endTime,
        status, createdAt: r.createdAt,
      },
    });
    created++;
  }
  console.log(`  作成: ${created}`);
}

(async () => {
  console.log(`[${dryRun ? "DRY-RUN" : "LIVE"}] 移行開始`);
  const centerMap = await mapCenters();
  const driverMap = await migrateDrivers();
  await migratePasskeys(driverMap);
  await migrateHolidays();
  await migrateReservations(driverMap, centerMap);
  console.log("完了");
  await berth.end();
  await rec.$disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
