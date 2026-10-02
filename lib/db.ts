import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";

// 開發模式熱重載時共用同一個連線，避免連線數一直增加。
// 但改 schema 跑 prisma generate 後 PrismaClient 類別會換新，這時要重建實例，
// 否則會沿用舊 schema 的 client（新資料表的 delegate 是 undefined）。
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient; prismaClass?: unknown };

function createPrismaClient() {
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });
}

export const prisma =
  globalForPrisma.prisma && globalForPrisma.prismaClass === PrismaClient
    ? globalForPrisma.prisma
    : createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaClass = PrismaClient;
}
