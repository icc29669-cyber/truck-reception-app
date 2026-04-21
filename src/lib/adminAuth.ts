/**
 * 旧 berth-app の adminAuth の互換シム。
 * 統合後は `User` セッション (truck_session cookie) を管理者権限として扱う。
 */
import { cookies } from "next/headers";
import { verifySession, SESSION_COOKIE } from "./session";

export async function checkAdminAuth(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return false;
  const session = await verifySession(token);
  return !!session;
}

// 互換のため残すが、実際のログインは /login (User セッション) を使う
export async function setAdminSession(): Promise<void> {
  throw new Error("setAdminSession は廃止されました。/login を使ってください");
}

export async function clearAdminSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
