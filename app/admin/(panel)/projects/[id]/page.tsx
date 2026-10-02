import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/guard";
import { parseId } from "@/lib/admin/validation";
import { toMediaDTO } from "@/lib/media";
import { updateProject } from "@/app/admin/_actions/projects";
import { deleteContent } from "@/app/admin/_actions/content";
import { ActionButton } from "@/app/admin/_components/action-button";
import { Notice, PageHeader, type IdParams, type SearchParams } from "@/app/admin/_components/page-parts";
import { ProjectForm } from "../project-form";

export const metadata: Metadata = { title: "編輯工程實績" };

export default async function EditProjectPage({ params, searchParams }: { params: IdParams; searchParams: SearchParams }) {
  await requireAdmin();
  const id = parseId((await params).id);
  if (!id) notFound();
  const project = await prisma.project.findUnique({
    where: { id },
    include: { coverImage: true, images: { orderBy: { sortOrder: "asc" }, include: { media: true } } },
  });
  if (!project) notFound();
  const { notice } = await searchParams;

  return (
    <div className="adm-page">
      <PageHeader
        title={`編輯：${project.title}`}
        back={{ href: "/admin/projects", label: "工程實績列表" }}
        actions={
          <ActionButton
            action={deleteContent.bind(null, "projects", project.id)}
            label="刪除這筆"
            variant="danger"
            confirmMessage={`確定要刪除工程實績「${project.title}」？刪除後無法復原。`}
          />
        }
      />
      <Notice code={notice} />
      <div className="adm-card">
        <ProjectForm
          action={updateProject.bind(null, project.id)}
          submitLabel="儲存"
          initial={{
            ...project,
            coverImage: project.coverImage ? toMediaDTO(project.coverImage) : null,
            gallery: project.images.map((image) => toMediaDTO(image.media)),
          }}
        />
      </div>
    </div>
  );
}
