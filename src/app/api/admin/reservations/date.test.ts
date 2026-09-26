import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({ findMany: vi.fn(), create: vi.fn(), update: vi.fn(), center: vi.fn(), setting: vi.fn(), holiday: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: { reservation: { findMany: mocks.findMany, create: mocks.create, update: mocks.update }, center: { findUnique: mocks.center }, holiday: { findUnique: mocks.holiday } },
  getOrCreateSetting: mocks.setting,
}));
import { GET, POST } from "./route";
import { PUT } from "./[id]/route";
import { GET as getBerths } from "../../driver/berths/route";

const date = "2026-09-26";
beforeEach(() => {
  vi.resetAllMocks();
  mocks.findMany.mockResolvedValue([]);
  mocks.create.mockImplementation(async ({ data }) => ({ id: 1, ...data }));
  mocks.update.mockImplementation(async ({ data }) => ({ id: 1, ...data }));
  mocks.center.mockResolvedValue({ id: 2, breaks: "[]", closeTime: "18:00" });
  mocks.setting.mockResolvedValue({ maxReservationsPerSlot: 3 });
  mocks.holiday.mockResolvedValue(null);
});

describe("管理画面と空き枠の予約日", () => {
  it.each(["admin", "berths"])("%s の当日検索に翌日分が入らない", async (route) => {
    const response = await (route === "admin" ? GET : getBerths)(new NextRequest(`http://localhost/api?date=${date}&centerId=2`));
    expect(response.status).toBe(200);
    const where = mocks.findMany.mock.calls[0][0].where;
    expect(where.centerId).toBe(2);
    expect(where.reservationDate.gte.toISOString()).toBe("2026-09-25T15:00:00.000Z");
    expect(where.reservationDate.lte.toISOString()).toBe("2026-09-26T14:59:59.999Z");
  });
  it("管理者の登録と変更はJST0時で保存する", async () => {
    const body = { centerId: 2, reservationDate: date, startTime: "10:00", endTime: "11:00" };
    const post = await POST(new NextRequest("http://localhost/api", { method: "POST", body: JSON.stringify(body) }));
    const put = await PUT(new NextRequest("http://localhost/api", { method: "PUT", body: JSON.stringify(body) }), { params: { id: "1" } });
    expect(post.status).toBe(201);
    expect(put.status).toBe(200);
    expect((await post.json()).reservationDate).toBe("2026-09-25T15:00:00.000Z");
    expect((await put.json()).reservationDate).toBe("2026-09-25T15:00:00.000Z");
  });
  it.each(["admin", "berths"])("%s で2月30日は検索しない", async (route) => {
    const response = await (route === "admin" ? GET : getBerths)(new NextRequest("http://localhost/api?date=2026-02-30&centerId=2"));
    expect(response.status).toBe(400);
    expect(mocks.findMany).not.toHaveBeenCalled();
  });
});
