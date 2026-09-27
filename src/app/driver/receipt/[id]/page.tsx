import { redirect } from "next/navigation";

/** 統合前の受付票URL。現在の案内へ移し、古い認証キーは引き継がない。 */
export default function LegacyReceiptPage() {
  redirect("/driver/my-reservations");
}
