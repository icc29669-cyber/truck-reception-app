// 本セッションで生成した検証用 reception レコードを削除する。
// 対象: 電話番号が特定のテストプレフィックスに一致するもの。
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// 私が curl 経由で送った検証番号のプレフィックス(実在顧客の番号に偶然一致しないか必ずチェック)
const TEST_PHONE_PATTERNS = [
  "09099990001",          // L2 smoke #10
  "09088880001","09088880002","09088880003","09088880004","09088880005",
  "09088880006","09088880007","09088880008","09088880009","09088880010", // 10並列1回目
  "09077770001","09077770002","09077770003","09077770004","09077770005", // 並列retry
  "09066660001","09066660002","09066660003","09066660004","09066660005", // 5並列
  "09055550100","09055550200","09055550300", // perf測定
  "09044440100","09044440200","09044440300", // perf検証
  "09099990099",          // 架空番号(berth-app auth 確認用、reception-app には無いはず)
];

try {
  // まず対象を列挙
  const before = await prisma.reception.findMany({
    where: { phone: { in: TEST_PHONE_PATTERNS } },
    select: {
      id: true, phone: true, driverName: true, companyName: true,
      centerDailyNo: true, arrivedAt: true,
    },
    orderBy: { id: "asc" },
  });

  console.log(`対象 reception: ${before.length} 件`);
  for (const r of before) {
    console.log(`  id=${r.id} dailyNo=${r.centerDailyNo} phone=${r.phone} arrivedAt=${r.arrivedAt.toISOString()}`);
  }

  if (before.length === 0) {
    console.log("削除対象なし。");
    process.exit(0);
  }

  // 安全のため confirmation: --yes フラグが無ければ dry-run
  const args = process.argv.slice(2);
  if (!args.includes("--yes")) {
    console.log("\n※ dry-run モード。実際に削除するには --yes を付けて再実行してください。");
    process.exit(0);
  }

  // 先に対応する driver/vehicle も特定(テスト生成なので DB に残したくない)
  const testDriverIds = new Set(
    (await prisma.driver.findMany({
      where: { phone: { in: TEST_PHONE_PATTERNS } },
      select: { id: true },
    })).map((d) => d.id)
  );
  const testVehicleIds = new Set(
    (await prisma.vehicle.findMany({
      where: { phone: { in: TEST_PHONE_PATTERNS } },
      select: { id: true },
    })).map((v) => v.id)
  );
  console.log(`対象 driver: ${testDriverIds.size} 件 / 対象 vehicle: ${testVehicleIds.size} 件`);

  // reception を先に削除(FK 制約のため)
  const delRec = await prisma.reception.deleteMany({
    where: { phone: { in: TEST_PHONE_PATTERNS } },
  });
  console.log(`reception 削除: ${delRec.count} 件`);

  if (testDriverIds.size > 0) {
    const delDrv = await prisma.driver.deleteMany({
      where: { id: { in: Array.from(testDriverIds) } },
    });
    console.log(`driver 削除: ${delDrv.count} 件`);
  }
  if (testVehicleIds.size > 0) {
    const delVeh = await prisma.vehicle.deleteMany({
      where: { id: { in: Array.from(testVehicleIds) } },
    });
    console.log(`vehicle 削除: ${delVeh.count} 件`);
  }

  console.log("\n✅ クリーンアップ完了");
} finally {
  await prisma.$disconnect();
}
