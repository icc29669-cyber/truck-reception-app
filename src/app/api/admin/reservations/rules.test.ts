import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
const m = vi.hoisted(() => ({ findUnique: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn(), session: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { reservation: { findUnique: m.findUnique, update: m.update, delete: m.delete }, reception: { count: m.count } } }));
vi.mock("@/lib/driverAuth", () => ({ getSession: m.session }));
import { PUT, DELETE } from "./[id]/route";
import { PATCH } from "../../driver/reservations/[id]/route";

const current = { id: 1, driverId: 2, status: "pending", updatedAt: new Date("2026-09-26"), reservationDate: new Date("2026-09-25T15:00:00Z"), startTime: "10:00", endTime: "11:00", plateRegion: "品川", plateClassNum: "100", plateHira: "あ", plateNumber: "1234", vehicleNumber: "品川 100 あ 1234" };
const request = (body: unknown) => new NextRequest("http://localhost/api", { method: "PUT", body: JSON.stringify(body) });
beforeEach(() => {
  vi.resetAllMocks(); m.findUnique.mockResolvedValue(current); m.update.mockImplementation(async ({ data }) => ({ ...current, ...data }));
  m.session.mockResolvedValue({ id: 2, isAdmin: true }); m.count.mockResolvedValue(1);
});
describe("予約編集・取消の実API契約", () => {
  it.each([{ startTime: "12:00" }, { endTime: "09:00" }, { startTime: "25:00" }, { endTime: null }, { startTime: 10 }])("部分更新 %j を保存前に拒否", async body => {
    expect((await PUT(request(body), { params: { id: "1" } })).status).toBe(400);
    expect((await PATCH(request(body), { params: Promise.resolve({ id: "1" }) })).status).toBe(400);
    expect(m.update).not.toHaveBeenCalled();
  });
  it.each(["checked_in", "completed", "no_show"])("ドライバーによる%sの取消を拒否", async status => {
    m.findUnique.mockResolvedValue({ ...current, status }); m.session.mockResolvedValue({ id: 2, isAdmin: false });
    expect((await PATCH(request({ status: "cancelled" }), { params: Promise.resolve({ id: "1" }) })).status).toBe(409);
    expect(m.update).not.toHaveBeenCalled();
  });
  it("受付紐付け済みの完了予約をDELETE経由でも取り消せない", async () => {
    m.findUnique.mockResolvedValue({ ...current, status: "completed" });
    expect((await DELETE(request({}), { params: { id: "1" } })).status).toBe(409);
    expect(m.update).not.toHaveBeenCalled(); expect(m.delete).not.toHaveBeenCalled();
  });
  it("confirmed旧データを正規化し、読取後の競合を409にする", async () => {
    m.findUnique.mockResolvedValue({ ...current, status: "confirmed" });
    const res = await PUT(request({ status: "pending", plateNumber: "5678" }), { params: { id: "1" } });
    expect(res.status).toBe(200); expect((await res.json()).vehicleNumber).toBe("品川 100 あ 5678");
    expect(m.update.mock.calls[0][0].where).toMatchObject({ id: 1, status: "confirmed", updatedAt: current.updatedAt });
    m.update.mockRejectedValue(new Prisma.PrismaClientKnownRequestError("changed", { code: "P2025", clientVersion: "5.22.0" }));
    expect((await PUT(request({ status: "cancelled" }), { params: { id: "1" } })).status).toBe(409);
  });
});
