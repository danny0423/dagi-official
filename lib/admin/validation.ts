import "server-only";
import * as z from "zod";
import { Prisma } from "@/lib/generated/prisma/client";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/lib/password";
import { failure, type FieldErrors } from "@/lib/admin/action-state";
import {
  normalizeSlugInput,
  SLUG_MAX_LENGTH,
  SLUG_PATTERN,
  SLUG_RULE_TEXT,
  slugify,
  slugLength,
} from "@/lib/admin/slug";

// 後台表單的伺服器端驗證工具（zod）。FormData 的值一律當成不可信輸入。

const blankToNull = (value: unknown) =>
  value == null || (typeof value === "string" && value.trim() === "") ? null : value;

export const zText = (label: string, max = 200) =>
  z
    .string({ error: `請填寫${label}` })
    .trim()
    .min(1, `請填寫${label}`)
    .max(max, `${label}最多 ${max} 字`);

export const zOptionalText = (max = 200) =>
  z.preprocess(blankToNull, z.string().trim().max(max, `最多 ${max} 字`).nullable());

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式錯誤")
  .transform((s) => new Date(`${s}T00:00:00.000Z`))
  .refine((d) => !Number.isNaN(d.getTime()), "日期格式錯誤");

// @db.Date 欄位：一律存成 UTC 午夜，顯示時也用 UTC 取日期，避免時區位移一天
export const zOptionalDate = z.preprocess(blankToNull, dateString.nullable());
export const zDate = (label: string) =>
  z.preprocess(blankToNull, z.string({ error: `請填寫${label}` }).pipe(dateString));

// 核取方塊：沒勾時 FormData 不會有這個欄位
export const zCheckbox = z.preprocess((v) => v === "on" || v === "true" || v === "1", z.boolean());

export const zOptionalId = z.preprocess(
  blankToNull,
  z.coerce.number().int().positive("圖片編號錯誤").nullable(),
);

export const zOptionalInt = (min: number, max: number) =>
  z.preprocess(
    blankToNull,
    z.coerce
      .number({ error: "請輸入數字" })
      .int("請輸入整數")
      .min(min, `不能小於 ${min}`)
      .max(max, `不能大於 ${max}`)
      .nullable(),
  );

// 網址代稱：選填，留空時由 withSlugFromTitle() 依標題產生（規則見 lib/admin/slug.ts）。
// 只做全形轉半形與轉小寫，不偷偷改掉使用者打的符號；不合規則就回欄位錯誤（畫面離開欄位時已先整理過）。
export const zOptionalSlug = z.preprocess(
  (v) => (typeof v === "string" ? blankToNull(normalizeSlugInput(v)) : blankToNull(v)),
  z
    .string()
    .refine((s) => slugLength(s) <= SLUG_MAX_LENGTH, `網址代稱最多 ${SLUG_MAX_LENGTH} 字`)
    .refine((s) => SLUG_PATTERN.test(s), `${SLUG_RULE_TEXT}，例如 台中辦公大樓-2026`)
    .nullable(),
);

// 搭配 zOptionalSlug：網址代稱留空時改用標題產生；標題轉不出任何可用字元時回欄位錯誤
export function withSlugFromTitle<T extends { title: string; slug: string | null }>(schema: z.ZodType<T>) {
  return schema
    .transform((d) => ({ ...d, slug: d.slug ?? slugify(d.title) }))
    .refine((d) => d.slug !== "", { path: ["slug"], message: "請填寫網址代稱（標題沒有可以轉成網址的文字）" });
}

// 密碼長度規則（新增帳號、重設密碼、我的帳號改密碼共用）
export const zPassword = z
  .string({ error: "請輸入密碼" })
  .min(PASSWORD_MIN_LENGTH, `密碼至少 ${PASSWORD_MIN_LENGTH} 個字元`)
  .max(PASSWORD_MAX_LENGTH, `密碼最多 ${PASSWORD_MAX_LENGTH} 個字元`);

// 新密碼＋再輸入一次（欄位名稱 password、passwordConfirm）
export const passwordPair = z
  .object({ password: zPassword, passwordConfirm: z.string({ error: "請再輸入一次密碼" }) })
  .refine((d) => d.password === d.passwordConfirm, { path: ["passwordConfirm"], message: "兩次輸入的密碼不一致" });

export const zEmail = z.preprocess(
  (v) => (typeof v === "string" ? v.trim().toLowerCase() : v),
  z.email({ error: "Email 格式錯誤" }).max(254, "Email 太長"),
);

export const zOptionalEmail = z.preprocess(
  (v) => (typeof v === "string" ? blankToNull(v.trim().toLowerCase()) : blankToNull(v)),
  z.email({ error: "Email 格式錯誤" }).max(254, "Email 太長").nullable(),
);

export const zOptionalUrl = z.preprocess(
  blankToNull,
  z
    .url({ protocol: /^https?$/, error: "網址需以 http:// 或 https:// 開頭" })
    .max(500, "網址太長")
    .nullable(),
);

// FormData 轉成一般物件（每個欄位取第一個值；檔案欄位一律忽略）
export function formToObject(formData: FormData): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of new Set(formData.keys())) {
    const value = formData.get(key);
    result[key] = typeof value === "string" ? value : null;
  }
  return result;
}

export function validationFailure(error: z.ZodError) {
  return failure("請修正標示的欄位", z.flattenError(error).fieldErrors as FieldErrors);
}

// 從 bind 進來的 id（可能被竄改）轉成正整數
export function parseId(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// 多選欄位（例：圖庫的多張圖片），去重並保留順序
export function parseIdList(formData: FormData, name: string, max = 50): number[] {
  const ids: number[] = [];
  for (const value of formData.getAll(name)) {
    const id = parseId(value);
    if (id && !ids.includes(id)) ids.push(id);
  }
  return ids.slice(0, max);
}

export function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export function isForeignKeyViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003";
}

export function isNotFound(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025";
}
