import { cookies } from "next/headers";
import { kanaKeyboardOrderForLoginId } from "@/lib/kanaKeyboardOrder";
import { SESSION_COOKIE, verifySession } from "@/lib/session";
import KioskClientLayout from "./KioskClientLayout";

export default async function KioskLayout({ children }: { children: React.ReactNode }) {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;
  const kanaOrder = kanaKeyboardOrderForLoginId(session?.loginId);

  return <KioskClientLayout kanaOrder={kanaOrder}>{children}</KioskClientLayout>;
}
