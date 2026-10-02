// 圖片儲存介面。實作：local（本機 storage/uploads/）、s3（AWS S3）。
// key 是儲存體內的相對路徑，例如 2026/10/<32 碼隨機 hex>.png，由 lib/media.ts 產生。
export interface StorageDriver {
  readonly name: "local" | "s3";
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  delete(key: string): Promise<void>;
  // 前台／後台使用的公開網址
  getUrl(key: string): string;
}

// 只接受系統產生的 key 格式，避免路徑穿越或覆寫到其他檔案
export const STORAGE_KEY_PATTERN = /^\d{4}\/\d{2}\/[a-f0-9]{32}\.(jpg|png|webp)$/;

export function assertValidKey(key: string): void {
  if (!STORAGE_KEY_PATTERN.test(key)) throw new Error(`不合法的儲存路徑：${key}`);
}
