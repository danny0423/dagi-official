"use client";

import { useActionState } from "react";
import type { ActionState } from "@/lib/admin/action-state";
import { runAdminAction, type FormAction } from "@/app/admin/_components/admin-action";
import { AuthExpiredNotice } from "@/app/admin/_components/form";

// 列表上的單一操作按鈕（上下架、排序、刪除、改狀態…），旁邊顯示結果訊息。
// action 由 server component 用 bind 綁好 id；server 端仍會重新驗證 id 與權限。
// 失敗（含登入過期）時只在按鈕旁顯示訊息，不會整頁變成錯誤頁。
export function ActionButton({
  action,
  label,
  ariaLabel,
  confirmMessage,
  variant = "default",
  disabled = false,
}: {
  action: FormAction;
  label: string;
  ariaLabel?: string;
  confirmMessage?: string;
  variant?: "default" | "primary" | "danger";
  disabled?: boolean;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    (prev, formData) => runAdminAction(action, prev, formData, `「${label}」失敗，請稍後再試`),
    null,
  );
  const variantClass = variant === "primary" ? " adm-btn-primary" : variant === "danger" ? " adm-btn-danger" : "";

  return (
    <form
      action={formAction}
      className="inline-flex flex-wrap items-center gap-2"
      onSubmit={(event) => {
        if (confirmMessage && !window.confirm(confirmMessage)) event.preventDefault();
      }}
    >
      <button
        type="submit"
        className={`adm-btn adm-btn-sm${variantClass}`}
        disabled={disabled || pending}
        aria-label={ariaLabel}
        title={ariaLabel}
      >
        {pending ? "處理中…" : label}
      </button>
      {state && (
        <span key={state.ts} role="status">
          {state.code === "auth" ? (
            <AuthExpiredNotice retryLabel={label} compact />
          ) : (
            <span className={`adm-inline-msg ${state.ok ? "is-ok" : "is-err"}`}>{state.message}</span>
          )}
        </span>
      )}
    </form>
  );
}
