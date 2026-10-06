import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/guard";
import { publicLinkOf } from "@/lib/admin/public-url";
import { parseId } from "@/lib/admin/validation";
import { toMediaDTO } from "@/lib/media";
import { updateCertification } from "@/app/admin/_actions/certifications";
import { deleteContent } from "@/app/admin/_actions/content";
import { ActionButton } from "@/app/admin/_components/action-button";
import { Notice, PageHeader, ViewOnSiteLink, type IdParams, type SearchParams } from "@/app/admin/_components/page-parts";
import { CertificationForm } from "../certification-form";

export const metadata: Metadata = { title: "編輯證照" };

export default async function EditCertificationPage({ params, searchParams }: { params: IdParams; searchParams: SearchParams }) {
  await requireAdmin();
  const id = parseId((await params).id);
  if (!id) notFound();
  const certification = await prisma.certification.findUnique({ where: { id }, include: { image: true } });
  if (!certification) notFound();
  const { notice } = await searchParams;

  return (
    <div className="adm-page">
      <PageHeader
        title={`編輯：${certification.name}`}
        back={{ href: "/admin/certifications", label: "證照列表" }}
        actions={
          <>
            <ViewOnSiteLink link={publicLinkOf("certifications", certification)} title={certification.name} />
            <ActionButton
              action={deleteContent.bind(null, "certifications", certification.id)}
              label="刪除這筆"
              variant="danger"
              confirmMessage={`確定要刪除證照「${certification.name}」？刪除後無法復原。`}
            />
          </>
        }
      />
      <Notice code={notice} />
      <div className="adm-card">
        <CertificationForm
          action={updateCertification.bind(null, certification.id)}
          submitLabel="儲存"
          initial={{ ...certification, image: certification.image ? toMediaDTO(certification.image) : null }}
        />
      </div>
    </div>
  );
}
