"use client";

import { AdminErrorView } from "@/app/admin/_components/error-view";

// (panel) 底下頁面的錯誤：顯示在後台外框裡（側邊選單還在，可以直接換到別的功能）
export default function PanelError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <AdminErrorView error={error} retry={retry} />;
}
