import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import { todayInTaipei } from "@/lib/admin/format";
import { isCertificationValid } from "@/lib/content";
import {
  toCertification,
  toNewsDetail,
  toProjectDetail,
  toProjectSummary,
  toTeamMember,
  type NewsDetail,
  type ProjectDetail,
  type ProjectSummary,
  type PublicCertification,
  type PublicJob,
  type PublicNews,
  type PublicTeamMember,
} from "@/lib/site-data";
import {
  fetchCertificationsForPreview,
  fetchJobsForPreview,
  fetchNewsBySlugForPreview,
  fetchNewsForPreview,
  fetchProjectBySlugForPreview,
  fetchProjectsForPreview,
  fetchTeamMembersForPreview,
} from "@/lib/site-data/queries";

// ⚠ 只給登入者預覽用：先確認 lib/preview.ts 的 isAdminPreview() 為 true 才呼叫，訪客一律用 lib/site-data/index.ts 的公開函式。
//
// 跟公開函式的差別：
//   - 包含訪客看不到的資料（未上架、團隊成員未同意公開、證照已過期），每一筆帶 previewLabels 說明訪客為什麼看不到；
//     訪客看得到的那幾筆 previewLabels 是空陣列。
//   - 不走 unstable_cache：每次請求直接查資料庫，不讀也不寫公開快取，訪客看到的內容與快取完全不受影響。
//     React cache() 只在同一個請求內去重（頁面＋generateMetadata 各呼叫一次只查一次），請求結束就丟掉。
//   - 回傳型別＝公開型別＋previewLabels，頁面可以用同一段 JSX 顯示，再用 components/preview-labels.tsx 加標籤。

export const PREVIEW_LABELS = {
  unpublished: "未上架・只有你看得到",
  noConsent: "未同意公開・訪客看不到",
  expired: "已過期・訪客看不到",
} as const;

/** 預覽資料多出來的欄位：訪客看不到這一筆的原因（看得到時是空陣列）。 */
export type PreviewMark = { previewLabels: string[] };
/** 頁面同時接受公開資料與預覽資料時的型別（公開資料沒有 previewLabels）。 */
export type MaybePreview<T> = T & Partial<PreviewMark>;

function labels(conditions: [boolean, string][]): string[] {
  return conditions.filter(([hidden]) => hidden).map(([, label]) => label);
}

const unpublishedLabel = (published: boolean) => labels([[!published, PREVIEW_LABELS.unpublished]]);

// ───── 團隊成員：全部（含未上架、未同意公開） ─────

export const getPreviewTeamMembers = cache(async (): Promise<(PublicTeamMember & PreviewMark)[]> => {
  await connection();
  return (await fetchTeamMembersForPreview()).map(({ published, consentToPublish, ...member }) => ({
    ...toTeamMember(member),
    previewLabels: labels([
      [!published, PREVIEW_LABELS.unpublished],
      [!consentToPublish, PREVIEW_LABELS.noConsent],
    ]),
  }));
});

// ───── 證照：全部（含未上架、已過期；過期判斷同公開版，依台北時間的今天） ─────

export const getPreviewCertifications = cache(async (): Promise<(PublicCertification & PreviewMark)[]> => {
  await connection();
  const today = todayInTaipei();
  return (await fetchCertificationsForPreview()).map(({ published, ...certification }) => ({
    ...toCertification(certification),
    previewLabels: labels([
      [!published, PREVIEW_LABELS.unpublished],
      [!isCertificationValid(certification.expiresOn, today), PREVIEW_LABELS.expired],
    ]),
  }));
});

// ───── 工程實績 ─────

export const getPreviewProjects = cache(async (): Promise<(ProjectSummary & PreviewMark)[]> => {
  await connection();
  return (await fetchProjectsForPreview()).map(({ published, ...project }) => ({
    ...toProjectSummary(project),
    previewLabels: unpublishedLabel(published),
  }));
});

/** slug 要先用 decodeSlugParam() 解碼。 */
export const getPreviewProjectBySlug = cache(async (slug: string): Promise<(ProjectDetail & PreviewMark) | null> => {
  await connection();
  const row = await fetchProjectBySlugForPreview(slug);
  if (!row) return null;
  const { published, ...detail } = row;
  return { ...toProjectDetail(detail), previewLabels: unpublishedLabel(published) };
});

// ───── 最新消息 ─────

export const getPreviewNews = cache(async (): Promise<(PublicNews & PreviewMark)[]> => {
  await connection();
  return (await fetchNewsForPreview()).map(({ published, ...news }) => ({ ...news, previewLabels: unpublishedLabel(published) }));
});

/** slug 要先用 decodeSlugParam() 解碼。 */
export const getPreviewNewsBySlug = cache(async (slug: string): Promise<(NewsDetail & PreviewMark) | null> => {
  await connection();
  const row = await fetchNewsBySlugForPreview(slug);
  if (!row) return null;
  const { published, ...detail } = row;
  return { ...toNewsDetail(detail), previewLabels: unpublishedLabel(published) };
});

// ───── 職缺 ─────

export const getPreviewJobs = cache(async (): Promise<(PublicJob & PreviewMark)[]> => {
  await connection();
  return (await fetchJobsForPreview()).map(({ published, ...job }) => ({ ...job, previewLabels: unpublishedLabel(published) }));
});
