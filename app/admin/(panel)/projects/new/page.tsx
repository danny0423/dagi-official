import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/guard";
import { createProject } from "@/app/admin/_actions/projects";
import { PageHeader } from "@/app/admin/_components/page-parts";
import { ProjectForm } from "../project-form";

export const metadata: Metadata = { title: "新增工程實績" };

export default async function NewProjectPage() {
  await requireAdmin();
  return (
    <div className="adm-page">
      <PageHeader title="新增工程實績" back={{ href: "/admin/projects", label: "工程實績列表" }} />
      <div className="adm-card">
        <ProjectForm action={createProject} submitLabel="新增" />
      </div>
    </div>
  );
}
