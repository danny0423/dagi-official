"use client";

import { useActionState } from "react";
import type { FormAction } from "@/app/admin/_components/form";

// 列表上的單一操作按鈕（上下架、排序、刪除、改狀態…），旁邊顯示結果訊息。
// action 由 server component 用 bind 綁好 id；server 端仍會重新驗證 id 與權限。
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
  const [state, formAction, pending] = useActionState(action, null);
  const variantClass = variant === "primary" ? " adm-btn-primary" : variant === "danger" ? " adm-btn-danger" : "";

  return (
    <form
      action={formAction}
      className="inline-flex items-center gap-2"
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
        {pending ? "…" : label}
      </button>
      {state && (
        <span key={state.ts} role="status" className={`adm-inline-msg ${state.ok ? "is-ok" : "is-err"}`}>
          {state.message}
        </span>
      )}
    </form>
  );
}
