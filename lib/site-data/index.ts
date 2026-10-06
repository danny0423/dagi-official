import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { connection } from "next/server";
import { projectStatusLabel, todayInTaipei } from "@/lib/admin/format";
import { isCertificationValid } from "@/lib/content";
import { getStorage } from "@/lib/storage";
import { toSiteCompany, type SiteCompany } from "@/lib/site-data/company";
import {
  fetchCompanyRow,
  fetchPublicTeamMembers,
  fetchPublishedCertifications,
  fetchPublishedJobs,
  fetchPublishedNews,
  fetchPublishedNewsBySlug,
  fetchPublishedProjectBySlug,
  fetchPublishedProjects,
  type StoredCertification,
  type StoredImage,
  type StoredJob,
  type StoredNews,
  type StoredNewsDetail,
  type StoredProjectDetail,
  type StoredProjectSummary,
  type StoredTeamMember,
} from "@/lib/site-data/queries";
import { SITE_TAGS } from "@/lib/site-data/tags";

// 前台讀資料的唯一入口（AGENTS.md 已知陷阱）。前台頁面、元件不要直接用 prisma。
//
// 快取做法（docs/tech-architecture.md 第 5 節「前台資料流與快取」）：
// 1. 每個函式先 await connection()：next build（Docker build 階段沒有資料庫）時，Next 在這裡就把頁面標成
//    「請求時才產生」，不會在 build 時連資料庫；正式環境每次請求由伺服器產生完整 HTML（對 SEO 沒有影響）。
// 2. 資料本身用 unstable_cache 快取並掛 SITE_TAGS 標籤，大部分請求不會打到資料庫。
//    後台 server action 寫入成功後呼叫 updateTag(SITE_TAGS.xxx)，下一個請求就讀到新資料（不會先給舊資料）。
//    沒開 Cache Components（cacheComponents），所以不能用 "use cache"／cacheTag；理由見文件。
// 3. REVALIDATE_SECONDS 是保險：有人不經後台直接改資料庫時，最晚這麼久之後也會更新；
//    要立刻更新就到後台儀表板按「重新整理前台快取」（app/admin/_actions/cache.ts）。
// 4. React cache() 讓同一個請求裡（layout、頁面、generateMetadata）重複呼叫只算一次。
// 注意：unstable_cache 會把結果 JSON 序列化，所以 queries.ts 一律回傳字串日期；圖片網址在這裡（快取外）才組。
// 快取存在這個 Next 程序的記憶體與 .next/cache；之後若開多個容器，要改用共用的 cacheHandler，否則各容器各自失效。
// 登入者預覽（含未上架等訪客看不到的內容）不經過這裡的快取，查詢在 lib/site-data/preview.ts；這裡的 toXxx() 轉換函式兩邊共用。

const REVALIDATE_SECONDS = 3600;

// ───── 圖片 ─────

export type SiteImage = { url: string; alt: string; width: number | null; height: number | null };

function toImage(image: StoredImage | null): SiteImage | null {
  return image ? { url: getStorage().getUrl(image.storageKey), alt: image.alt, width: image.width, height: image.height } : null;
}

// ───── 公司資料 ─────

const cachedCompanyRow = unstable_cache(() => fetchCompanyRow(), ["site-data", "company"], {
  tags: [SITE_TAGS.company],
  revalidate: REVALIDATE_SECONDS,
});

/** 公司資料（company_settings）。空白欄位已換成【待填：…】，見 lib/site-data/company.ts。 */
export const getSiteCompany = cache(async (): Promise<SiteCompany> => {
  await connection();
  return toSiteCompany(await cachedCompanyRow());
});

// ───── 團隊成員：已上架且已取得同意公開（lib/content.ts 的 publicTeamMemberWhere） ─────

export type PublicTeamMember = {
  id: number;
  name: string;
  title: string | null;
  /** 一行一張證照 */
  licenses: string[];
  bio: string | null;
  experience: string | null;
  photo: SiteImage | null;
};

const cachedTeamMembers = unstable_cache(() => fetchPublicTeamMembers(), ["site-data", "team"], {
  tags: [SITE_TAGS.team, SITE_TAGS.media],
  revalidate: REVALIDATE_SECONDS,
});

export function toTeamMember(member: StoredTeamMember): PublicTeamMember {
  return {
    ...member,
    licenses: (member.licenses ?? "").split("\n").map((line) => line.trim()).filter(Boolean),
    photo: toImage(member.photo),
  };
}

export const getPublicTeamMembers = cache(async (): Promise<PublicTeamMember[]> => {
  await connection();
  return (await cachedTeamMembers()).map(toTeamMember);
});

// ───── 證照：已上架且未過期 ─────

export type PublicCertification = {
  id: number;
  name: string;
  issuer: string | null;
  certificateNumber: string | null;
  /** YYYY-MM-DD；null 代表無期限 */
  expiresOn: string | null;
  note: string | null;
  image: SiteImage | null;
};

const cachedCertifications = unstable_cache(() => fetchPublishedCertifications(), ["site-data", "certifications"], {
  tags: [SITE_TAGS.certifications, SITE_TAGS.media],
  revalidate: REVALIDATE_SECONDS,
});

export function toCertification(certification: StoredCertification): PublicCertification {
  return { ...certification, image: toImage(certification.image) };
}

