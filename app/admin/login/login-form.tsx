"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

// 登入表單：有 JS 時用 fetch 送 JSON，沒有 JS 時整頁 POST 到同一個 route handler。
// reauth（登入過期、從表單的「在新分頁重新登入」開進來）：登入成功後不跳轉，提示回原分頁再按一次儲存。
export function LoginForm({ initialError, reauth = false }: { initialError?: string; reauth?: boolean }) {
  const router = useRouter();
  const [error, setError] = useState(initialError ?? "");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.get("email"), password: formData.get("password") }),
      });
      const data = (await response.json().catch(() => null)) as { ok?: boolean; message?: string; redirectTo?: string } | null;
      if (!response.ok || !data?.ok) {
        setError(data?.message ?? "登入失敗，請稍後再試");
        setPending(false);
        return;
      }
      if (reauth) {
        setDone(true);
        return;
      }
      router.replace(data.redirectTo ?? "/admin");
      router.refresh();
    } catch {
      setError("無法連線，請稍後再試");
      setPending(false);
    }
  }

  if (done) return <ReauthDone />;

  return (
    <form method="post" action="/api/admin/login" className="adm-form" onSubmit={onSubmit}>
      <div className="adm-field">
        <label htmlFor="login-email" className="adm-label">Email</label>
        <input id="login-email" name="email" type="email" className="adm-input" autoComplete="username" required />
      </div>
      <div className="adm-field">
        <label htmlFor="login-password" className="adm-label">密碼</label>
        <input
          id="login-password"
          name="password"
          type="password"
          className="adm-input"
          autoComplete="current-password"
          required
        />
      </div>
      <div role="alert" aria-live="assertive">
        {error && <p className="adm-msg adm-msg-err">{error}</p>}
      </div>
      <button type="submit" className="adm-btn adm-btn-primary" disabled={pending}>
        {pending ? "登入中…" : "登入"}
      </button>
    </form>
  );
}

// 重新登入完成：提示回到原本的分頁。分頁是從連結開的新分頁，瀏覽器通常允許用 window.close() 關掉
export function ReauthDone({ alreadyLoggedIn = false }: { alreadyLoggedIn?: boolean }) {
  return (
    <div className="flex flex-col gap-3" role="status">
      <p className="adm-msg adm-msg-ok">{alreadyLoggedIn ? "你目前已經是登入狀態。" : "已重新登入。"}</p>
      <p>請回到原本的分頁，再按一次「儲存」（或剛才沒有成功的按鈕），剛才填的內容會照常存檔。</p>
      <div className="adm-actions">
        <button type="button" className="adm-btn adm-btn-primary" onClick={() => window.close()}>
          關閉這個分頁
        </button>
        <Link href="/admin" className="adm-btn">
          前往儀表板
        </Link>
      </div>
      <p className="adm-hint">按了沒有反應的話，請直接關閉這個分頁。</p>
    </div>
  );
}
