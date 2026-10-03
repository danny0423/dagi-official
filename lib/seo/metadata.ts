import type { Metadata } from "next";
import { company } from "@/lib/placeholder-company";
import { isLaunched, launchPreviewEnabled } from "@/lib/launch";

// 全站共用的 Open Graph 設定，只放在 app/layout.tsx。
// 這裡刻意不放 title、description、url，各頁也不要自己設定 openGraph：
//   - 頁面沒設定 openGraph 時，Next 會把該頁的 title、description 自動帶進 og:title、og:description
//   - metadata 是淺層合併，頁面一設定 openGraph 就會整個覆蓋，連 app/(site)/opengraph-image.tsx 產生的分享圖也會消失
export const siteOpenGraph = {
  siteName: company.name,
  locale: "zh_TW",
  type: "website",
} satisfies Metadata["openGraph"];

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
 */
export function pageMetadata({ path, title, description }: {
  /** 這一頁的正式網址路徑，例如 "/about/license" */
  path: string;
  title: Metadata["title"];
  description: string;
}): Metadata {
  // 未開放的頁面在正式環境會回 404（requireLaunched），標題與描述也要跟著是 404 的
  if (!isLaunched(path) && !launchPreviewEnabled) return notFoundMetadata;
  return {
    title,
    description,
    alternates: { canonical: path },
    // 走到這裡的未開放頁面只會是開發環境預覽（正式環境已在上面改成 404 的 metadata），加上 noindex 以防萬一
    ...(isLaunched(path) ? {} : { robots: { index: false, follow: false } }),
  };
}
