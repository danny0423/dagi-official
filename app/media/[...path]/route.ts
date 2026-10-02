import path from "node:path";
import { getStorage } from "@/lib/storage";
import { readLocalFile, resolveLocalPath } from "@/lib/storage/local";

// 本機儲存模式（STORAGE_DRIVER=local）下，提供 storage/uploads/ 裡的圖片給前台與後台。
// 正式環境 standalone 輸出不會服務執行期才新增到 public/ 的檔案，所以用這個 route 讀檔。
// 防護：只接受系統產生格式的路徑片段、擋 ..、只回傳圖片 MIME。

const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

function notFound() {
  return new Response("Not Found", { status: 404, headers: { "Cache-Control": "no-store" } });
}

export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  if (getStorage().name !== "local") return notFound();

  const { path: segments } = await params;
  const filePath = resolveLocalPath(segments);
  if (!filePath) return notFound();

  const mime = MIME_BY_EXT[path.extname(filePath).toLowerCase()];
  if (!mime) return notFound();

  const file = await readLocalFile(filePath);
  if (!file) return notFound();

  return new Response(new Uint8Array(file), {
    headers: {
      "Content-Type": mime,
      "Content-Length": String(file.length),
      // 檔名是隨機 id、上傳後不會被覆寫，可以長期快取
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
