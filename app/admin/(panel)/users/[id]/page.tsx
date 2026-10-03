import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/admin/guard";
import { formatDateTime, roleLabel } from "@/lib/admin/format";
import { parseId } from "@/lib/admin/validation";
import { PASSWORD_MIN_LENGTH } from "@/lib/password";
import { resetUserPassword, setUserActive, updateUser } from "@/app/admin/_actions/users";
import { ActionButton } from "@/app/admin/_components/action-button";
import { AdminForm, SelectField, TextField } from "@/app/admin/_components/form";
import { Notice, PageHeader, type IdParams, type SearchParams } from "@/app/admin/_components/page-parts";
import { roleOptions } from "../role-options";

export const metadata: Metadata = { title: "管理帳號" };

export default async function UserDetailPage({ params, searchParams }: { params: IdParams; searchParams: SearchParams }) {
  const me = await requireRole("ADMIN");
  const id = parseId((await params).id);
  if (!id) notFound();
  const user = await prisma.adminUser.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, role: true, isActive: true, lastLoginAt: true, createdAt: true },
  });
  if (!user) notFound();
  const { notice } = await searchParams;
  const isSelf = user.id === me.id;

  return (
    <div className="adm-page">
      <PageHeader
        title={user.name}
        description={`${user.email}・${roleLabel[user.role]}・${user.isActive ? "啟用" : "停用"}・建立於 ${formatDateTime(user.createdAt)}`}
        back={{ href: "/admin/users", label: "帳號列表" }}
      />
      <Notice code={notice} />

      <div className="adm-card">
        <h2>基本資料與角色</h2>
        <AdminForm action={updateUser.bind(null, user.id)} submitLabel="儲存">
          <div className="adm-form-grid">
            <TextField label="名稱" name="name" defaultValue={user.name} required maxLength={100} />
            <SelectField
              label="角色"
              name="role"
              options={roleOptions}
              defaultValue={user.role}
              hint={isSelf ? "不能修改自己的角色" : undefined}
            />
          </div>
        </AdminForm>
      </div>

      <div className="adm-card">
        <h2>重設密碼</h2>
        {isSelf && (
          <p className="adm-hint mb-3">
            這是你自己的帳號。改自己的密碼也可以到<Link href="/admin/account">我的帳號</Link>（需要輸入目前的密碼）。
          </p>
        )}
        <AdminForm action={resetUserPassword.bind(null, user.id)} submitLabel="重設密碼" resetOnSuccess>
          <div className="adm-form-grid">
            <TextField
              label="新密碼"
              name="password"
              type="password"
              required
              autoComplete="new-password"
              hint={`至少 ${PASSWORD_MIN_LENGTH} 個字元。重設後該帳號其他已登入的裝置都會被登出。`}
            />
            <TextField label="再輸入一次" name="passwordConfirm" type="password" required autoComplete="new-password" />
          </div>
        </AdminForm>
      </div>

      <div className="adm-card flex flex-col gap-3">
        <h2>帳號狀態</h2>
        {isSelf ? (
          <p className="adm-hint">不能停用自己的帳號。</p>
        ) : user.isActive ? (
          <ActionButton
            action={setUserActive.bind(null, user.id, false)}
            label="停用這個帳號"
            variant="danger"
            confirmMessage={`確定要停用「${user.name}」？停用後會立即登出。`}
          />
        ) : (
          <ActionButton action={setUserActive.bind(null, user.id, true)} label="重新啟用這個帳號" variant="primary" />
        )}
        <p className="adm-hint">最後登入：{user.lastLoginAt ? formatDateTime(user.lastLoginAt) : "從未登入"}</p>
      </div>
    </div>
  );
}
