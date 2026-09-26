import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";

const mocks = vi.hoisted(() => {
  process.env.BERTH_API_URL = "https://berth.test";
  process.env.BERTH_KIOSK_SECRET = "test-secret";
  return { transaction: vi.fn(), findUnique: vi.fn(), count: vi.fn(), waitUntil: vi.fn() };
});
vi.mock("@/lib/prisma", () => ({ prisma: { $transaction: mocks.transaction, reception: { findUnique: mocks.findUnique, count: mocks.count } } }));
vi.mock("@/lib/auth", () => ({ verifyKioskSecret: () => null }));
vi.mock("@/lib/rateLimit", () => ({ getClientIp: () => "test", hitRateLimit: () => false }));
vi.mock("@vercel/functions", () => ({ waitUntil: mocks.waitUntil }));
import { POST } from "./route";

type Row = Record<string, any>;
type State = { receptions: Row[]; drivers: Row[]; vehicles: Row[]; lastNo: number; reservationStatus: string };
let state: State;
let failReservationUpdate: boolean;
const center = { code: "3101", name: "検証センター" };

function request(overrides: Row = {}) {
  return new NextRequest("http://localhost/api/reception/register", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      requestId: "reception-test-00000001", phone: "08000000000", centerId: 1,
      plate: { region: "品川", classNum: "100", hira: "あ", number: "1234" },
      driverInput: { driverName: "テスト", companyName: "検証会社", maxLoad: "2000", phone: "08000000000" },
      ...overrides,
    }),
  });
}

beforeEach(() => {
  state = { receptions: [], drivers: [], vehicles: [], lastNo: 0, reservationStatus: "pending" };
  failReservationUpdate = false;
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
  mocks.count.mockRejectedValue(new Error("unused post-commit count failed"));
  mocks.findUnique.mockImplementation(async ({ where }) => {
    const saved = state.receptions.find((row) => row.requestId === where.requestId);
    return saved ? { ...saved, center, reservation: saved.reservationId ? { startTime: "10:00", endTime: "11:00" } : null } : null;
  });
  // 行ロックによる直列化と失敗時の全ロールバックを持つ、外部DB不要のテスト用transaction。
  let queue = Promise.resolve();
  mocks.transaction.mockImplementation(async (action) => {
    const previous = queue;
    let unlock!: () => void;
    queue = new Promise<void>((resolve) => { unlock = resolve; });
    await previous;
    const draft = structuredClone(state);
    const upsert = (rows: Row[]) => async ({ create }: Row) => {
      if (!rows.length) rows.push({ id: 1, ...create });
      return rows[0];
    };
    const tx = {
      center: { findUnique: async () => center },
      driver: { upsert: upsert(draft.drivers) }, vehicle: { upsert: upsert(draft.vehicles) },
      reservation: {
        findUnique: async () => ({ centerId: 1, startTime: "10:00", endTime: "11:00" }),
        updateMany: async () => {
          if (failReservationUpdate) throw new Error("reservation update failed");
          if (draft.reservationStatus !== "pending") return { count: 0 };
          draft.reservationStatus = "checked_in";
          return { count: 1 };
        },
      },
      reception: {
        aggregate: async () => ({ _max: { centerDailyNo: draft.receptions.length ? Math.max(...draft.receptions.map((row) => row.centerDailyNo)) : null } }),
        create: async ({ data }: Row) => {
          if (data.requestId && draft.receptions.some((row) => row.requestId === data.requestId)) {
            throw new Prisma.PrismaClientKnownRequestError("duplicate request", { code: "P2002", clientVersion: "test" });
          }
          const reception = { id: draft.receptions.length + 1, ...data };
          draft.receptions.push(reception);
          return reception;
        },
      },
      centerDailyCounter: {
        upsert: async ({ create }: Row) => ({ id: 1, lastNo: draft.lastNo ? ++draft.lastNo : (draft.lastNo = create.lastNo) }),
        update: async ({ data }: Row) => { draft.lastNo = data.lastNo; },
      },
    };
    try {
      const result = await action(tx);
      state = draft;
      return result;
    } finally { unlock(); }
  });
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("受付の再送と確定範囲", () => {
  it("応答を失った後の再送で同じ受付番号・日時を返し、採番も人物も車両も増やさない", async () => {
    const first = await (await POST(request({ reservationId: 10 }))).json();
    const replay = await (await POST(request({ reservationId: 10 }))).json();
    expect(replay).toEqual(first);
    expect(first.receptionNo).toMatch(/^883101\d{6}0001$/);
    expect(first.reservation).toEqual({ startTime: "10:00", endTime: "11:00" });
    expect(state.receptions).toHaveLength(1);
    expect(state.drivers).toHaveLength(1);
    expect(state.vehicles).toHaveLength(1);
    expect(state.lastNo).toBe(1);
    expect(mocks.count).not.toHaveBeenCalled();
  });
  it("同時に12回再送されても受付と採番は1件だけ確定する", async () => {
    const responses = await Promise.all(Array.from({ length: 12 }, () => POST(request())));
    expect(responses.every((response) => response.status === 200)).toBe(true);
    const results = await Promise.all(responses.map((response) => response.json()));
    expect(new Set(results.map((result) => result.receptionNo)).size).toBe(1);
    expect(state.receptions).toHaveLength(1);
    expect(state.lastNo).toBe(1);
  });
  it("同じ送信IDの内容差し替えは409で拒否する", async () => {
    await POST(request());
    expect((await POST(request({ centerId: 2 }))).status).toBe(409);
    expect(state.receptions).toHaveLength(1);
  });
  it("予約更新が失敗したら受付・採番・人物・車両も戻り、同じIDでやり直せる", async () => {
    failReservationUpdate = true;
    expect((await POST(request({ reservationId: 10 }))).status).toBe(500);
    expect(state).toEqual({ receptions: [], drivers: [], vehicles: [], lastNo: 0, reservationStatus: "pending" });
    failReservationUpdate = false;
    expect((await POST(request({ reservationId: 10 }))).status).toBe(200);
    expect(state.receptions).toHaveLength(1);
    expect(state.lastNo).toBe(1);
    expect(state.reservationStatus).toBe("checked_in");
  });
  it("別の送信IDでも受付済み予約を二重受付しない", async () => {
    await POST(request({ reservationId: 10 }));
    expect((await POST(request({ reservationId: 10, requestId: "another-request-0000002" }))).status).toBe(409);
    expect(state.receptions).toHaveLength(1);
    expect(state.lastNo).toBe(1);
  });
  it("外部通知の実行環境が利用不可でも確定した受付は200を返す", async () => {
    mocks.waitUntil.mockImplementation(() => { throw new Error("no waitUntil runtime"); });
    const response = await POST(request({ reservationId: 1000010, reservationSource: "berth" }));
    expect(response.status).toBe(200);
    expect(state.receptions).toHaveLength(1);
    expect(mocks.waitUntil).toHaveBeenCalledOnce();
  });
  it("不正なIDやJSON構造ではDBに書き込まない", async () => {
    expect((await POST(request({ requestId: "short" }))).status).toBe(400);
    expect((await POST(request({ plate: "invalid" }))).status).toBe(400);
    expect(state.receptions).toHaveLength(0);
  });
});
