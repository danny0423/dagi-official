"use client";

import { usePathname } from "next/navigation";
import { findSitePage, launchPreviewEnabled } from "@/lib/launch";

// 未開放頁面（lib/launch.ts 的 launched: false）頂部的提示橫幅，兩種情況：
//   - 已登入後台的人（adminPreview，components/site-shell.tsx 用 lib/preview.ts 判斷）：正式環境與開發環境都顯示「預覽模式」
//   - 開發環境的訪客：顯示給開發者看的「未上線頁面預覽」
// 正式環境的訪客打開未開放頁面是 404，不會走到這裡。app/not-found.tsx 自己包的外框不顯示橫幅（launchBanner={false}）。
export function LaunchPreviewBanner({ adminPreview }: { adminPreview: boolean }) {
  const pathname = usePathname();
  const page = findSitePage(pathname);
  if (!page || page.launched) return null;

  if (adminPreview) {
    return (
      <div className="launch-preview-banner" role="note" aria-label="預覽模式">
        <div className="site-container">
          <strong>預覽模式：這個頁面尚未對外開放，只有登入後台的人看得到</strong>
          <span>
            「{page.name}」還沒開放：訪客打開這個網址會看到「找不到頁面」，選單、頁尾與 sitemap 也不會出現。
            {launchPreviewEnabled && "（目前是開發環境，未登入也看得到；正式環境才會擋訪客）"}
          </span>
        </div>
      </div>
    );
  }

  if (!launchPreviewEnabled) return null;
  return (
    <div className="launch-preview-banner" role="note" aria-label="未上線頁面預覽">
      <div className="site-container">
        <strong>未上線頁面預覽（正式環境不會顯示）</strong>
        <span>「{page.name}」在 lib/launch.ts 設為未開放：正式環境會回 404，也不會出現在選單、頁尾與 sitemap。</span>
      </div>
    </div>
  );
}
