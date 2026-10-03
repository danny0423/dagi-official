// 網址代稱（slug）規則：client（自動產生、離開欄位時整理）與 server（驗證）共用，不能加 "server-only"。
// 允許：中文（漢字）、英文小寫、數字、連字號（-）。空白轉成 -，其他符號一律去掉。
// 例：「台中 辦公大樓（2026）」→「台中-辦公大樓2026」

export const SLUG_MAX_LENGTH = 100;

// 一段或多段「漢字／英數」，段與段之間用單一個 - 連接，頭尾不能是 -
export const SLUG_PATTERN = /^[\p{Script=Han}a-z0-9]+(?:-[\p{Script=Han}a-z0-9]+)*$/u;

export const SLUG_RULE_TEXT = "只能用中文、英文小寫、數字與連字號（-）";

// 全形英數轉半形、英文轉小寫（NFKC 會把「ＡＢＣ１２３」轉成「ABC123」、全形空白轉成一般空白）
export function normalizeSlugInput(value: string): string {
  return value.normalize("NFKC").trim().toLowerCase();
}

// 把任意文字（通常是標題）轉成合法的網址代稱；轉不出任何字元時回傳空字串
export function slugify(value: string): string {
  return truncateSlug(
    normalizeSlugInput(value)
      .replace(/\s+/gu, "-")
      .replace(/[^\p{Script=Han}a-z0-9-]/gu, "")
      .replace(/-{2,}/g, "-")
      .replace(/^-+|-+$/g, ""),
    SLUG_MAX_LENGTH,
  );
}

// 截到指定長度（以 Unicode 字元計），並去掉截斷後留在尾端的 -
export function truncateSlug(slug: string, max: number): string {
  const chars = Array.from(slug);
  if (chars.length <= max) return slug;
  return chars.slice(0, max).join("").replace(/-+$/g, "");
}

export function slugLength(slug: string): number {
  return Array.from(slug).length;
}
