import { cookies } from "next/headers";
import { kioskInputOrderForLoginId } from "@/lib/kioskInputOrder";
import { SESSION_COOKIE, verifySession } from "@/lib/session";
import KioskClientLayout from "./KioskClientLayout";

export default async function KioskLayout({ children }: { children: React.ReactNode }) {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;
  const inputOrder = kioskInputOrderForLoginId(session?.loginId);

  return <KioskClientLayout inputOrder={inputOrder}>{children}</KioskClientLayout>;
}
