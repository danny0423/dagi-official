import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/admin/guard";
import type { SearchParams } from "@/app/admin/_components/page-parts";
import { LoginForm, ReauthDone } from "./login-form";

export const metadata: Metadata = { title: "登入" };

// 沒有 JS 時登入表單會整頁送出，失敗時 route handler 用 ?error= 帶回原因
const ERRORS: Record<string, string> = {
  invalid: "Email 或密碼錯誤",
  limited: "嘗試次數過多，請稍後再試",
  missing: "請輸入 Email 與密碼",
};

// ?reauth=1：後台表單發現登入過期時，從「在新分頁重新登入」連結開進來。
// 這時登入成功（或本來就已登入）不跳去儀表板，改提示回到原本的分頁再按一次儲存。
export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const { error, loggedOut, reauth } = await searchParams;
  const isReauth = reauth === "1";
  const user = await getAdminUser();
  if (user && !isReauth) redirect("/admin");

  return (
    <main className="adm-login">
      <div className="adm-login-box">
        <div>
          <p className="adm-hint">網站後台</p>
          <h1>{isReauth ? "重新登入" : "登入"}</h1>
        </div>
        {isReauth && user ? (
          <ReauthDone alreadyLoggedIn />
        ) : (
          <>
            {isReauth && (
              <p className="adm-msg adm-msg-warn">
                登入已過期。重新登入後，請回到原本的分頁再按一次儲存，剛才填的內容還在那裡。
              </p>
            )}
            {loggedOut === "1" && <p className="adm-msg adm-msg-ok">已登出</p>}
            <LoginForm initialError={typeof error === "string" ? ERRORS[error] : undefined} reauth={isReauth} />
          </>
        )}
        <p className="adm-hint">忘記密碼請聯絡網站管理員。</p>
      </div>
    </main>
  );
}
