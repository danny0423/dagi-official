import "server-only";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { assertValidKey, type StorageDriver } from "@/lib/storage/types";

// 本機儲存：檔案放在 <專案根目錄>/storage/uploads/（已 gitignore），可用 STORAGE_LOCAL_DIR 改位置。
// 正式環境（standalone）不會服務執行期新增的 public/ 檔案，所以改由 app/media/[...path]/route.ts 讀檔回傳。
// Docker 部署時要把這個資料夾掛成 volume，否則容器重建後圖片會消失。

export function localRoot(): string {
  return path.resolve(process.env.STORAGE_LOCAL_DIR || path.join(process.cwd(), "storage", "uploads"));
}

// 把網址路徑片段轉成檔案路徑；不合法（含 ..、絕對路徑、怪字元）或跑出根目錄時回傳 null
export function resolveLocalPath(segments: string[]): string | null {
  if (segments.length === 0 || segments.length > 5) return null;
  if (!segments.every((s) => /^[A-Za-z0-9_-][A-Za-z0-9._-]*$/.test(s) && !s.includes(".."))) return null;
  const root = localRoot();
  const filePath = path.resolve(root, ...segments);
  return filePath.startsWith(root + path.sep) ? filePath : null;
}

export async function readLocalFile(filePath: string): Promise<Buffer | null> {
  try {
    return await readFile(filePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

export const localStorageDriver: StorageDriver = {
  name: "local",

  async put(key, body) {
    assertValidKey(key);
    const filePath = path.join(localRoot(), key);
    await mkdir(path.dirname(filePath), { recursive: true });
    // wx：檔案已存在就失敗，絕不覆寫
    await writeFile(filePath, body, { flag: "wx" });
  },

  async delete(key) {
    assertValidKey(key);
    try {
      await unlink(path.join(localRoot(), key));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  },

  getUrl(key) {
    return `/media/${key}`;
  },
};
