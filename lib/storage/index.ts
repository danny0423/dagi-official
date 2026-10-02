import "server-only";
import { localStorageDriver } from "@/lib/storage/local";
import { s3StorageDriver } from "@/lib/storage/s3";
import type { StorageDriver } from "@/lib/storage/types";

// 用 STORAGE_DRIVER 切換圖片儲存位置：local（預設）或 s3。
// 資料庫只存相對路徑（media.storage_key），網址在讀取時才組，所以切換不用改資料，
// 但要先把舊檔案搬到新的儲存體（storage/uploads/ 底下的結構＝S3 的 key）。
export function getStorage(): StorageDriver {
  const driver = (process.env.STORAGE_DRIVER || "local").trim().toLowerCase();
  if (driver === "local") return localStorageDriver;
  if (driver === "s3") return s3StorageDriver;
  throw new Error(`不支援的 STORAGE_DRIVER：${driver}（只能是 local 或 s3）`);
}

export type { StorageDriver } from "@/lib/storage/types";
