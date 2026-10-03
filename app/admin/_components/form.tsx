"use client";

import {
  createContext,
  startTransition,
  useActionState,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { ActionState, FieldErrors } from "@/lib/admin/action-state";
import { SLUG_RULE_TEXT, slugify } from "@/lib/admin/slug";
import { REAUTH_URL, runAdminAction, type FormAction } from "@/app/admin/_components/admin-action";
import { useUnsavedChanges } from "@/app/admin/_components/unsaved-changes";

// 後台共用表單：送出呼叫 server action，顯示成功／錯誤訊息與欄位錯誤。
// 用 onSubmit + startTransition 呼叫 action，而不是 <form action>：
// React 的 form action 成功後會自動清空欄位，驗證失敗時使用者打的字會不見。
//
// 內建的保護（docs/ux-review-admin.md #1～#3）：
// - 未存檔離開提醒：跟載入時（或上次存檔成功時）的內容比對，有差異就啟用 useUnsavedChanges；存檔成功後解除。
// - 送出失敗：表單頂端列出出錯欄位（可點擊跳過去），並自動捲到、focus 第一個出錯的欄位。
// - 登入過期：顯示「在新分頁重新登入」，表單內容原封不動，重新登入後回來再按一次即可。
//
// 自訂欄位要接上這些功能：
// - 外層加 fieldAnchor(name, label, focusTargetId) 產生的 data 屬性，錯誤摘要才找得到欄位名稱與要 focus 的元素。
// - 用 JS 改了表單值（不是使用者直接打字）時，呼叫 useNotifyFormChange() 拿到的函式，重新判斷有沒有未存檔。

export type { FormAction };

type ErrorItem = { name: string; label: string; message: string; targetId: string | null };
type FormState = (NonNullable<ActionState> & { errorItems?: ErrorItem[] }) | null;

const FormStateContext = createContext<FormState>(null);
const FormChangeContext = createContext<() => void>(() => {});

export function useFieldError(name: string): string | undefined {
  return useContext(FormStateContext)?.fieldErrors?.[name]?.[0];
}

export function useFieldSuggestion(name: string): string | undefined {
  return useContext(FormStateContext)?.suggestions?.[name];
}

export function useNotifyFormChange(): () => void {
  return useContext(FormChangeContext);
}

// 欄位外框的 data 屬性：錯誤摘要靠它知道欄位的中文名稱、順序與要 focus 哪個元素
export function fieldAnchor(name: string, label: string, focusTargetId: string) {
  return { "data-adm-field": name, "data-adm-label": label, "data-adm-target": focusTargetId };
}

function serializeFormData(formData: FormData): string {
  const entries: [string, string][] = [];
  for (const [key, value] of formData) entries.push([key, typeof value === "string" ? value : value.name]);
  return JSON.stringify(entries);
}

function serializeForm(form: HTMLFormElement): string {
  return serializeFormData(new FormData(form));
}

// 依畫面上的欄位順序整理出錯欄位；找不到對應欄位的錯誤排在最後、不能點
function collectErrorItems(form: HTMLFormElement, fieldErrors: FieldErrors | undefined): ErrorItem[] {
  if (!fieldErrors) return [];
  const items: ErrorItem[] = [];
  const seen = new Set<string>();
  for (const element of form.querySelectorAll<HTMLElement>("[data-adm-field]")) {
    const name = element.dataset.admField;
    const message = name ? fieldErrors[name]?.[0] : undefined;
    if (!name || !message || seen.has(name)) continue;
    seen.add(name);
    items.push({ name, label: element.dataset.admLabel || name, message, targetId: element.dataset.admTarget || null });
  }
  for (const [name, messages] of Object.entries(fieldErrors)) {
    const message = messages?.[0];
    if (message && !seen.has(name)) items.push({ name, label: "其他", message, targetId: null });
  }
  return items;
}

function focusField(targetId: string) {
  const target = document.getElementById(targetId);
  if (!target) return;
  // 置中捲動：手機版頂端有固定的選單列，捲到最上面會被擋住
  target.scrollIntoView({ block: "center" });
  target.focus({ preventScroll: true });
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
  const formRef = useRef<HTMLFormElement>(null);
  // 比對基準：載入時的表單內容，存檔成功後換成剛送出的內容
  const baselineRef = useRef<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const [state, formAction, pending] = useActionState<FormState, FormData>(async (prev, formData) => {
    const result = await runAdminAction(
      action,
      prev,
      formData,
      `${submitLabel}失敗，可能是網路或伺服器暫時有問題。你填的內容還在，請稍後再按一次「${submitLabel}」。`,
    );
    const form = formRef.current;
    if (!result || !form) return result;
    if (result.ok) {
      if (resetOnSuccess) form.reset();
      // 送出等待期間又改過的內容，仍然算未存檔
      baselineRef.current = resetOnSuccess ? serializeForm(form) : serializeFormData(formData);
      setDirty(serializeForm(form) !== baselineRef.current);
      return result;
    }
    return { ...result, errorItems: collectErrorItems(form, result.fieldErrors) };
  }, null);

  useUnsavedChanges(dirty);

  useEffect(() => {
    if (formRef.current) baselineRef.current = serializeForm(formRef.current);
  }, []);

  // 送出失敗：捲到並 focus 第一個出錯的欄位
  useEffect(() => {
    if (!state || state.ok) return;
    const first = state.errorItems?.find((item) => item.targetId);
    if (first?.targetId) focusField(first.targetId);
  }, [state]);

  function recompute() {
    const form = formRef.current;
    // 基準還沒建立（子元件的 effect 比這裡早跑）時不判斷
    if (!form || baselineRef.current === null) return;
    setDirty(serializeForm(form) !== baselineRef.current);
  }

  return (
    <FormStateContext value={state}>
      <FormChangeContext value={recompute}>
        <form
          ref={formRef}
          className="adm-form"
          onChange={recompute}
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            startTransition(() => formAction(formData));
          }}
        >
          <ErrorSummary state={state} />
          {children}
          <div className="adm-form-footer">
            <button type="submit" className="adm-btn adm-btn-primary" disabled={pending}>
              {pending ? "處理中…" : submitLabel}
            </button>
            {footer}
            {dirty && !pending && <span className="adm-dirty-hint">有尚未儲存的變更</span>}
            <FormMessage state={state} retryLabel={submitLabel} />
          </div>
        </form>
      </FormChangeContext>
    </FormStateContext>
  );
}

