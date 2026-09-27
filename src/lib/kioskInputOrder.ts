export type KioskInputOrder = "left-first" | "right-first";

// 同じセンターの01端末と比較できるよう、02端末だけ左右を反転する。
const RIGHT_FIRST_PILOT_LOGIN_ID = "510102";

export function kioskInputOrderForLoginId(loginId: string | undefined): KioskInputOrder {
  return loginId === RIGHT_FIRST_PILOT_LOGIN_ID ? "right-first" : "left-first";
}

/** 画面上のキーだけを左右反転する。入力値は通常の順序のまま保持する。 */
export function orderedInputRow<T>(row: readonly T[], order: KioskInputOrder): T[] {
  return order === "right-first" ? [...row].reverse() : [...row];
}
