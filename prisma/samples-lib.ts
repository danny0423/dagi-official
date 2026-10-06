// 範例資料腳本（prisma/seed-samples.ts、prisma/clear-samples.ts）共用：資料庫連線、清除範例資料。
// 哪些資料算「範例」的規則在 lib/sample-data.ts（後台儀表板也用同一份），這裡只照著刪，不另外判斷。
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "../lib/generated/prisma/client";
import { sampleWhere } from "../lib/sample-data";
import { getStorage } from "../lib/storage";

export function createScriptPrisma(): PrismaClient {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
}

function databaseUrl(): URL | null {
  try {
    return new URL(process.env.DATABASE_URL ?? "");
  } catch {
    return null;
  }
}

/** 印在畫面上確認連到哪個資料庫（不含帳密） */
export function databaseLabel(): string {
  const url = databaseUrl();
  return url ? `${url.host}${url.pathname}` : "（DATABASE_URL 未設定或格式錯誤）";
}

export function isLocalDatabase(): boolean {
  const host = databaseUrl()?.hostname;
  return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
}

export type ClearResult = {
  /** 各種內容刪掉的筆數 */
  content: Record<string, number>;
  /** 刪掉的範例圖片（資料庫＋儲存區的檔案） */
  media: number;
  /** 還被非範例內容引用、所以保留的範例圖片 */
  keptMedia: { id: number; originalName: string | null }[];
};

const isPrismaError = (error: unknown, code: string) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;

/**
 * 刪除所有範例資料與範例圖片（含儲存區的實體檔），其他資料不動。
 * 1. 內容與收件匣在同一個交易裡刪，任何一步失敗就全部不刪。工程實績的圖庫關聯（project_images）跟著工程一起刪。
 * 2. 範例圖片逐張刪：先刪資料庫再刪檔案（同後台媒體庫）。還被其他內容引用的（例如有人把範例圖片選進真的工程）
 *    資料庫會用 Restrict 擋下，這裡先檢查、保留並列出，不會連帶刪掉或改到那筆內容。
 */
export async function clearSamples(prisma: PrismaClient): Promise<ClearResult> {
  const content = await prisma.$transaction(async (tx) => ({
    工程實績: (await tx.project.deleteMany({ where: sampleWhere.project })).count,
    最新消息: (await tx.news.deleteMany({ where: sampleWhere.news })).count,
    職缺: (await tx.job.deleteMany({ where: sampleWhere.job })).count,
    團隊成員: (await tx.teamMember.deleteMany({ where: sampleWhere.teamMember })).count,
    證照: (await tx.certification.deleteMany({ where: sampleWhere.certification })).count,
    工程洽詢: (await tx.inquiry.deleteMany({ where: sampleWhere.inquiry })).count,
    協力廠商登記: (await tx.vendorApplication.deleteMany({ where: sampleWhere.vendorApplication })).count,
  }));

  const candidates = await prisma.media.findMany({
    where: sampleWhere.media,
    orderBy: { id: "asc" },
    select: {
      id: true,
      storageKey: true,
      originalName: true,
      _count: {
        select: { projectCovers: true, projectGallery: true, newsCovers: true, teamPhotos: true, certificationImages: true },
      },
    },
  });

  const storage = getStorage();
  const keptMedia: ClearResult["keptMedia"] = [];
  let media = 0;
  for (const item of candidates) {
    const keep = { id: item.id, originalName: item.originalName };
    if (Object.values(item._count).some((count) => count > 0)) {
      keptMedia.push(keep);
      continue;
    }
    try {
      // where 再帶一次範例條件：就算上面查完到這裡之間資料被改過，也只會刪到範例圖片
      await prisma.media.delete({ where: { id: item.id, ...sampleWhere.media } });
    } catch (error) {
      if (isPrismaError(error, "P2025")) continue; // 已經被刪掉，或已不符合範例條件
      if (isPrismaError(error, "P2003")) {
        keptMedia.push(keep); // 檢查完到刪除之間剛好被引用
        continue;
      }
      throw error;
    }
    await storage.delete(item.storageKey);
    media += 1;
  }

  return { content, media, keptMedia };
}

export function printClearResult(result: ClearResult): void {
  const parts = Object.entries(result.content).map(([label, count]) => `${label} ${count}`);
  console.log(`・已刪除範例資料：${parts.join("、")}、圖片 ${result.media} 張`);
  if (result.keptMedia.length > 0) {
    console.log(`・有 ${result.keptMedia.length} 張範例圖片還被其他（非範例）內容使用，已保留：`);
    for (const item of result.keptMedia) console.log(`    #${item.id} ${item.originalName ?? ""}`);
    console.log("  到後台媒體庫查看是哪筆內容在用，換掉圖片後再執行一次 npm run db:clear:samples。");
  }
}

export function printCacheReminder(): void {
  console.log(
    "・前台快取：腳本直接寫資料庫，不會通知網站更新。正式模式（next start）請登入後台，到儀表板按「重新整理前台快取」，" +
      "否則前台最久 1 小時後才會看到變化。",
  );
}
