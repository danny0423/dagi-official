"use client";

import {
  createContext,
  startTransition,
  useActionState,
  useContext,
  useEffect,
  useId,
  useRef,
  type ReactNode,
} from "react";
import type { ActionState } from "@/lib/admin/action-state";

// 後台共用表單：送出呼叫 server action，顯示成功／錯誤訊息與欄位錯誤。
// 用 onSubmit + startTransition 呼叫 action，而不是 <form action>：
// React 的 form action 成功後會自動清空欄位，驗證失敗時使用者打的字會不見。

export type FormAction = (state: ActionState, formData: FormData) => Promise<ActionState>;

const FormStateContext = createContext<ActionState>(null);

export function useFieldError(name: string): string | undefined {
  return useContext(FormStateContext)?.fieldErrors?.[name]?.[0];
}

export function AdminForm({
  action,
  children,
  submitLabel = "儲存",
  resetOnSuccess = false,
  footer,
}: {
  action: FormAction;
  children: ReactNode;
  submitLabel?: string;
  resetOnSuccess?: boolean;
  footer?: ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (resetOnSuccess && state?.ok) formRef.current?.reset();
  }, [state, resetOnSuccess]);

  return (
    <FormStateContext value={state}>
      <form
        ref={formRef}
        className="adm-form"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          startTransition(() => formAction(formData));
        }}
      >
        {children}
        <div className="adm-form-footer">
          <button type="submit" className="adm-btn adm-btn-primary" disabled={pending}>
            {pending ? "處理中…" : submitLabel}
          </button>
          {footer}
          <FormMessage state={state} />
        </div>
      </form>
    </FormStateContext>
  );
}

export function FormMessage({ state }: { state: ActionState }) {
  return (
    <div role="status" aria-live="polite">
      {state && (
        <p key={state.ts} className={`adm-msg ${state.ok ? "adm-msg-ok" : "adm-msg-err"}`}>
          {state.message}
        </p>
      )}
    </div>
  );
}

type FieldProps = {
  label: string;
  name: string;
  hint?: ReactNode;
  required?: boolean;
  wide?: boolean;
};

function FieldShell({
  id,
  label,
  name,
  hint,
  required,
  wide,
  children,
}: FieldProps & { id: string; children: (aria: { invalid: boolean; describedBy?: string }) => ReactNode }) {
  const error = useFieldError(name);
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  return (
    <div className={`adm-field${wide ? " adm-span-2" : ""}`}>
      <label htmlFor={id} className="adm-label">
        {label}
        {required && <span className="adm-required" aria-hidden="true">＊</span>}
      </label>
      {children({ invalid: Boolean(error), describedBy })}
      {hint && <p id={hintId} className="adm-hint">{hint}</p>}
      {error && <p id={errorId} className="adm-error">{error}</p>}
    </div>
  );
}

export function TextField({
  type = "text",
  defaultValue,
  placeholder,
  maxLength,
  autoComplete,
  inputMode,
  ...field
}: FieldProps & {
  type?: "text" | "email" | "password" | "date" | "url" | "tel" | "number";
  defaultValue?: string | number | null;
  placeholder?: string;
  maxLength?: number;
  autoComplete?: string;
  inputMode?: "numeric" | "text" | "email" | "tel" | "url";
}) {
  const id = useId();
  return (
    <FieldShell id={id} {...field}>
      {({ invalid, describedBy }) => (
        <input
          id={id}
          name={field.name}
          type={type}
          className="adm-input"
          defaultValue={defaultValue ?? ""}
          placeholder={placeholder}
          maxLength={maxLength}
          autoComplete={autoComplete}
          inputMode={inputMode}
          required={field.required}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
        />
      )}
    </FieldShell>
  );
}

export function TextAreaField({
  defaultValue,
  rows = 5,
  maxLength,
  placeholder,
  ...field
}: FieldProps & { defaultValue?: string | null; rows?: number; maxLength?: number; placeholder?: string }) {
  const id = useId();
  return (
    <FieldShell id={id} {...field}>
      {({ invalid, describedBy }) => (
        <textarea
          id={id}
          name={field.name}
          className="adm-input"
          defaultValue={defaultValue ?? ""}
          rows={rows}
          maxLength={maxLength}
          placeholder={placeholder}
          required={field.required}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
        />
      )}
    </FieldShell>
  );
}

export function SelectField({
  options,
  defaultValue,
  ...field
}: FieldProps & { options: { value: string; label: string }[]; defaultValue?: string }) {
  const id = useId();
  return (
    <FieldShell id={id} {...field}>
      {({ invalid, describedBy }) => (
        <select
          id={id}
          name={field.name}
          className="adm-input"
          defaultValue={defaultValue}
          required={field.required}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </FieldShell>
  );
}

export function CheckboxField({
  label,
  name,
  hint,
  defaultChecked,
  wide,
}: Omit<FieldProps, "required"> & { defaultChecked?: boolean }) {
  const id = useId();
  const error = useFieldError(name);
  return (
    <div className={`adm-field${wide ? " adm-span-2" : ""}`}>
      <label className="adm-check" htmlFor={id}>
        <input
          id={id}
          type="checkbox"
          name={name}
          defaultChecked={defaultChecked}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <span>
          <span className="adm-label">{label}</span>
          {hint && <span className="adm-hint block">{hint}</span>}
        </span>
      </label>
      {error && <p id={`${id}-error`} className="adm-error">{error}</p>}
    </div>
  );
}
