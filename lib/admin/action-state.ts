// server action 回傳給表單的狀態（client／server 共用，不能加 "server-only"）

export type FieldErrors = Record<string, string[] | undefined>;

export type ActionState = {
  ok: boolean;
  message: string;
  fieldErrors?: FieldErrors;
  // 每次回傳都不同，讓相同訊息也能重新顯示
  ts: number;
} | null;

export function success(message: string): NonNullable<ActionState> {
  return { ok: true, message, ts: Date.now() };
}

export function failure(message: string, fieldErrors?: FieldErrors): NonNullable<ActionState> {
  return { ok: false, message, fieldErrors, ts: Date.now() };
}
