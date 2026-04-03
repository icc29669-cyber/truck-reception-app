// @ts-check
"use strict";

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 シードデータを投入します...");

  // ─── センター ──────────────────────────────────────────
  const center1 = await prisma.center.upsert({
    where: { id: 1 },
    update: {},
    create: { name: "だんじり機材センター", secretKey: "secret-danjiricenter" },
  });
  const center2 = await prisma.center.upsert({
    where: { id: 2 },
    update: {},
    create: { name: "狭山機材センター", secretKey: "secret-sayamacenter" },
  });
  console.log(`✅ センター: ${center1.name}, ${center2.name}`);

  // ─── ドライバー ────────────────────────────────────────
  const driversData = [
    { name: "モウリ ケイイチ",   companyName: "ニホンセイフティー",   phone: "09012345678" },
    { name: "ヨコタ ケイコ",     companyName: "ファルマン ウンユ",     phone: "09012345678" },
    { name: "ノゾエ マドカ",     companyName: "ショーキ",              phone: "09012345678" },
    { name: "タナカ イチロウ",   companyName: "オオサカ ウンソウ",     phone: "08012345678" },
    { name: "サトウ ハナコ",     companyName: "テスト ブツリュウ",     phone: "08012345678" },
    { name: "ワタナベ カズユキ", companyName: "シンニホン コンツウ",   phone: "07011112222" },
  ];

  for (const d of driversData) {
    const existing = await prisma.driver.findFirst({
      where: { phone: d.phone, name: d.name },
    });
    if (!existing) {
      await prisma.driver.create({ data: d });
      console.log(`  👤 ${d.name} (${d.companyName})`);
    }
  }

  // ─── 車両 ──────────────────────────────────────────────
  const vehiclesData = [
    { region:"多摩",   classNum:"500", hira:"あ", number:"7917", vehicleNumber:"多摩 500 あ 7917",   maxLoad:"13000", phone:"09012345678" },
    { region:"多摩",   classNum:"500", hira:"あ", number:"1234", vehicleNumber:"多摩 500 あ 1234",   maxLoad:"5000",  phone:"09012345678" },
    { region:"富山",   classNum:"300", hira:"ま", number:"7983", vehicleNumber:"富山 300 ま 7983",   maxLoad:"2000",  phone:"09012345678" },
    { region:"大阪",   classNum:"100", hira:"さ", number:"3456", vehicleNumber:"大阪 100 さ 3456",   maxLoad:"20000", phone:"08012345678" },
    { region:"なにわ", classNum:"800", hira:"に", number:"9999", vehicleNumber:"なにわ 800 に 9999", maxLoad:"8000",  phone:"07011112222" },
  ];

  for (const v of vehiclesData) {
    const existing = await prisma.vehicle.findFirst({
      where: { vehicleNumber: v.vehicleNumber },
    });
    if (!existing) {
      await prisma.vehicle.create({ data: v });
      console.log(`  🚛 ${v.vehicleNumber}`);
    }
  }

  console.log("🎉 シード完了！");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
