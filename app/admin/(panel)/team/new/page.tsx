import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/guard";
import { createTeamMember } from "@/app/admin/_actions/team";
import { PageHeader } from "@/app/admin/_components/page-parts";
import { TeamForm } from "../team-form";

export const metadata: Metadata = { title: "新增團隊成員" };

export default async function NewTeamMemberPage() {
  await requireAdmin();
  return (
    <div className="adm-page">
      <PageHeader title="新增團隊成員" back={{ href: "/admin/team", label: "團隊成員列表" }} />
      <div className="adm-card">
        <TeamForm action={createTeamMember} submitLabel="新增" />
      </div>
    </div>
  );
}
