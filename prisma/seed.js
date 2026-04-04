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

  // ─── 運送会社 ──────────────────────────────────────────
  const companiesData = [
    { name: "ニホンセイフティー", phone: "0120000001" },
    { name: "ファルマン ウンユ", phone: "0120000002" },
    { name: "ショーキ", phone: "0120000003" },
    { name: "オオサカ ウンソウ", phone: "0120000004" },
    { name: "テスト ブツリュウ", phone: "0120000005" },
    { name: "シンニホン コンツウ", phone: "0120000006" },
    { name: "ミクニランテック", phone: "0120000007" },
  ];
  for (const c of companiesData) {
    const existing = await prisma.company.findFirst({ where: { name: c.name } });
    if (!existing) {
      await prisma.company.create({ data: c });
      console.log(`  🏢 ${c.name}`);
    }
  }

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

  // ─── ナンバープレート地名マスタ ────────────────────────
  const plateRegions = [
    "札幌","函館","旭川","室蘭","釧路","帯広","北見",
    "青森","八戸","岩手","宮城","秋田","山形","庄内","福島","いわき",
    "水戸","つくば","土浦","宇都宮","那須","とちぎ","群馬","前橋","高崎",
    "大宮","川口","川越","所沢","熊谷","春日部","越谷","上尾",
    "千葉","成田","習志野","市川","船橋","袖ヶ浦","野田","柏","市原",
    "品川","世田谷","練馬","杉並","板橋","足立","多摩","八王子","江東",
    "横浜","川崎","湘南","相模","平塚",
    "新潟","長岡","上越","長野","松本","諏訪","富山","金沢","石川","福井",
    "山梨","甲府",
    "静岡","浜松","沼津","富士山","伊豆",
    "名古屋","豊橋","三河","岡崎","豊田","一宮","春日井","尾張小牧",
    "岐阜","飛騨","三重","四日市","鈴鹿",
    "滋賀","京都","大阪","なにわ","和泉","堺",
    "神戸","姫路","奈良","和歌山",
    "鳥取","島根","岡山","倉敷","広島","福山","山口","下関",
    "徳島","香川","愛媛","高知",
    "福岡","北九州","久留米","筑豊","佐賀","長崎","佐世保","熊本","大分","宮崎","鹿児島","沖縄",
  ];
  const existingRegions = await prisma.plateRegion.count();
  if (existingRegions === 0) {
    for (let i = 0; i < plateRegions.length; i++) {
      await prisma.plateRegion.create({
        data: { name: plateRegions[i], kana: plateRegions[i], sortOrder: i },
      });
    }
    console.log(`  🗾 地名マスタ: ${plateRegions.length}件`);
  }

  // ─── ナンバープレートひらがなマスタ ────────────────────
  const hiraData = [
    // 事業用（緑ナンバー）
    ...["あ","い","う","え","か","き","く","け","こ","を"].map((c,i) => ({ char: c, category: "business", sortOrder: i })),
    // 自家用（白ナンバー）
    ...["さ","す","せ","そ","た","ち","つ","て","と",
        "な","に","ぬ","ね","の","は","ひ","ふ","ほ",
        "ま","み","む","め","も","や","ゆ","ら","り","る","ろ"].map((c,i) => ({ char: c, category: "private", sortOrder: 10+i })),
    // レンタカー
    ...["わ","れ"].map((c,i) => ({ char: c, category: "rental", sortOrder: 50+i })),
    // 使用不可（欠番）
    ...["お","し","へ","ん"].map((c,i) => ({ char: c, category: "unavailable", sortOrder: 60+i })),
  ];
  const existingHira = await prisma.plateHiragana.count();
  if (existingHira === 0) {
    for (const h of hiraData) {
      await prisma.plateHiragana.create({ data: h });
    }
    console.log(`  あ ひらがなマスタ: ${hiraData.length}件`);
  }

  // ─── ナンバープレートアルファベットマスタ ──────────────
  const alphaChars = ["A","C","F","H","K","L","M","P","T","X","Y"];
  const existingAlpha = await prisma.plateAlphabet.count();
  if (existingAlpha === 0) {
    for (let i = 0; i < alphaChars.length; i++) {
      await prisma.plateAlphabet.create({
        data: { char: alphaChars[i], sortOrder: i },
      });
    }
    console.log(`  🔤 アルファベットマスタ: ${alphaChars.length}件`);
  }

  // ─── サンプル予約データ ────────────────────────────────
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const existingRes = await prisma.reservation.count();
  if (existingRes === 0) {
    await prisma.reservation.create({
      data: {
        centerId: 1,
        phone: "09012345678",
        driverName: "モウリ ケイイチ",
        companyName: "ニホンセイフティー",
        plateRegion: "多摩",
        plateClassNum: "500",
        plateHira: "あ",
        plateNumber: "7917",
        vehicleNumber: "多摩 500 あ 7917",
        maxLoad: "13000",
        reservationDate: today,
        startTime: "10:00",
        endTime: "11:00",
        status: "pending",
        notes: "テスト予約",
      },
    });
    await prisma.reservation.create({
      data: {
        centerId: 1,
        phone: "09012345678",
        driverName: "ヨコタ ケイコ",
        companyName: "ファルマン ウンユ",
        plateRegion: "多摩",
        plateClassNum: "500",
        plateHira: "あ",
        plateNumber: "1234",
        vehicleNumber: "多摩 500 あ 1234",
        maxLoad: "5000",
        reservationDate: today,
        startTime: "14:00",
        endTime: "15:00",
        status: "pending",
        notes: "",
      },
    });
    console.log("  📅 サンプル予約: 2件");
  }

  console.log("🎉 シード完了！");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
