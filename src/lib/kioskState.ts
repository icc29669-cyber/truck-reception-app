import type { KioskSession } from "@/types/reception";

const KEY = "kiosk_session";

export function getKioskSession(): KioskSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setKioskSession(partial: Partial<KioskSession>): void {
  if (typeof window === "undefined") return;
  const current = getKioskSession() ?? {
    centerId: Number(process.env.NEXT_PUBLIC_CENTER_ID ?? 1),
    centerName: "",
    phone: "",
    lookupResult: null,
    driverInput: { companyName: "", driverName: "", vehicleNumber: "" },
    receptionResult: null,
  };
  sessionStorage.setItem(KEY, JSON.stringify({ ...current, ...partial }));
}

export function clearKioskSession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(KEY);
}
