import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/guard";
import { createNews } from "@/app/admin/_actions/news";
import { PageHeader } from "@/app/admin/_components/page-parts";
import { NewsForm } from "../news-form";

export const metadata: Metadata = { title: "新增消息" };

export default async function NewNewsPage() {
  await requireAdmin();
  return (
    <div className="adm-page">
      <PageHeader title="新增消息" back={{ href: "/admin/news", label: "最新消息列表" }} />
      <div className="adm-card">
        <NewsForm action={createNews} submitLabel="新增" />
      </div>
    </div>
  );
}
