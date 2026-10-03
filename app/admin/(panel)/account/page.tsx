import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/guard";
import { roleLabel } from "@/lib/admin/format";
import { PASSWORD_MIN_LENGTH } from "@/lib/password";
import { changeOwnPassword } from "@/app/admin/_actions/account";
import { AdminForm, TextField } from "@/app/admin/_components/form";
import { PageHeader } from "@/app/admin/_components/page-parts";

export const metadata: Metadata = { title: "我的帳號" };

// 我的帳號：所有角色都能進。看自己的基本資料、改自己的密碼。
// 名稱、Email、角色由管理員在「帳號管理」設定，這裡只顯示。
export default async function AccountPage() {
  const user = await requireAdmin();

  return (
    <div className="adm-page">
      <PageHeader title="我的帳號" description="名稱、Email 與角色由網站管理員設定；需要修改請聯絡網站管理員。" />

      <div className="adm-card">
        <h2>基本資料</h2>
        <dl className="adm-dl">
          <dt>名稱</dt>
          <dd>{user.name}</dd>
          <dt>Email（登入帳號）</dt>
          <dd>{user.email}</dd>
          <dt>角色</dt>
          <dd>{roleLabel[user.role]}</dd>
        </dl>
      </div>

      <div className="adm-card">
        <h2>變更密碼</h2>
        <AdminForm action={changeOwnPassword} submitLabel="變更密碼" resetOnSuccess>
          <div className="adm-form-grid">
            <TextField
              label="目前的密碼"
              name="currentPassword"
              type="password"
              required
              autoComplete="current-password"
              wide
            />
            <TextField
              label="新密碼"
              name="password"
              type="password"
              required
              autoComplete="new-password"
              hint={`至少 ${PASSWORD_MIN_LENGTH} 個字元。變更後，這個帳號在其他裝置上的登入都會被登出，目前這個裝置不受影響。`}
            />
            <TextField label="再輸入一次新密碼" name="passwordConfirm" type="password" required autoComplete="new-password" />
          </div>
        </AdminForm>
      </div>
    </div>
  );
}
