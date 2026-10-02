// 後台顯示用的格式化工具（client／server 共用）

const dateTimeFormatter = new Intl.DateTimeFormat("zh-TW", {
  timeZone: "Asia/Taipei",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

// @db.Date 欄位（存成 UTC 午夜）→ YYYY-MM-DD
export function formatDate(date: Date | null | undefined): string {
  return date ? date.toISOString().slice(0, 10) : "";
}

// 建立／更新時間等時間戳 → 台北時間
export function formatDateTime(date: Date | null | undefined): string {
  return date ? dateTimeFormatter.format(date) : "";
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export const inboxStatusLabel = {
  NEW: "未處理",
  IN_PROGRESS: "處理中",
  CLOSED: "已結案",
} as const;

export const projectStatusLabel = {
  PLANNED: "規劃中",
  IN_PROGRESS: "施工中",
  COMPLETED: "已完工",
} as const;

export const roleLabel = {
  ADMIN: "管理員",
  EDITOR: "編輯",
} as const;

// 今天的日期（台北時間）→ YYYY-MM-DD，給日期欄位當預設值
export function todayInTaipei(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Taipei" }).format(new Date());
}
