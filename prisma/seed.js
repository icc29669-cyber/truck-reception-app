// @ts-check
"use strict";

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function ensureSchema() {
  // prisma db pushがDDLを適用できない場合のフォールバック
  // ADD COLUMN IF NOT EXISTSは冪等（既にあれば何もしない）
  const cols = [
    [`"openTime"`,        `TEXT NOT NULL DEFAULT '08:00'`],
    [`"closeTime"`,       `TEXT NOT NULL DEFAULT '18:00'`],
    [`"slotDurationMinutes"`, `INTEGER NOT NULL DEFAULT 60`],
    [`"closedOnSunday"`,  `BOOLEAN NOT NULL DEFAULT true`],
    [`"closedOnHoliday"`, `BOOLEAN NOT NULL DEFAULT true`],
    [`"hasBreak"`,        `BOOLEAN NOT NULL DEFAULT false`],
    [`"breakStart"`,      `TEXT NOT NULL DEFAULT '12:00'`],
    [`"breakEnd"`,        `TEXT NOT NULL DEFAULT '13:00'`],
    [`"breaks"`,          `TEXT NOT NULL DEFAULT '[]'`],
    [`"messageOpen"`,     `TEXT NOT NULL DEFAULT 'いらっしゃいませ'`],
    [`"messageBreak"`,    `TEXT NOT NULL DEFAULT 'ただいま昼休みです　しばらくお待ちください'`],
    [`"messageClosed"`,   `TEXT NOT NULL DEFAULT '本日の受付は終了しました'`],
    [`"messageOutsideHours"`, `TEXT NOT NULL DEFAULT '受付時間外です'`],
  ];
  for (const [col, def] of cols) {
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "Center" ADD COLUMN IF NOT EXISTS ${col} ${def}`);
    } catch (e) {
      // カラムが既に存在する場合は無視
      console.log(`  (skip ${col})`);
    }
  }

  // autoincrement シーケンスを MAX(id) に合わせる
  // スキーマ移行後にシーケンスがズレて P2002 が出るのを防ぐ
  const seqTables = ["Center","Company","Driver","Vehicle","PlateRegion","PlateHiragana","PlateAlphabet","Reservation","Reception"];
  for (const t of seqTables) {
    try {
      await prisma.$executeRawUnsafe(
        `SELECT setval(pg_get_serial_sequence('"${t}"', 'id'), COALESCE(MAX(id), 0) + 1, false) FROM "${t}"`
      );
    } catch (e) {
      console.log(`  (skip seq reset: ${t})`);
    }
  }

  console.log("  DB schema ensured");
}

async function main() {
  console.log("seed: start");

  // まずスキーマ保証
  await ensureSchema();

  // ─── センター ──────────────────────────────────────────
  // センターはfindFirst+create/updateで確実に存在を保証
  const centersData = [
    { code: "3100", name: "だんじり機材センター", secretKey: "secret-danjiricenter" },
    { code: "3101", name: "狭山機材センター", secretKey: "secret-sayamacenter" },
  ];
  for (const cd of centersData) {
    const existing = await prisma.center.findFirst({ where: { code: cd.code } });
    if (existing) {
      await prisma.center.update({ where: { id: existing.id }, data: { name: cd.name } });
    } else {
      await prisma.center.create({ data: cd });
    }
    console.log(`  ✅ センター: ${cd.code} ${cd.name}`);
  }

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
    { name: "札幌", kana: "さっぽろ" }, { name: "函館", kana: "はこだて" }, { name: "旭川", kana: "あさひかわ" },
    { name: "室蘭", kana: "むろらん" }, { name: "釧路", kana: "くしろ" }, { name: "帯広", kana: "おびひろ" }, { name: "北見", kana: "きたみ" },
    { name: "青森", kana: "あおもり" }, { name: "八戸", kana: "はちのへ" }, { name: "岩手", kana: "いわて" },
    { name: "宮城", kana: "みやぎ" }, { name: "秋田", kana: "あきた" }, { name: "山形", kana: "やまがた" },
    { name: "庄内", kana: "しょうない" }, { name: "福島", kana: "ふくしま" }, { name: "いわき", kana: "いわき" },
    { name: "水戸", kana: "みと" }, { name: "つくば", kana: "つくば" }, { name: "土浦", kana: "つちうら" },
    { name: "宇都宮", kana: "うつのみや" }, { name: "那須", kana: "なす" }, { name: "とちぎ", kana: "とちぎ" },
    { name: "群馬", kana: "ぐんま" }, { name: "前橋", kana: "まえばし" }, { name: "高崎", kana: "たかさき" },
    { name: "大宮", kana: "おおみや" }, { name: "川口", kana: "かわぐち" }, { name: "川越", kana: "かわごえ" },
    { name: "所沢", kana: "ところざわ" }, { name: "熊谷", kana: "くまがや" }, { name: "春日部", kana: "かすかべ" },
    { name: "越谷", kana: "こしがや" }, { name: "上尾", kana: "あげお" },
    { name: "千葉", kana: "ちば" }, { name: "成田", kana: "なりた" }, { name: "習志野", kana: "ならしの" },
    { name: "市川", kana: "いちかわ" }, { name: "船橋", kana: "ふなばし" }, { name: "袖ヶ浦", kana: "そでがうら" },
    { name: "野田", kana: "のだ" }, { name: "柏", kana: "かしわ" }, { name: "市原", kana: "いちはら" },
    { name: "品川", kana: "しながわ" }, { name: "世田谷", kana: "せたがや" }, { name: "練馬", kana: "ねりま" },
    { name: "杉並", kana: "すぎなみ" }, { name: "板橋", kana: "いたばし" }, { name: "足立", kana: "あだち" },
    { name: "多摩", kana: "たま" }, { name: "八王子", kana: "はちおうじ" }, { name: "江東", kana: "こうとう" },
    { name: "横浜", kana: "よこはま" }, { name: "川崎", kana: "かわさき" }, { name: "湘南", kana: "しょうなん" },
    { name: "相模", kana: "さがみ" }, { name: "平塚", kana: "ひらつか" },
    { name: "新潟", kana: "にいがた" }, { name: "長岡", kana: "ながおか" }, { name: "上越", kana: "じょうえつ" },
    { name: "長野", kana: "ながの" }, { name: "松本", kana: "まつもと" }, { name: "諏訪", kana: "すわ" },
    { name: "富山", kana: "とやま" }, { name: "金沢", kana: "かなざわ" }, { name: "石川", kana: "いしかわ" }, { name: "福井", kana: "ふくい" },
    { name: "山梨", kana: "やまなし" }, { name: "甲府", kana: "こうふ" },
    { name: "静岡", kana: "しずおか" }, { name: "浜松", kana: "はままつ" }, { name: "沼津", kana: "ぬまづ" },
    { name: "富士山", kana: "ふじさん" }, { name: "伊豆", kana: "いず" },
    { name: "名古屋", kana: "なごや" }, { name: "豊橋", kana: "とよはし" }, { name: "三河", kana: "みかわ" },
    { name: "岡崎", kana: "おかざき" }, { name: "豊田", kana: "とよた" }, { name: "一宮", kana: "いちのみや" },
    { name: "春日井", kana: "かすがい" }, { name: "尾張小牧", kana: "おわりこまき" },
    { name: "岐阜", kana: "ぎふ" }, { name: "飛騨", kana: "ひだ" }, { name: "三重", kana: "みえ" },
    { name: "四日市", kana: "よっかいち" }, { name: "鈴鹿", kana: "すずか" },
    { name: "滋賀", kana: "しが" }, { name: "京都", kana: "きょうと" }, { name: "大阪", kana: "おおさか" },
    { name: "なにわ", kana: "なにわ" }, { name: "和泉", kana: "いずみ" }, { name: "堺", kana: "さかい" },
    { name: "神戸", kana: "こうべ" }, { name: "姫路", kana: "ひめじ" }, { name: "奈良", kana: "なら" }, { name: "和歌山", kana: "わかやま" },
    { name: "鳥取", kana: "とっとり" }, { name: "島根", kana: "しまね" }, { name: "岡山", kana: "おかやま" },
    { name: "倉敷", kana: "くらしき" }, { name: "広島", kana: "ひろしま" }, { name: "福山", kana: "ふくやま" },
    { name: "山口", kana: "やまぐち" }, { name: "下関", kana: "しものせき" },
    { name: "徳島", kana: "とくしま" }, { name: "香川", kana: "かがわ" }, { name: "愛媛", kana: "えひめ" }, { name: "高知", kana: "こうち" },
    { name: "福岡", kana: "ふくおか" }, { name: "北九州", kana: "きたきゅうしゅう" }, { name: "久留米", kana: "くるめ" },
    { name: "筑豊", kana: "ちくほう" }, { name: "佐賀", kana: "さが" }, { name: "長崎", kana: "ながさき" },
    { name: "佐世保", kana: "させぼ" }, { name: "熊本", kana: "くまもと" }, { name: "大分", kana: "おおいた" },
    { name: "宮崎", kana: "みやざき" }, { name: "鹿児島", kana: "かごしま" }, { name: "沖縄", kana: "おきなわ" },
  ];
  const existingRegions = await prisma.plateRegion.count();
  if (existingRegions === 0) {
    for (let i = 0; i < plateRegions.length; i++) {
      await prisma.plateRegion.create({
        data: { name: plateRegions[i].name, kana: plateRegions[i].kana, sortOrder: i },
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
