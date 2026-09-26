import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(), checkAdminAuth: vi.fn(), findUnique: vi.fn(), findMany: vi.fn(),
  findFirst: vi.fn(), count: vi.fn(), create: vi.fn(), driver: vi.fn(),
  center: vi.fn(), setting: vi.fn(), transaction: vi.fn(),
}));
vi.mock("@/lib/driverAuth", () => ({ getSession: mocks.getSession }));
vi.mock("@/lib/adminAuth", () => ({ checkAdminAuth: mocks.checkAdminAuth }));
vi.mock("@/lib/prisma", () => ({ prisma: {
  reservation: { findUnique: mocks.findUnique, findMany: mocks.findMany, findFirst: mocks.findFirst, count: mocks.count, create: mocks.create },
  driver: { findUnique: mocks.driver }, center: { findUnique: mocks.center },
  appSetting: { findFirst: mocks.setting }, $transaction: mocks.transaction,
} }));
import { GET, POST } from "./route";

const session = { id: 42, name: "テスト運転手", companyName: "テスト運送" };
const body = {
  date: "2099-09-26", startTime: "10:00", endTime: "11:00", centerId: 2,
  vehicleNumber: "品川 100 あ 1234", maxLoad: "2000", driverName: "テスト運転手", companyName: "テスト運送",
  requestId: "reservation-request-0001",
};
const request = (payload: unknown = body) => new NextRequest("http://localhost/api/driver/reservations", { method: "POST", body: JSON.stringify(payload) });
let stored: Record<string, unknown> | null;

beforeEach(() => {
  vi.resetAllMocks();
  stored = null;
  mocks.getSession.mockResolvedValue(session);
  mocks.checkAdminAuth.mockResolvedValue(false);
  mocks.findUnique.mockImplementation(async () => stored);
  mocks.findFirst.mockResolvedValue(null);
  mocks.count.mockResolvedValue(0);
  mocks.driver.mockResolvedValue({ ...session, phone: "09012345678" });
  mocks.center.mockResolvedValue({ id: 2, code: "3101", name: "テストセンター" });
  mocks.setting.mockResolvedValue({ maxReservationsPerSlot: 3 });
  mocks.create.mockImplementation(async ({ data }) => {
    stored = { id: 501, ...data, status: "pending", driver: session, center: { id: 2 } };
    return stored;
  });
  mocks.transaction.mockImplementation(async (callback) => callback({
    reservation: { findUnique: mocks.findUnique, findFirst: mocks.findFirst, count: mocks.count, create: mocks.create },
    driver: { findUnique: mocks.driver },
  }));
});

describe("ドライバー予約の受付連携・再送", () => {
  it("電話番号、プレート4項目、JST予約日を保存し、返却日がずれない", async () => {
    const response = await POST(request());
    expect(response.status).toBe(201);
    expect(stored).toMatchObject({ phone: "09012345678", plateRegion: "品川", plateClassNum: "100", plateHira: "あ", plateNumber: "1234" });
    expect((stored!.reservationDate as Date).toISOString()).toBe("2099-09-25T15:00:00.000Z");
    expect(await response.json()).toMatchObject({ id: 501, date: "2099-09-26" });
  });
  it("応答紛失後の同じリクエストは同じ予約を返し、登録は1件", async () => {
    await POST(request());
    const replay = await POST(request());
    expect(replay.status).toBe(200);
    expect((await replay.json()).id).toBe(501);
    expect(mocks.create).toHaveBeenCalledTimes(1);
  });
  it("同じ送信番号の内容変更は409で、元の予約は変更しない", async () => {
    await POST(request());
    expect((await POST(request({ ...body, startTime: "10:30" }))).status).toBe(409);
    expect(mocks.create).toHaveBeenCalledTimes(1);
  });
  it("別ドライバーが送信番号を再利用しても予約情報を返さない", async () => {
    await POST(request());
    mocks.getSession.mockResolvedValue({ ...session, id: 43 });
    const response = await POST(request());
    expect(response.status).toBe(409);
    expect(await response.json()).not.toHaveProperty("id");
  });
  it("同時送信のunique競合でも先に保存された予約を返す", async () => {
    mocks.transaction.mockImplementationOnce(async (callback) => {
      await callback({ reservation: { findUnique: mocks.findUnique, findFirst: mocks.findFirst, count: mocks.count, create: mocks.create }, driver: { findUnique: mocks.driver } });
      throw new Prisma.PrismaClientKnownRequestError("unique", { code: "P2002", clientVersion: "5.22" });
    });
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect((await response.json()).id).toBe(501);
    expect(mocks.create).toHaveBeenCalledTimes(1);
  });
  it("Serializable競合後は再判定して予約を保存する", async () => {
    mocks.transaction.mockRejectedValueOnce(new Prisma.PrismaClientKnownRequestError("retry", { code: "P2034", clientVersion: "5.22" }));
    expect((await POST(request())).status).toBe(201);
    expect(mocks.transaction).toHaveBeenCalledTimes(2);
    expect(mocks.create).toHaveBeenCalledTimes(1);
  });
  it("定員・重複の検索はUTC/JST両方を含む24時間で行う", async () => {
    await POST(request());
    const range = mocks.count.mock.calls[0][0].where.reservationDate;
    expect(range.gte.toISOString()).toBe("2099-09-25T15:00:00.000Z");
    expect(range.lte.toISOString()).toBe("2099-09-26T14:59:59.999Z");
    expect(mocks.findFirst.mock.calls[0][0].where.reservationDate).toEqual(range);
  });
  it("別の送信番号でも同じ日時の予約は重複登録しない", async () => {
    mocks.findFirst.mockResolvedValue({ id: 500 });
    expect((await POST(request())).status).toBe(409);
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it("満車では登録しない", async () => {
    mocks.count.mockResolvedValue(3);
    expect((await POST(request())).status).toBe(409);
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it("過去日付になった後の再送も保存済みの同じ予約を返す", async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2099-09-26T00:00:00Z"));
      await POST(request());
      vi.setSystemTime(new Date("2099-09-27T00:00:00Z"));
      expect((await POST(request())).status).toBe(200);
      expect(mocks.create).toHaveBeenCalledTimes(1);
    } finally { vi.useRealTimers(); }
  });
  it.each(["2099-02-30", "bad"])("無効な日付 %s ではDBを書かない", async (date) => {
    expect((await POST(request({ ...body, date }))).status).toBe(400);
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it("予約一覧の日付もJSTで表示する", async () => {
    mocks.findMany.mockResolvedValue([{ id: 1, reservationDate: new Date("2026-09-25T15:00:00Z") }, { id: 2, reservationDate: new Date("2026-09-26T00:00:00Z") }]);
    const response = await GET(new NextRequest("http://localhost/api/driver/reservations?mine=true"));
    expect((await response.json()).map((r: { date: string }) => r.date)).toEqual(["2026-09-26", "2026-09-26"]);
  });
});
