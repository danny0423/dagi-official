import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/guard";
import { parseId } from "@/lib/admin/validation";
import { updateJob } from "@/app/admin/_actions/jobs";
import { deleteContent } from "@/app/admin/_actions/content";
import { ActionButton } from "@/app/admin/_components/action-button";
import { Notice, PageHeader, type IdParams, type SearchParams } from "@/app/admin/_components/page-parts";
import { JobForm } from "../job-form";

export const metadata: Metadata = { title: "編輯職缺" };

export default async function EditJobPage({ params, searchParams }: { params: IdParams; searchParams: SearchParams }) {
  await requireAdmin();
  const id = parseId((await params).id);
  if (!id) notFound();
  const job = await prisma.job.findUnique({ where: { id } });
  if (!job) notFound();
  const { notice } = await searchParams;

  return (
    <div className="adm-page">
      <PageHeader
        title={`編輯：${job.title}`}
        back={{ href: "/admin/jobs", label: "職缺列表" }}
        actions={
          <ActionButton
            action={deleteContent.bind(null, "jobs", job.id)}
            label="刪除這筆"
            variant="danger"
            confirmMessage={`確定要刪除職缺「${job.title}」？刪除後無法復原。`}
          />
        }
      />
      <Notice code={notice} />
      <div className="adm-card">
        <JobForm action={updateJob.bind(null, job.id)} submitLabel="儲存" initial={job} />
      </div>
    </div>
  );
}