/** 快取只存「已上架」的證照；是否過期在每次請求時依台北時間的今天判斷，過期當天之後就不顯示。 */
export const getPublicCertifications = cache(async (): Promise<PublicCertification[]> => {
  await connection();
  const today = todayInTaipei();
  return (await cachedCertifications())
    .filter((certification) => isCertificationValid(certification.expiresOn, today))
    .map(toCertification);
});

// ───── 工程實績 ─────

export type ProjectSummary = Omit<StoredProjectSummary, "cover"> & { statusLabel: string; cover: SiteImage | null };
export type ProjectDetail = ProjectSummary & Pick<StoredProjectDetail, "client" | "description"> & { gallery: SiteImage[] };

export function toProjectSummary(project: StoredProjectSummary): ProjectSummary {
  return { ...project, statusLabel: projectStatusLabel[project.status], cover: toImage(project.cover) };
}

export function toProjectDetail(detail: StoredProjectDetail): ProjectDetail {
  return { ...toProjectSummary(detail), client: detail.client, description: detail.description, gallery: detail.gallery.map((image) => toImage(image)!) };
}

const cachedProjects = unstable_cache(() => fetchPublishedProjects(), ["site-data", "projects"], {
  tags: [SITE_TAGS.projects, SITE_TAGS.media],
  revalidate: REVALIDATE_SECONDS,
});

const cachedProjectDetail = unstable_cache((slug: string) => fetchPublishedProjectBySlug(slug), ["site-data", "project"], {
  tags: [SITE_TAGS.projects, SITE_TAGS.media],
  revalidate: REVALIDATE_SECONDS,
});

/** 已上架的工程實績（列表、sitemap 用），排序同後台。 */
export const getPublishedProjects = cache(async (): Promise<ProjectSummary[]> => {
  await connection();
  return (await cachedProjects()).map(toProjectSummary);
});

/** 首頁精選：已上架且勾了「首頁精選」，依後台排序取前幾筆。 */
export async function getFeaturedProjects(limit = 3): Promise<ProjectSummary[]> {
  return (await getPublishedProjects()).filter((project) => project.featured).slice(0, limit);
}

/**
 * 依網址代稱取已上架的單一工程（含圖庫）；找不到回傳 null。
 * 先用已快取的列表確認代稱存在，才查單筆：隨便亂打的網址不會各自建立一筆快取。
 * slug 要先用 decodeSlugParam() 解碼。
 */
export const getProjectBySlug = cache(async (slug: string): Promise<ProjectDetail | null> => {
  const projects = await getPublishedProjects();
  if (!projects.some((project) => project.slug === slug)) return null;
  const detail = await cachedProjectDetail(slug);
  return detail ? toProjectDetail(detail) : null;
});

/**
 * 動態路由的 params.slug → 資料庫裡的代稱。代稱可能含中文，而 Next 16 傳給頁面的 params 是
 * encodeURIComponent 過的值（next/dist/shared/lib/router/utils/get-dynamic-param.js 的 getParamValue），
 * 「台中-辦公大樓」會變成 %E5%8F%B0…，所以要解碼。合法代稱不含 %，所以解到沒有 % 為止都不會解錯
 * （最多 3 次，防萬一經過代理被重複編碼）；解不開（格式錯誤的 % 編碼）回傳 null。
 */
export function decodeSlugParam(raw: string): string | null {
  let slug = raw;
  for (let i = 0; i < 3 && slug.includes("%"); i++) {
    try {
      slug = decodeURIComponent(slug);
    } catch {
      return null;
    }
  }
  return slug;
}

// ───── 最新消息 ─────

export type PublicNews = StoredNews;
export type NewsDetail = Omit<StoredNewsDetail, "cover"> & { cover: SiteImage | null };

export function toNewsDetail(news: StoredNewsDetail): NewsDetail {
  return { ...news, cover: toImage(news.cover) };
}

const cachedNews = unstable_cache(() => fetchPublishedNews(), ["site-data", "news"], {
  tags: [SITE_TAGS.news],
  revalidate: REVALIDATE_SECONDS,
});

const cachedNewsDetail = unstable_cache((slug: string) => fetchPublishedNewsBySlug(slug), ["site-data", "news-detail"], {
  tags: [SITE_TAGS.news, SITE_TAGS.media],
  revalidate: REVALIDATE_SECONDS,
});

/** 已上架的最新消息（列表、sitemap 用），依日期由新到舊。 */
export const getPublishedNews = cache(async (): Promise<PublicNews[]> => {
  await connection();
  return cachedNews();
});

/**
 * 依網址代稱取已上架的單篇消息（含內文、封面）；找不到回傳 null。
 * 跟 getProjectBySlug 一樣先用已快取的列表確認代稱存在才查單筆，亂打的網址不會各自建立一筆快取。
 * slug 要先用 decodeSlugParam() 解碼。
 */
export const getNewsBySlug = cache(async (slug: string): Promise<NewsDetail | null> => {
  const news = await getPublishedNews();
  if (!news.some((item) => item.slug === slug)) return null;
  const detail = await cachedNewsDetail(slug);
  return detail ? toNewsDetail(detail) : null;
});

// ───── 職缺 ─────

export type PublicJob = StoredJob;

const cachedJobs = unstable_cache(() => fetchPublishedJobs(), ["site-data", "jobs"], {
  tags: [SITE_TAGS.jobs],
  revalidate: REVALIDATE_SECONDS,
});

export const getPublishedJobs = cache(async (): Promise<PublicJob[]> => {
  await connection();
  return cachedJobs();
});

export type { SiteCompany } from "@/lib/site-data/company";
