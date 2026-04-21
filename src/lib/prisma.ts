import { PrismaClient } from "@prisma/client";

// Next.js dev環境のホットリロードで複数インスタンスが生成されないようにシングルトン化
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// Neon PostgreSQLのコールドスタート対策: connect_timeout追加
function buildDatasourceUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url) return undefined;
  const sep = url.includes("?") ? "&" : "?";
  if (!url.includes("connect_timeout")) {
    return `${url}${sep}connect_timeout=30`;
  }
  return url;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error"] : ["error"],
    datasourceUrl: buildDatasourceUrl(),
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// アプリ設定 (berth 互換): 1行のみ、未存在なら作成
export async function getOrCreateSetting() {
  let setting = await prisma.appSetting.findFirst();
  if (!setting) {
    setting = await prisma.appSetting.create({
      data: {
        slotDurationMinutes: 60,
        openTime: "08:00",
        closeTime: "18:00",
        maxReservationsPerSlot: 3,
      },
    });
  }
  return setting;
}
