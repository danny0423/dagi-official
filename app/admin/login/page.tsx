import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/admin/guard";
import type { SearchParams } from "@/app/admin/_components/page-parts";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "登入" };

// 沒有 JS 時登入表單會整頁送出，失敗時 route handler 用 ?error= 帶回原因
const ERRORS: Record<string, string> = {
  invalid: "Email 或密碼錯誤",
  limited: "嘗試次數過多，請稍後再試",
  missing: "請輸入 Email 與密碼",
};

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  if (await getAdminUser()) redirect("/admin");
  const { error, loggedOut } = await searchParams;

  return (
    <main className="adm-login">
      <div className="adm-login-box">
        <div>
          <p className="adm-hint">網站後台</p>
          <h1>登入</h1>
        </div>
        {loggedOut === "1" && <p className="adm-msg adm-msg-ok">已登出</p>}
        <LoginForm initialError={typeof error === "string" ? ERRORS[error] : undefined} />
      </div>
    </main>
  );
}
