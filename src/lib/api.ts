import type { LookupResult, ReceptionResult, DriverInput } from "@/types/reception";

const BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";
const SECRET = process.env.NEXT_PUBLIC_KIOSK_SECRET ?? "";

function headers() {
  return {
    "Content-Type": "application/json",
    "X-Kiosk-Secret": SECRET,
  };
}

export async function lookupDriver(
  phone: string,
  centerId: number
): Promise<LookupResult> {
  const res = await fetch(
    `${BASE}/api/reception/lookup?phone=${encodeURIComponent(phone)}&centerId=${centerId}`,
    { headers: headers() }
  );
  if (!res.ok) throw new Error("通信エラーが発生しました");
  return res.json();
}

export async function registerReception(params: {
  phone: string;
  centerId: number;
  reservationId?: number;
  driverData: DriverInput;
}): Promise<ReceptionResult> {
  const res = await fetch(`${BASE}/api/reception/register`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? "受付処理に失敗しました");
  }
  return res.json();
}

export async function fetchCenters(): Promise<{ id: number; name: string }[]> {
  const res = await fetch(`${BASE}/api/centers`);
  if (!res.ok) return [];
  return res.json();
}
