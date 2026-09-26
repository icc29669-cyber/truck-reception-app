import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => {
  process.env.BERTH_API_URL = "";
  process.env.BERTH_KIOSK_SECRET = "";
  return { findMany: vi.fn(), auth: vi.fn(), center: vi.fn() };
});
vi.mock("@/lib/prisma", () => ({ prisma: { reservation: { findMany: mocks.findMany } } }));
vi.mock("@/lib/auth", () => ({ verifyKioskSecret: mocks.auth }));
vi.mock("@/lib/centerCache", () => ({ getCenterCached: mocks.center }));
import { GET } from "./route";

beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-26T00:00:00Z"));
  mocks.auth.mockReturnValue(null);
  mocks.findMany.mockResolvedValue([{
    id: 1, startTime: "10:00", endTime: "11:00", driverName: "", companyName: "", vehicleNumber: "品川 100 あ 1234", maxLoad: "2000",
    plateRegion: "", plateClassNum: "", plateHira: "", plateNumber: "", status: "pending", driver: { name: "テスト運転手", companyName: "テスト運送" },
  }]);
});
afterEach(() => vi.useRealTimers());

describe("旧ドライバー予約の電話検索", () => {
  it("電話空欄のみDriverの電話で検索し、センター・当日・ステータスを限定", async () => {
    const response = await GET(new NextRequest("http://localhost/api/reception/lookup-reservation?phone=09012345678&centerId=2"));
    expect(response.status).toBe(200);
    const where = mocks.findMany.mock.calls[0][0].where;
    expect(where).toMatchObject({
      OR: [{ phone: "09012345678" }, { phone: "", driver: { is: { phone: "09012345678" } } }],
      centerId: 2, status: { notIn: ["completed", "cancelled", "no_show"] },
    });
    expect(where.reservationDate.gte.toISOString()).toBe("2026-09-25T15:00:00.000Z");
    expect(where.reservationDate.lte.toISOString()).toBe("2026-09-26T14:59:59.999Z");
    expect((await response.json())[0]).toMatchObject({ driverName: "テスト運転手", companyName: "テスト運送", plateRegion: "品川", plateClassNum: "100", plateHira: "あ", plateNumber: "1234" });
  });
  it("保存済みプレート項目を優先する", async () => {
    const row = (await mocks.findMany())[0];
    mocks.findMany.mockResolvedValue([{ ...row, plateNumber: "5678" }]);
    const response = await GET(new NextRequest("http://localhost/api/reception/lookup-reservation?phone=09012345678&centerId=2"));
    expect((await response.json())[0].plateNumber).toBe("5678");
  });
});
