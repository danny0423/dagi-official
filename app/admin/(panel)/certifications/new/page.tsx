import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/guard";
import { createCertification } from "@/app/admin/_actions/certifications";
import { PageHeader } from "@/app/admin/_components/page-parts";
import { CertificationForm } from "../certification-form";

export const metadata: Metadata = { title: "新增證照" };

export default async function NewCertificationPage() {
  await requireAdmin();
  return (
    <div className="adm-page">
      <PageHeader title="新增證照" back={{ href: "/admin/certifications", label: "證照列表" }} />
      <div className="adm-card">
        <CertificationForm action={createCertification} submitLabel="新增" />
      </div>
    </div>
  );
}
