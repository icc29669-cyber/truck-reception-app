export type PlateColor = "white" | "green" | "yellow" | "black";

export function detectPlateColor(num3: string, kana: string = ""): PlateColor {
  if (!num3) return "green";
  const numericStr = num3.replace(/[^0-9]/g, "");
  const n = parseInt(numericStr || "0", 10);
  // ── 軽自動車の分類番号レンジ(公式: 軽自動車検査協会) ──
  // 480-498: 軽貨物 / 580-598: 軽乗用 / 680-698: 軽乗合
  // 780-798: 軽乗用(新番号帯) / 880-898: 軽特種
  // 旧実装は 580-799 と広く、普通車の 599-679・699-779 も誤って軽判定していた。
  const isKei =
    (n >= 480 && n <= 498) ||
    (n >= 580 && n <= 598) ||
    (n >= 680 && n <= 698) ||
    (n >= 780 && n <= 798) ||
    (n >= 880 && n <= 898);
  if (isKei) {
    // 軽事業用(黒ナンバー): ひらがな「り」「れ」
    if (kana === "り" || kana === "れ") return "black";
    // 軽自家用(黄色ナンバー) — レンタカー「わ」も含め黄色表示
    return "yellow";
  }
  // 登録自動車の事業用(緑ナンバー)判別ひらがな
  const jigyoKana = new Set(["あ", "い", "う", "え", "か", "き", "く", "け", "こ", "を"]);
  if (jigyoKana.has(kana)) return "green";
  if (!kana) {
    // ひらがな未入力のプレビュー時のヒント表示: 1xx/2xx(大型車)は緑で出ることが多いので暫定的に緑
    const first = num3[0];
    if (first === "1" || first === "2") return "green";
    return "white";
  }
  return "white";
}