// 表單頂端的錯誤摘要：列出出錯欄位，點了跳到該欄位
function ErrorSummary({ state }: { state: FormState }) {
  const items = state && !state.ok ? (state.errorItems ?? []) : [];
  if (!state || items.length === 0) return null;
  return (
    <div key={state.ts} className="adm-error-summary" role="alert">
      <p className="adm-error-summary-title">還沒有儲存：有 {items.length} 個欄位需要修正</p>
      <ul>
        {items.map((item) => (
          <li key={item.name}>
            {item.targetId ? (
              <a
                href={`#${item.targetId}`}
                onClick={(event) => {
                  event.preventDefault();
                  focusField(item.targetId!);
                }}
              >
                {item.label}
              </a>
            ) : (
              <span>{item.label}</span>
            )}
            ：{item.message}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function FormMessage({ state, retryLabel = "儲存" }: { state: ActionState; retryLabel?: string }) {
  return (
    <div role="status" aria-live="polite" className="adm-form-message">
      {state?.code === "auth" ? (
        <AuthExpiredNotice key={state.ts} retryLabel={retryLabel} />
      ) : (
        state && (
          <p key={state.ts} className={`adm-msg ${state.ok ? "adm-msg-ok" : "adm-msg-err"}`}>
            {state.message}
          </p>
        )
      )}
    </div>
  );
}

// 登入過期提示：表單內容保留在畫面上，到新分頁重新登入後回來再按一次
export function AuthExpiredNotice({ retryLabel, compact = false }: { retryLabel: string; compact?: boolean }) {
  const link = (
    <a href={REAUTH_URL} target="_blank" rel="noopener">
      在新分頁重新登入
    </a>
  );
  if (compact) {
    return (
      <span className="adm-inline-msg is-err">
        登入已過期，請{link}後再按一次「{retryLabel}」
      </span>
    );
  }
  return (
    <div className="adm-msg adm-msg-warn adm-auth-notice">
      <p>
        <strong>登入已過期，這次沒有儲存。</strong>你填的內容還在這個頁面上，請不要重新整理或關閉這個分頁。
      </p>
      <p>
        請{link}，登入後回到這個分頁，再按一次「{retryLabel}」。
      </p>
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
    <div className={`adm-field${wide ? " adm-span-2" : ""}`} {...fieldAnchor(name, label, id)}>
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
    <div className={`adm-field${wide ? " adm-span-2" : ""}`} {...fieldAnchor(name, label, id)}>
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

// 網址代稱：代稱是空的時候跟著標題自動產生（使用者自己改過就不再覆蓋，清空後恢復自動）；
// 離開欄位時依規則整理（全形轉半形、轉小寫、空白轉 -、去掉其他符號）。規則見 lib/admin/slug.ts。
// 代稱重複時，server 會回傳建議值（例：加上 -2），這裡提供一鍵改用。
export function SlugField({
  name = "slug",
  label = "網址代稱",
  sourceName = "title",
  sourceLabel,
  pathPrefix,
  example,
  defaultValue,
  note,
}: {
  name?: string;
  label?: string;
  sourceName?: string;
  sourceLabel: string;
  pathPrefix: string;
  example: string;
  defaultValue?: string | null;
  note?: string;
}) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  // 新增時（代稱是空的）才自動跟著標題變
  const autoRef = useRef(!defaultValue);
  const [value, setValue] = useState(defaultValue ?? "");
  const suggestion = useFieldSuggestion(name);
  const notifyChange = useNotifyFormChange();

  useEffect(() => {
    const input = inputRef.current;
    const source = input?.form?.elements.namedItem(sourceName);
    if (!input || !(source instanceof HTMLInputElement || source instanceof HTMLTextAreaElement)) return;

    const onSourceInput = () => {
      if (!autoRef.current) return;
      input.value = slugify(source.value);
      setValue(input.value);
    };
    const onInput = () => {
      autoRef.current = input.value.trim() === "";
      setValue(input.value);
    };
    const onBlur = () => {
      const cleaned = slugify(input.value);
      if (cleaned === input.value) return;
      input.value = cleaned;
      autoRef.current = cleaned === "";
      setValue(cleaned);
      notifyChange();
    };
    source.addEventListener("input", onSourceInput);
    input.addEventListener("input", onInput);
    input.addEventListener("blur", onBlur);
    return () => {
      source.removeEventListener("input", onSourceInput);
      input.removeEventListener("input", onInput);
      input.removeEventListener("blur", onBlur);
    };
  }, [sourceName, notifyChange]);

  function applySuggestion(next: string) {
    const input = inputRef.current;
    if (!input) return;
    input.value = next;
    autoRef.current = false;
    setValue(next);
    notifyChange();
    input.focus();
  }

  const hint = (
    <>
      網址的一部分，例如 {pathPrefix}
      {example}。
      {defaultValue ? `清空後會依「${sourceLabel}」重新產生` : `會依「${sourceLabel}」自動產生，也可以自己修改`}；
      {SLUG_RULE_TEXT}，空白會變成 -。
      {note && <> {note}</>}
      <span className="adm-slug-preview">
        網址：{pathPrefix}
        {value || "（依名稱自動產生）"}
      </span>
    </>
  );

  return (
    <FieldShell id={id} name={name} label={label} hint={hint} wide>
      {({ invalid, describedBy }) => (
        <div className="adm-slug-input">
          <input
            ref={inputRef}
            id={id}
            name={name}
            type="text"
            className="adm-input"
            defaultValue={defaultValue ?? ""}
            maxLength={100}
            autoComplete="off"
            spellCheck={false}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
          />
          {suggestion && suggestion !== value && (
            <button type="button" className="adm-btn adm-btn-sm" onClick={() => applySuggestion(suggestion)}>
              改用「{suggestion}」
            </button>
          )}
        </div>
      )}
    </FieldShell>
  );
}
