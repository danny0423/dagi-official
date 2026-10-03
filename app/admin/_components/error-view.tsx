"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { checkLoggedIn } from "@/app/admin/_components/admin-action";

// 後台錯誤頁（app/admin/error.tsx 與 app/admin/(panel)/error.tsx 共用）。
// 這是最後一道防線：表單送出的錯誤已經在 AdminForm／ActionButton 攔下，不會走到這裡；
// 會走到這裡的多半是頁面讀資料時出錯（例如資料庫暫時連不上）。
// 會順便查一次是否還在登入狀態，登入過期時改成提示重新登入。
export function AdminErrorView({
  error,
  retry,
  fullPage = false,
}: {
  error: Error & { digest?: string };
  retry: () => void;
  fullPage?: boolean;
}) {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    console.error("[admin error]", error);
    let cancelled = false;
    void checkLoggedIn().then((value) => {
      if (!cancelled) setLoggedIn(value);
    });
    return () => {
      cancelled = true;
    };
  }, [error]);

  const body = (
    <div className={fullPage ? "adm-login-box" : "adm-card adm-error-view"} role="alert">
      <div>
        <p className="adm-hint">網站後台</p>
        <h1>{loggedIn === false ? "登入已過期" : "發生錯誤，這個畫面暫時無法顯示"}</h1>
      </div>
      {loggedIn === false ? (
        <p>你的登入已過期，或已經在別的分頁登出。請重新登入後再繼續。</p>
      ) : (
        <p>
          可能是網路或伺服器暫時有問題，可以按「重試」再試一次。一直出現的話，請把下方的錯誤代碼告訴網站管理員。
        </p>
      )}
      <div className="adm-actions">
        {loggedIn === false ? (
          <Link href="/admin/login" className="adm-btn adm-btn-primary">
            重新登入
          </Link>
        ) : (
          <button type="button" className="adm-btn adm-btn-primary" onClick={() => retry()}>
            重試
          </button>
        )}
        <Link href="/admin" className="adm-btn">
          回儀表板
        </Link>
      </div>
      {error.digest && <p className="adm-hint">錯誤代碼：{error.digest}</p>}
    </div>
  );

  if (fullPage) return <main className="adm-login">{body}</main>;
  return <div className="adm-page">{body}</div>;
}
