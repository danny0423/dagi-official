// 刪除範例資料（npm run db:clear:samples）：npm run db:seed:samples 建立的內容、收件匣與圖片（含儲存區的實體檔）。
// 只刪符合 lib/sample-data.ts 規則的資料（標題／名稱以【範例】開頭等），其他資料、帳號、公司資料都不動。上線前一定要執行。
import "dotenv/config";
import { countSampleData, totalSampleCount } from "../lib/sample-data";
import { clearSamples, createScriptPrisma, databaseLabel, printCacheReminder, printClearResult } from "./samples-lib";

const prisma = createScriptPrisma();

async function main() {
  console.log(`資料庫：${databaseLabel()}`);
  const result = await clearSamples(prisma);
  printClearResult(result);

  const left = await countSampleData(prisma);
  const total = totalSampleCount(left);
  if (total === 0) {
    console.log("・資料庫裡已經沒有範例資料");
  } else {
    // 只有「還被非範例內容使用的範例圖片」會留下來（上面已列出）
    console.log(`・還剩 ${total} 筆範例資料（圖片 ${left.media} 張），原因見上方`);
  }
  printCacheReminder();
}

main()
  .catch((error) => {
    console.error("範例資料清除失敗：", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
