"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

// 登入表單：有 JS 時用 fetch 送 JSON，沒有 JS 時整頁 POST 到同一個 route handler
export function LoginForm({ initialError }: { initialError?: string }) {
  const router = useRouter();
  const [error, setError] = useState(initialError ?? "");
  const [pending, setPending] = useState(false);

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
      router.replace(data.redirectTo ?? "/admin");
      router.refresh();
    } catch {
      setError("無法連線，請稍後再試");
      setPending(false);
    }
  }

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
