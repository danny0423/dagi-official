import "server-only";
import { notFound } from "next/navigation";
import { getAdminUser } from "@/lib/admin/guard";
import { isLaunched, launchPreviewEnabled, type SitePath } from "@/lib/launch";

// 前台的「登入者預覽」：已登入後台的人（ADMIN、EDITOR 都算）在前台可以看到訪客看不到的東西，方便上架前確認。
//   1. 未開放的頁面（lib/launch.ts 的 launched: false）：正式環境訪客 404，登入者照常顯示，頁面頂部有預覽橫幅
//   2. 未上架、未同意公開、已過期的內容：列表與單頁一起顯示，每一筆加標籤（查詢在 lib/site-data/preview.ts）
//   3. 登入者看到的前台頁一律 noindex（lib/seo/metadata.ts 的 pageMetadata）；爬蟲不會登入，不影響 SEO
//
// 判斷一律用伺服器端驗證過的 session（getAdminUser() 會查資料庫確認 session 有效、帳號未停用），不是只看 cookie 在不在。
// 沒有 session cookie 的訪客在 getCurrentSession() 就回 null，不會多查資料庫；同一個請求只查一次（React cache）。
// 會讀 cookie，所以頁面是每次請求才產生（前台頁面本來就是），登入者看到的 HTML 不會被快取給別人。
// 注意：不要在 unstable_cache 包住的函式裡呼叫，預覽資料也不能寫進公開快取。

/** 目前的請求是不是已登入後台的人（可以看預覽）。 */
export async function isAdminPreview(): Promise<boolean> {
  return (await getAdminUser()) !== null;
}

/**
 * 放在每個前台 page 的最前面（await requireLaunched("/路徑")）：
 * 頁面未開放時，正式環境的訪客看到 404；已登入後台的人照常顯示（預覽）。開發環境一律顯示（lib/launch.ts 的 launchPreviewEnabled）。
 * 子網址傳上層的路徑，例如 /projects/[slug] 傳 "/projects"。
 */
export async function requireLaunched(path: SitePath): Promise<void> {
  if (isLaunched(path) || launchPreviewEnabled) return;
  if (await isAdminPreview()) return;
  notFound();
}
