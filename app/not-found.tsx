import type { Metadata } from "next";
import { NotFoundContent } from "@/components/not-found-content";
import { SiteShell } from "@/components/site-shell";
import { notFoundMetadata } from "@/lib/seo/metadata";

// 中文 404（docs/ux-review-site.md #5、#6）：處理「沒有對應路由的網址」。
// 根層 not-found 不經過 app/(site)/layout.tsx，所以這裡自己包 SiteShell（頁首、頁尾）。
// 前台頁面呼叫 notFound() 時由 app/(site)/not-found.tsx 處理（已在 SiteShell 裡）。
// 後台（/admin 底下）的 404 由 app/admin/(panel)/not-found.tsx 顯示。
// 不顯示未開放頁面的預覽橫幅：未開放頁底下沒有對應路由的網址（例如 /news/a/b）不是「預覽中的頁面」。
export const metadata: Metadata = notFoundMetadata;

export default function NotFound() {
  return (
    <SiteShell launchBanner={false}>
      <NotFoundContent />
    </SiteShell>
  );
}
