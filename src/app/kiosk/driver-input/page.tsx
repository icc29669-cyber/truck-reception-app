"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DriverInputRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/kiosk/name-input");
  }, [router]);
  return null;
}
