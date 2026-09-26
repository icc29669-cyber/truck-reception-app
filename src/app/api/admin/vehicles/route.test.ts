import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const vehicle = vi.hoisted(() => ({ findMany: vi.fn(), count: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { vehicle } }));
import { GET } from "./route";

describe("vehicle pagination", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vehicle.findMany.mockResolvedValue([{ id: 1, vehicleNumber: "多摩 100 あ 1234", receptions: [] }]);
    vehicle.count.mockResolvedValue(44730);
  });

  it("bounds an unfiltered list and retains the array response", async () => {
    const response = await GET(new NextRequest("http://localhost/api/admin/vehicles"));
    expect(response.status).toBe(200);
    expect(response.headers.get("X-Total-Count")).toBe("44730");
    expect(response.headers.get("X-Page-Size")).toBe("100");
    expect(vehicle.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 100, skip: 0 }));
    expect(await response.json()).toEqual([{ id: 1, vehicleNumber: "多摩 100 あ 1234", lastReceptionAt: null }]);
  });

  it("queries the requested page in a stable order", async () => {
    await GET(new NextRequest("http://localhost/api/admin/vehicles?page=448"));
    expect(vehicle.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 100, skip: 44700, orderBy: { id: "asc" } }));
  });

  it("uses the same search filter for results and total", async () => {
    await GET(new NextRequest("http://localhost/api/admin/vehicles?search=1234&page=2"));
    const filter = vehicle.findMany.mock.calls[0][0].where;
    expect(filter.isActive).toBe(true);
    expect(filter.OR).toContainEqual({ number: { contains: "1234" } });
    expect(vehicle.count).toHaveBeenCalledWith({ where: filter });
  });

  it.each(["0", "-1", "1.5", "NaN", "Infinity", "1000001"])("rejects invalid page %s before querying", async (page) => {
    const response = await GET(new NextRequest("http://localhost/api/admin/vehicles?page=" + page));
    expect(response.status).toBe(400);
    expect(vehicle.findMany).not.toHaveBeenCalled();
    expect(vehicle.count).not.toHaveBeenCalled();
  });
});
