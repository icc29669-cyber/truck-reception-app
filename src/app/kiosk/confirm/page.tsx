"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// このページは新しいフローに統合されました
export default function ConfirmPage() {
  const router = useRouter();
  useEffect(() => { router.replace("/kiosk/final-confirm"); }, [router]);
  return null;
}
