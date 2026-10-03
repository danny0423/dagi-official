"use client";

import { usePathname } from "next/navigation";
import { findSitePage, launchPreviewEnabled } from "@/lib/launch";

// 開發環境預覽未開放頁面時的提示橫幅；正式環境這些頁面直接 404，不會走到這裡。
export function LaunchPreviewBanner() {
  const pathname = usePathname();
  const page = findSitePage(pathname);
  if (!launchPreviewEnabled || !page || page.launched) return null;

  return (
    <div className="launch-preview-banner" role="note" aria-label="未上線頁面預覽">
      <div className="site-container">
        <strong>未上線頁面預覽（正式環境不會顯示）</strong>
        <span>「{page.name}」在 lib/launch.ts 設為未開放：正式環境會回 404，也不會出現在選單、頁尾與 sitemap。</span>
      </div>
    </div>
  );
}
