import type { KioskSession } from "@/types/reception";

const KEY = "kiosk_session";

const DEFAULT: KioskSession = {
  centerId: 1,
  centerName: "",
  phone: "",
  plate: { region: "", classNum: "", hira: "", number: "" },
  driverInput: { companyName: "", driverName: "", phone: "", maxLoad: "" },
  driverCandidates: [],
  selectedDriver: null,
  vehicleCandidates: [],
  selectedVehicle: null,
  receptionResult: null,
  reservationCandidates: [],
  selectedReservation: null,
};

export function getKioskSession(): KioskSession {
  if (typeof window === "undefined") return { ...DEFAULT };
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT,
      ...parsed,
      plate: { ...DEFAULT.plate, ...(parsed.plate ?? {}) },
      driverInput: { ...DEFAULT.driverInput, ...(parsed.driverInput ?? {}) },
    };
  } catch {
    return { ...DEFAULT };
  }
}

export function setKioskSession(partial: Partial<KioskSession>): void {
  if (typeof window === "undefined") return;
  const current = getKioskSession();
  sessionStorage.setItem(KEY, JSON.stringify({ ...current, ...partial }));
}

export function clearKioskSession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(KEY);
}
