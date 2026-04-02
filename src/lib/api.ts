import type { LookupResult, ReceptionResult, DriverInput } from "@/types/reception";

const BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";
const SECRET = process.env.NEXT_PUBLIC_KIOSK_SECRET ?? "";
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

// ─── モックデータ ────────────────────────────────────────
// NEXT_PUBLIC_USE_MOCK=true のとき実際の API を呼ばずにダミーデータを返す

function mockLookup(phone: string): LookupResult {
  // 090 始まりは「予約あり」、それ以外は「予約なし」として動作確認
  if (phone.startsWith("090")) {
    return {
      driver: {
        id: 1,
        name: "山田 太郎",
        companyName: "サンプル運輸株式会社",
        defaultVehicle: "品川 あ 12-34",
        phone,
      },
      reservation: {
        id: 101,
        date: new Date().toISOString().slice(0, 10),
        startTime: "10:00",
        endTime: "10:30",
        vehicleNumber: "品川 あ 12-34",
        companyName: "サンプル運輸株式会社",
        driverName: "山田 太郎",
      },
    };
  }
  // 既存ドライバー（予約なし）
  if (phone.startsWith("080")) {
    return {
      driver: {
        id: 2,
        name: "鈴木 花子",
        companyName: "テスト物流",
        defaultVehicle: "大阪 か 56-78",
        phone,
      },
      reservation: null,
    };
  }
  // 初来場（DB にも存在しない）
  return { driver: null, reservation: null };
}

function mockRegister(params: {
  phone: string;
  centerId: number;
  reservationId?: number;
  driverData: DriverInput;
}): ReceptionResult {
  return {
    id: 999,
    centerDailyNo: 42,
    barcodeSeq: "00000042",
    barcodeValue: "043101260000042",
    arrivedAt: new Date().toISOString(),
    fiscalYear: "26",
    driver: {
      name: params.driverData.driverName,
      companyName: params.driverData.companyName,
      phone: params.phone,
    },
    vehicleNumber: params.driverData.vehicleNumber,
    reservation: params.reservationId
      ? { startTime: "10:00", endTime: "10:30" }
      : null,
    centerName: "狭山機材センター",
  };
}

// ─── 実 API / モック 切り替え ────────────────────────────

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
  if (USE_MOCK) {
    await delay(600);
    return mockLookup(phone);
  }
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
  if (USE_MOCK) {
    await delay(800);
    return mockRegister(params);
  }
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
  if (USE_MOCK) {
    await delay(300);
    return [
      { id: 1, name: "狭山機材センター" },
      { id: 2, name: "高槻機材センター" },
    ];
  }
  const res = await fetch(`${BASE}/api/centers`);
  if (!res.ok) return [];
  return res.json();
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
