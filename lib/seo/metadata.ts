import type { Metadata } from "next";
import { isLaunched, launchPreviewEnabled } from "@/lib/launch";
import { isAdminPreview } from "@/lib/preview";

// 全站共用的 Open Graph 設定，只放在 app/layout.tsx（siteName 是資料庫的公司名稱）。
// 這裡刻意不放 title、description、url，各頁也不要自己設定 openGraph：
//   - 頁面沒設定 openGraph 時，Next 會把該頁的 title、description 自動帶進 og:title、og:description
//   - metadata 是淺層合併，頁面一設定 openGraph 就會整個覆蓋，連 app/(site)/opengraph-image.tsx 產生的分享圖也會消失
export function siteOpenGraph(siteName: string) {
  return {
    siteName,
    locale: "zh_TW",
    type: "website",
  } satisfies Metadata["openGraph"];
}

/**
 * 顯示 404 時的 metadata。頁面呼叫 notFound() 時，Next 仍會套用該頁 export 的 metadata，
 * 所以會回 404 的情況（未開放頁面在正式環境、找不到的單案網址）要改用這個，
 * 不然 404 畫面的標題會是原本那頁的標題（甚至是【待填】字樣）。app/not-found.tsx 也用它。
 * 不用設 robots：回 404 的頁面 Next 會自動加上 noindex。
 */
export const notFoundMetadata: Metadata = {
  title: "找不到頁面",
};

/**
 * 前台每一頁的 metadata：標題、給搜尋結果看的描述、canonical。
 * description 只能寫頁面上已經有、而且不是待填的內容，不可以補造事實（AGENTS.md）。
 * 要 await：會查登入狀態（lib/preview.ts）。
 */
export async function pageMetadata({ path, title, description }: {
  /** 這一頁的正式網址路徑，例如 "/about/license" */
  path: string;
  title: Metadata["title"];
  description: string;
}): Promise<Metadata> {
  const launched = isLaunched(path);
  const preview = await isAdminPreview();
  // 未開放的頁面在正式環境，訪客會看到 404（requireLaunched），標題與描述也要跟著是 404 的
  if (!launched && !launchPreviewEnabled && !preview) return notFoundMetadata;
  return {
    title,
    description,
    alternates: { canonical: path },
    // noindex：未開放頁面（開發環境預覽、登入者預覽），以及登入者看到的任何前台頁（可能含未上架內容，lib/preview.ts）
    ...(launched && !preview ? {} : { robots: { index: false, follow: false } }),
  };
}
