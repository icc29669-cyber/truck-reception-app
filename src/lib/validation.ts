/**
 * ログインID/パスワードの統一バリデーション
 *   - ログインID: 6桁の半角数字ピッタリ
 *   - パスワード: 4文字以上
 */

export const LOGIN_ID_PATTERN = /^\d{6}$/;
export const PASSWORD_MIN_LENGTH = 4;

export function validateLoginId(loginId: string): string | null {
  if (!loginId) return "ログインIDを入力してください";
  if (!LOGIN_ID_PATTERN.test(loginId)) return "ログインIDは6桁の半角数字で入力してください";
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return "パスワードを入力してください";
  if (password.length < PASSWORD_MIN_LENGTH) return `パスワードは${PASSWORD_MIN_LENGTH}文字以上必要です`;
  return null;
}
