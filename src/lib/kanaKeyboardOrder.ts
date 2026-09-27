export type KanaKeyboardOrder = "left-first" | "right-first";

// 同じセンターの01端末と比較できるよう、02端末だけ右始まりにする。
const RIGHT_FIRST_PILOT_LOGIN_ID = "510102";

export function kanaKeyboardOrderForLoginId(loginId: string | undefined): KanaKeyboardOrder {
  return loginId && loginId === RIGHT_FIRST_PILOT_LOGIN_ID ? "right-first" : "left-first";
}
