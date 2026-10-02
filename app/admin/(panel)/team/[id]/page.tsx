import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/guard";
import { parseId } from "@/lib/admin/validation";
import { toMediaDTO } from "@/lib/media";
import { updateTeamMember } from "@/app/admin/_actions/team";
import { deleteContent } from "@/app/admin/_actions/content";
import { ActionButton } from "@/app/admin/_components/action-button";
import { Notice, PageHeader, type IdParams, type SearchParams } from "@/app/admin/_components/page-parts";
import { TeamForm } from "../team-form";

export const metadata: Metadata = { title: "編輯團隊成員" };

export default async function EditTeamMemberPage({ params, searchParams }: { params: IdParams; searchParams: SearchParams }) {
  await requireAdmin();
  const id = parseId((await params).id);
  if (!id) notFound();
  const member = await prisma.teamMember.findUnique({ where: { id }, include: { photo: true } });
  if (!member) notFound();
  const { notice } = await searchParams;

  return (
    <div className="adm-page">
      <PageHeader
        title={`編輯：${member.name}`}
        back={{ href: "/admin/team", label: "團隊成員列表" }}
        actions={
          <ActionButton
            action={deleteContent.bind(null, "team", member.id)}
            label="刪除這筆"
            variant="danger"
            confirmMessage={`確定要刪除團隊成員「${member.name}」？刪除後無法復原。`}
          />
        }
      />
      <Notice code={notice} />
      <div className="adm-card">
        <TeamForm
          action={updateTeamMember.bind(null, member.id)}
          submitLabel="儲存"
          initial={{ ...member, photo: member.photo ? toMediaDTO(member.photo) : null }}
        />
      </div>
    </div>
  );
}
