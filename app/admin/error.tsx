"use client";

import { AdminErrorView } from "@/app/admin/_components/error-view";

// 後台的最後一道錯誤防線（中文、可重試）。會接到登入頁與 (panel)/layout.tsx 本身的錯誤；
// (panel) 底下各頁面的錯誤由 (panel)/error.tsx 接，保留側邊選單。
export default function AdminError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <AdminErrorView error={error} retry={retry} fullPage />;
}
