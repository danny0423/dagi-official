import { NotFoundContent } from "@/components/not-found-content";

// 前台頁面呼叫 notFound()（例如 /projects/[slug] 找不到、未開放頁面在正式環境）時顯示。
// 已經在 app/(site)/layout.tsx 的 SiteShell 裡，只放內容；標題由各頁 metadata 的 404 邏輯處理（lib/seo/metadata.ts）。
export default function SiteNotFound() {
  return <NotFoundContent />;
}
