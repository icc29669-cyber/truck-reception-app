"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RegionPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/kiosk/plate/kana");
  }, [router]);
  return null;
}
