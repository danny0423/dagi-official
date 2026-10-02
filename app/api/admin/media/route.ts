import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import { getAdminUser } from "@/lib/admin/guard";
import { isSameOrigin, jsonError } from "@/lib/admin/request";
import { MAX_UPLOAD_BYTES, saveUpload, toMediaDTO, UploadError } from "@/lib/media";

// 媒體庫 API（後台登入者皆可用：ADMIN、EDITOR）。
// 上傳走 route handler 而不是 server action：server action 預設只收 1MB，而圖片上限是 10MB。
// 路徑放在 /api/admin 底下，不經過 proxy.ts（proxy 會把 body 緩衝在記憶體，預設只留 10MB）。

const PAGE_SIZE = 30;

// 圖片挑選器用：列出媒體（可搜尋 alt／原始檔名）
export async function GET(request: NextRequest) {
  const user = await getAdminUser();
  if (!user) return jsonError("請先登入", 401);

  const q = request.nextUrl.searchParams.get("q")?.trim().slice(0, 100) ?? "";
  const page = Math.max(1, Number(request.nextUrl.searchParams.get("page")) || 1);
  const where: Prisma.MediaWhereInput = q
    ? {
        OR: [
          { alt: { contains: q, mode: "insensitive" } },
          { originalName: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    prisma.media.findMany({
      where,
      orderBy: { id: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.media.count({ where }),
  ]);

  return Response.json(
    { ok: true, items: items.map(toMediaDTO), page, hasMore: page * PAGE_SIZE < total },
    { headers: { "Cache-Control": "no-store" } },
  );
}

// 上傳一張圖片：multipart/form-data，欄位 file（必填）、alt（選填）
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return jsonError("來源不符", 403);
  const user = await getAdminUser();
  if (!user) return jsonError("請先登入", 401);

  // 先看 Content-Length，明顯超過上限就不讀 body（多留 1MB 給 multipart 標頭）
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_UPLOAD_BYTES + 1024 * 1024) return jsonError("檔案超過 10MB 上限", 413);

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError("請用 multipart/form-data 上傳", 400);
  }

  const file = formData.get("file");
  if (!(file instanceof File)) return jsonError("請選擇要上傳的圖片", 400);
  const alt = formData.get("alt");

  try {
    const media = await saveUpload(file, { alt: typeof alt === "string" ? alt : "", userId: user.id });
    return Response.json({ ok: true, media }, { status: 201 });
  } catch (error) {
    if (error instanceof UploadError) return jsonError(error.message, 400);
    console.error("[media upload]", error);
    return jsonError("上傳失敗，請稍後再試", 500);
  }
}
