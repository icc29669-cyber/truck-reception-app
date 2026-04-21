import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { signPayload, verifyPayload } from "./cookieSign";

// ドライバーセッション Cookie は HMAC 署名付き。
// ペイロード: "<driverId>:<sessionVersion>" (両方整数)

const COOKIE_NAME = "driver_session";
const MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7日

function parsePayload(payload: string): { driverId: number; sessionVersion: number } | null {
  const parts = payload.split(":");
  if (parts.length !== 2) return null;
  const driverId = Number(parts[0]);
  const sessionVersion = Number(parts[1]);
  if (!Number.isInteger(driverId) || driverId <= 0) return null;
  if (!Number.isInteger(sessionVersion) || sessionVersion < 0) return null;
  return { driverId, sessionVersion };
}

// pin ハッシュや内部フィールドを返さない narrow なセッション表現
export type Session = {
  id: number;
  name: string;
  companyName: string;
  defaultVehicle: string;
  defaultMaxLoad: string;
  isAdmin: boolean;
  sessionVersion: number;
};

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const signed = cookieStore.get(COOKIE_NAME)?.value;
  const payload = verifyPayload(signed);
  if (!payload) return null;

  const parsed = parsePayload(payload);
  if (!parsed) return null;

  // pin ハッシュ等の機密フィールドは select で除外（誤って JSON 化して漏洩するリスクを根絶）
  const driver = await prisma.driver.findUnique({
    where: { id: parsed.driverId },
    select: {
      id: true, name: true, companyName: true,
      defaultVehicle: true, defaultMaxLoad: true,
      isAdmin: true, sessionVersion: true,
    },
  });
  if (!driver) return null;
  if ((driver.sessionVersion ?? 0) !== parsed.sessionVersion) return null;
  return driver;
}

export async function setSession(driverId: number) {
  const driver = await prisma.driver.findUnique({
    where: { id: driverId },
    select: { sessionVersion: true },
  });
  const sessionVersion = driver?.sessionVersion ?? 0;
  const payload = `${driverId}:${sessionVersion}`;
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, signPayload(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SEC,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  // 旧名の cookie が残っていれば念のため削除
  cookieStore.delete("driverId");
}

/** 既存の全セッションを無効化する（PIN リセット時などに使用） */
export async function invalidateAllSessions(driverId: number) {
  await prisma.driver.update({
    where: { id: driverId },
    data: { sessionVersion: { increment: 1 } },
  });
}
