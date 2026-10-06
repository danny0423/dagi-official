// 前台顯示用的小工具（純函式，client／server 共用）。日期一律是 lib/site-data 回傳的 YYYY-MM-DD 字串。

/** 2026-10-06 → 2026.10.06 */
export function formatDisplayDate(date: string): string {
  return date.replaceAll("-", ".");
}

/** 2026-03-01 → 2026 年 3 月 */
export function formatYearMonth(date: string): string {
  return `${date.slice(0, 4)} 年 ${Number(date.slice(5, 7))} 月`;
}

/** 工期：開工～完工；只有一邊時寫「○ 開工」「○ 完工」；都沒有回傳 null（不顯示這一列） */
export function projectPeriod(project: { startDate: string | null; endDate: string | null }): string | null {
  const { startDate, endDate } = project;
  if (startDate && endDate) return `${formatYearMonth(startDate)}～${formatYearMonth(endDate)}`;
  if (startDate) return `${formatYearMonth(startDate)}開工`;
  if (endDate) return `${formatYearMonth(endDate)}完工`;
  return null;
}

/** 工程狀態：已完工且有完工日期時寫「2025 年完工」，其他用狀態名稱（規劃中／施工中／已完工） */
export function projectStatusText(project: { status: string; statusLabel: string; endDate: string | null }): string {
  return project.status === "COMPLETED" && project.endDate ? `${project.endDate.slice(0, 4)} 年完工` : project.statusLabel;
}

/** 把有值的項目用分隔符號串起來（空白的略過） */
export function joinPresent(values: (string | null | undefined)[], separator: string): string {
  return values.filter((value): value is string => Boolean(value?.trim())).join(separator);
}
