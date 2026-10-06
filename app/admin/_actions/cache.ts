"use server";

import { revalidatePath, updateTag } from "next/cache";
import { authorizeAction } from "@/lib/admin/guard";
import { success, type ActionState } from "@/lib/admin/action-state";
import { SITE_TAGS } from "@/lib/site-data/tags";

// 重新整理前台快取（儀表板的按鈕，只有 ADMIN 能用）。
// 後台存檔時各 server action 會自己呼叫 updateTag；但有人不經後台直接改資料庫（例如 npm run db:seed:samples、
// 手動下 SQL）時網站不會知道，前台資料快取最久 1 小時（lib/site-data/index.ts 的 REVALIDATE_SECONDS）才更新。
// 這裡讓所有前台資料快取立即失效，下一個請求就讀到資料庫的最新資料。
export async function refreshSiteCache(): Promise<ActionState> {
  const auth = await authorizeAction("ADMIN");
  if (!auth.ok) return auth.state;
  for (const tag of Object.values(SITE_TAGS)) updateTag(tag);
  // 整站（前台頁面與後台）的路由快取一起清掉
  revalidatePath("/", "layout");
  return success("已重新整理，前台下一次開啟就會讀到最新資料");
}
