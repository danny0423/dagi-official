import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/admin/guard";
import { formatDateTime, roleLabel } from "@/lib/admin/format";
import { PASSWORD_MIN_LENGTH } from "@/lib/password";
import { createUser } from "@/app/admin/_actions/users";
import { AdminForm, SelectField, TextField } from "@/app/admin/_components/form";
import { Notice, PageHeader, type SearchParams } from "@/app/admin/_components/page-parts";
import { roleOptions } from "./role-options";

export const metadata: Metadata = { title: "帳號管理" };

export default async function UsersPage({ searchParams }: { searchParams: SearchParams }) {
  const me = await requireRole("ADMIN");
  const { notice } = await searchParams;
  const users = await prisma.adminUser.findMany({
    orderBy: [{ isActive: "desc" }, { id: "asc" }],
    select: { id: true, email: true, name: true, role: true, isActive: true, lastLoginAt: true, createdAt: true },
  });

  return (
    <div className="adm-page">
      <PageHeader title="帳號管理" description="只有管理員看得到這頁。停用帳號會立即登出該帳號所有裝置。" />
      <Notice code={notice} />
      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th scope="col">名稱</th>
              <th scope="col">Email</th>
              <th scope="col">角色</th>
              <th scope="col">狀態</th>
              <th scope="col">最後登入</th>
              <th scope="col">操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td className="adm-cell-title">
                  {user.name}
                  {user.id === me.id && <span className="adm-sub">（你自己）</span>}
                </td>
                <td>{user.email}</td>
                <td>
                  <span className={`adm-badge${user.role === "ADMIN" ? " adm-badge-steel" : ""}`}>{roleLabel[user.role]}</span>
                </td>
                <td>
                  {user.isActive ? (
                    <span className="adm-badge adm-badge-ok">啟用</span>
                  ) : (
                    <span className="adm-badge adm-badge-err">停用</span>
                  )}
                </td>
                <td>{user.lastLoginAt ? formatDateTime(user.lastLoginAt) : "從未登入"}</td>
                <td>
                  <Link href={`/admin/users/${user.id}`} className="adm-btn adm-btn-sm">
                    管理
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="adm-card">
        <h2>新增帳號</h2>
        <AdminForm action={createUser} submitLabel="新增帳號" resetOnSuccess>
          <div className="adm-form-grid">
            <TextField label="名稱" name="name" required maxLength={100} />
            <TextField label="Email" name="email" type="email" required maxLength={254} autoComplete="off" />
            <SelectField label="角色" name="role" options={roleOptions} defaultValue="EDITOR" />
            <div />
            <TextField
              label="初始密碼"
              name="password"
              type="password"
              required
              autoComplete="new-password"
              hint={`至少 ${PASSWORD_MIN_LENGTH} 個字元；請用安全管道告訴對方`}
            />
            <TextField label="再輸入一次" name="passwordConfirm" type="password" required autoComplete="new-password" />
          </div>
        </AdminForm>
      </div>
    </div>
  );
}
