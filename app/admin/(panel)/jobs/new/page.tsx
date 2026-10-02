import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/guard";
import { createJob } from "@/app/admin/_actions/jobs";
import { PageHeader } from "@/app/admin/_components/page-parts";
import { JobForm } from "../job-form";

export const metadata: Metadata = { title: "新增職缺" };

export default async function NewJobPage() {
  await requireAdmin();
  return (
    <div className="adm-page">
      <PageHeader title="新增職缺" back={{ href: "/admin/jobs", label: "職缺列表" }} />
      <div className="adm-card">
        <JobForm action={createJob} submitLabel="新增" />
      </div>
    </div>
  );
}
