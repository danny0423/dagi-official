// 媒體（圖片）傳給畫面用的資料格式（client／server 共用）
export type MediaDTO = {
  id: number;
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
  size: number;
  mimeType: string;
  originalName: string | null;
};

export const UPLOAD_ACCEPT = "image/jpeg,image/png,image/webp";
export const UPLOAD_MAX_BYTES = 10 * 1024 * 1024;
