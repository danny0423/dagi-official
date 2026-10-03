import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/guard";

export const metadata: Metadata = { title: "找不到頁面" };

// /admin 底下沒有對應功能的網址：交給 (panel)/not-found.tsx 顯示後台樣式的 404。
// 沒有這個 catch-all 的話，會落到前台樣式的 app/not-found.tsx。具體的路由（含 /admin/login）優先於這裡。
export default async function MissingAdminPage() {
  await requireAdmin();
  notFound();
}
