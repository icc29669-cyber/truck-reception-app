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
