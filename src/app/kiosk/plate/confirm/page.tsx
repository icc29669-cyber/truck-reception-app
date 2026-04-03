"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PlateConfirmRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/kiosk/vehicle-select");
  }, [router]);
  return null;
}
