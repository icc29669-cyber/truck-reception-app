import type {
  ReceptionResult,
  DriverCandidate,
  VehicleCandidate,
  DriverInput,
  PlateInput,
} from "@/types/reception";
import { formatPlate as fmt } from "@/types/reception";

const BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";
const SECRET = process.env.NEXT_PUBLIC_KIOSK_SECRET ?? "";
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== "false";

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── モックデータ ────────────────────────────────────────

function mockLookupByPhone(phone: string): {
  drivers: DriverCandidate[];
  vehicles: VehicleCandidate[];
} {
  if (phone.startsWith("090")) {
    return {
      drivers: [
        { id: 1, name: "モウリ ケイイチ", companyName: "ニホンセイフティー", phone },
        { id: 2, name: "モウリ ケイイチ", companyName: "ミクニランテック", phone },
        { id: 3, name: "ヨコタ ケイコ", companyName: "ファルマンウンユ", phone },
        { id: 4, name: "ノゾエ マドカ", companyName: "ショーキ", phone },
        { id: 5, name: "ワタナベ カズユキ", companyName: "シンニホンコンツウ", phone },
      ],
      vehicles: [
        {
          id: 1,
          vehicleNumber: "多摩 500 あ 7917",
          plate: { region: "多摩", classNum: "500", hira: "あ", number: "7917" },
          maxLoad: "13000",
        },
        {
          id: 2,
          vehicleNumber: "多摩 500 あ 1234",
          plate: { region: "多摩", classNum: "500", hira: "あ", number: "1234" },
          maxLoad: "5000",
        },
        {
          id: 3,
          vehicleNumber: "富山 300 ま 7983",
          plate: { region: "富山", classNum: "300", hira: "ま", number: "7983" },
          maxLoad: "2000",
        },
      ],
    };
  }
  if (phone.startsWith("080")) {
    return {
      drivers: [
        { id: 6, name: "タナカ イチロウ", companyName: "オオサカウンソウ", phone },
        { id: 7, name: "サトウ ハナコ", companyName: "テストブツリュウ", phone },
      ],
      vehicles: [],
    };
  }
  return { drivers: [], vehicles: [] };
}

function mockRegister(params: {
  phone: string;
  centerId: number;
  plate: PlateInput;
  driverInput: DriverInput;
}): ReceptionResult {
  return {
    id: 999,
    centerDailyNo: 42,
    arrivedAt: new Date().toISOString(),
    waitingCount: 15,
    driver: {
      name: params.driverInput.driverName,
      companyName: params.driverInput.companyName,
      phone: params.phone,
    },
    vehicleNumber: fmt(params.plate),
    centerName: "だんじり機材センター",
  };
}

// ─── API ────────────────────────────────────────────────

function headers() {
  return {
    "Content-Type": "application/json",
    "X-Kiosk-Secret": SECRET,
  };
}

export async function lookupByPlate(
  plateStr: string,
  centerId: number
): Promise<DriverCandidate[]> {
  if (USE_MOCK) {
    await delay(600);
    if (plateStr.includes("7917")) {
      return [
        { id: 1, name: "山田 太郎", companyName: "サンプル運輸株式会社", phone: "09012345678" },
      ];
    }
    if (plateStr.includes("1234")) {
      return [
        { id: 2, name: "鈴木 次郎", companyName: "テスト物流株式会社", phone: "08012345678" },
        { id: 3, name: "佐藤 三郎", companyName: "サンプル運輸株式会社", phone: "07012345678" },
      ];
    }
    return [];
  }
  const res = await fetch(
    `${BASE}/api/reception/lookup-plate?plate=${encodeURIComponent(plateStr)}&centerId=${centerId}`,
    { headers: headers() }
  );
  if (!res.ok) return [];
  return res.json();
}

export async function lookupByPhone(
  phone: string,
  centerId: number
): Promise<{ drivers: DriverCandidate[]; vehicles: VehicleCandidate[] }> {
  if (USE_MOCK) {
    await delay(600);
    return mockLookupByPhone(phone);
  }
  const res = await fetch(
    `${BASE}/api/reception/lookup-phone?phone=${encodeURIComponent(phone)}&centerId=${centerId}`,
    { headers: headers() }
  );
  if (!res.ok) return { drivers: [], vehicles: [] };
  return res.json();
}

export async function registerReception(params: {
  phone: string;
  centerId: number;
  plate?: PlateInput;
  driverInput?: DriverInput;
  driverData?: DriverInput;
}): Promise<ReceptionResult> {
  const normalizedParams = {
    phone: params.phone,
    centerId: params.centerId,
    plate: params.plate ?? { region: "", classNum: "", hira: "", number: "" },
    driverInput: params.driverInput ?? params.driverData ?? { companyName: "", driverName: "", phone: params.phone, maxLoad: "" },
  };
  if (USE_MOCK) {
    await delay(800);
    return mockRegister(normalizedParams);
  }
  const res = await fetch(`${BASE}/api/reception/register`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(normalizedParams),
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
      { id: 1, name: "だんじり機材センター" },
      { id: 2, name: "狭山機材センター" },
    ];
  }
  const res = await fetch(`${BASE}/api/centers`);
  if (!res.ok) return [];
  return res.json();
}
