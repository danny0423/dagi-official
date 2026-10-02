import "server-only";
import { randomBytes } from "node:crypto";
import path from "node:path";
import { imageSize } from "image-size";
import { prisma } from "@/lib/db";
import { getStorage } from "@/lib/storage";
import { UPLOAD_MAX_BYTES, type MediaDTO } from "@/lib/media-types";

// 圖片上傳與媒體庫共用邏輯。限制：只收 JPG／PNG／WebP、單檔 10MB；檔名一律改成隨機 id。

export const MAX_UPLOAD_BYTES = UPLOAD_MAX_BYTES;

// 以檔案實際內容（magic bytes）判斷類型，不相信用戶端給的副檔名或 MIME
const DETECTED_TYPES = {
  jpg: { mime: "image/jpeg", ext: "jpg" },
  png: { mime: "image/png", ext: "png" },
  webp: { mime: "image/webp", ext: "webp" },
} as const;

export const ALLOWED_UPLOAD_MIME: readonly string[] = ["image/jpeg", "image/png", "image/webp"];

export class UploadError extends Error {}

export type { MediaDTO } from "@/lib/media-types";

export function toMediaDTO(media: {
  id: number;
  storageKey: string;
  alt: string;
  width: number | null;
  height: number | null;
  size: number;
  mimeType: string;
  originalName: string | null;
}): MediaDTO {
  return {
    id: media.id,
    url: getStorage().getUrl(media.storageKey),
    alt: media.alt,
    width: media.width,
    height: media.height,
    size: media.size,
    mimeType: media.mimeType,
    originalName: media.originalName,
  };
}

function cleanOriginalName(name: string): string | null {
  const base = path.basename(name).replace(/[\u0000-\u001f\u007f]/g, "").trim();
  return base ? base.slice(0, 200) : null;
}

export async function saveUpload(file: File, options: { alt?: string; userId: number }): Promise<MediaDTO> {
  if (file.size === 0) throw new UploadError("檔案是空的");
  if (file.size > MAX_UPLOAD_BYTES) throw new UploadError("檔案超過 10MB 上限");
  if (file.type && !ALLOWED_UPLOAD_MIME.includes(file.type)) {
    throw new UploadError("只接受 JPG、PNG、WebP 圖片");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let info: ReturnType<typeof imageSize>;
  try {
    info = imageSize(buffer);
  } catch {
    throw new UploadError("無法辨識圖片內容，檔案可能損壞或不是圖片");
  }
  const detected = DETECTED_TYPES[info.type as keyof typeof DETECTED_TYPES];
  if (!detected) throw new UploadError("只接受 JPG、PNG、WebP 圖片");

  // EXIF 方向 5～8 代表顯示時會轉 90 度，寬高要對調
  const rotated = info.orientation !== undefined && info.orientation >= 5;
  const width = (rotated ? info.height : info.width) ?? null;
  const height = (rotated ? info.width : info.height) ?? null;

  const now = new Date();
  const key = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${randomBytes(16).toString("hex")}.${detected.ext}`;

  const storage = getStorage();
  await storage.put(key, buffer, detected.mime);
  try {
    const media = await prisma.media.create({
      data: {
        storageKey: key,
        originalName: cleanOriginalName(file.name),
        alt: (options.alt ?? "").trim().slice(0, 300),
        width,
        height,
        size: buffer.length,
        mimeType: detected.mime,
        uploadedById: options.userId,
      },
    });
    return toMediaDTO(media);
  } catch (error) {
    // 寫資料庫失敗就把剛存的檔案刪掉，避免留下沒人管的檔案
    await storage.delete(key).catch(() => {});
    throw error;
  }
}

export type MediaUsage = { label: string; href: string };

// 列出引用這張圖的內容（刪除前提示用）
export async function getMediaUsage(id: number): Promise<MediaUsage[]> {
  const media = await prisma.media.findUnique({
    where: { id },
    select: {
      projectCovers: { select: { id: true, title: true } },
      projectGallery: { select: { project: { select: { id: true, title: true } } } },
      newsCovers: { select: { id: true, title: true } },
      teamPhotos: { select: { id: true, name: true } },
      certificationImages: { select: { id: true, name: true } },
    },
  });
  if (!media) return [];
  return [
    ...media.projectCovers.map((p) => ({ label: `工程實績「${p.title}」封面`, href: `/admin/projects/${p.id}` })),
    ...media.projectGallery.map(({ project: p }) => ({
      label: `工程實績「${p.title}」圖庫`,
      href: `/admin/projects/${p.id}`,
    })),
    ...media.newsCovers.map((n) => ({ label: `最新消息「${n.title}」封面`, href: `/admin/news/${n.id}` })),
    ...media.teamPhotos.map((t) => ({ label: `團隊成員「${t.name}」照片`, href: `/admin/team/${t.id}` })),
    ...media.certificationImages.map((c) => ({
      label: `證照「${c.name}」圖片`,
      href: `/admin/certifications/${c.id}`,
    })),
  ];
}

// 供 Prisma select 用：計算每張圖被引用幾次
export const mediaUsageCountSelect = {
  _count: {
    select: {
      projectCovers: true,
      projectGallery: true,
      newsCovers: true,
      teamPhotos: true,
      certificationImages: true,
    },
  },
} as const;

export function sumUsage(count: Record<string, number>): number {
  return Object.values(count).reduce((a, b) => a + b, 0);
}
