import { prisma } from "@/lib/db";
import type { PrismaClient } from "@/lib/generated/prisma/client";
import {
  featuredProjectWhere,
  publicCertificationWhere,
  publicTeamMemberWhere,
  publishedWhere,
} from "@/lib/content";
import type { CompanyRow } from "@/lib/site-data/company";

// 前台資料的資料庫查詢（不含快取）。只 select 前台需要的欄位，回傳值一律可以 JSON 序列化
// （日期轉成 YYYY-MM-DD 字串、圖片只帶 storageKey），因為 lib/site-data/index.ts 的快取會 JSON 序列化。
// 圖片網址不在這裡組：網址依 STORAGE_DRIVER 決定，由 index.ts 在每次請求時用 lib/storage 的 getUrl() 組，換儲存體不會讀到舊網址。
// 這個檔案不依賴 Next.js，scripts/ 可以直接呼叫（例如 check-launch、驗證用的小腳本）；db 參數讓腳本傳入自己設定逾時的連線。
// 名稱帶 ForPreview 的查詢只給登入者預覽用（lib/site-data/preview.ts），會含未上架等訪客看不到的資料，不可以放進公開快取。

type Db = Pick<PrismaClient, "companySettings" | "teamMember" | "certification" | "project" | "news" | "job">;

export type StoredImage = { storageKey: string; alt: string; width: number | null; height: number | null };

const imageSelect = { storageKey: true, alt: true, width: true, height: true } as const;

/** @db.Date（存成 UTC 午夜）→ YYYY-MM-DD */
function dateOnly(date: Date | null): string | null {
  return date ? date.toISOString().slice(0, 10) : null;
}

// 列表排序與後台一致（lib/admin/content.ts 的 contentOrderBy）：sortOrder 小的在前，同值時新的在前
const orderBy = [{ sortOrder: "asc" as const }, { id: "desc" as const }];

// ───── 公司資料 ─────

export async function fetchCompanyRow(db: Db = prisma): Promise<CompanyRow | null> {
  const row = await db.companySettings.findUnique({
    where: { id: 1 },
    select: {
      name: true,
      englishName: true,
      taxId: true,
      representative: true,
      foundedOn: true,
      contractorGrade: true,
      licenseNumber: true,
      registeredCity: true,
      registrationAuthority: true,
      capital: true,
      engineerCount: true,
      address: true,
      phone: true,
      fax: true,
      email: true,
      serviceHours: true,
      responseTime: true,
      groupUrl: true,
      description: true,
    },
  });
  return row ? { ...row, foundedOn: dateOnly(row.foundedOn) } : null;
}

// ───── 團隊成員 ─────

export type StoredTeamMember = {
  id: number;
  name: string;
  title: string | null;
  licenses: string | null;
  bio: string | null;
  experience: string | null;
  photo: StoredImage | null;
};

const teamMemberSelect = {
  id: true,
  name: true,
  title: true,
  licenses: true,
  bio: true,
  experience: true,
  photo: { select: imageSelect },
} as const;

export async function fetchPublicTeamMembers(db: Db = prisma): Promise<StoredTeamMember[]> {
  return db.teamMember.findMany({ where: publicTeamMemberWhere, orderBy, select: teamMemberSelect });
}

/** 預覽用：全部成員（含未上架、未同意公開），附上判斷標籤用的欄位。 */
export async function fetchTeamMembersForPreview(db: Db = prisma): Promise<(StoredTeamMember & { published: boolean; consentToPublish: boolean })[]> {
  return db.teamMember.findMany({ orderBy, select: { ...teamMemberSelect, published: true, consentToPublish: true } });
}

// ───── 證照（只篩「已上架」；過期與否由呼叫端依當天日期判斷） ─────

export type StoredCertification = {
  id: number;
  name: string;
  issuer: string | null;
  certificateNumber: string | null;
  expiresOn: string | null;
  note: string | null;
  image: StoredImage | null;
};

const certificationSelect = {
  id: true,
  name: true,
  issuer: true,
  certificateNumber: true,
  expiresOn: true,
  note: true,
  image: { select: imageSelect },
} as const;

export async function fetchPublishedCertifications(db: Db = prisma): Promise<StoredCertification[]> {
  const rows = await db.certification.findMany({ where: publishedWhere, orderBy, select: certificationSelect });
  return rows.map((row) => ({ ...row, expiresOn: dateOnly(row.expiresOn) }));
}

/** 預覽用：全部證照（含未上架；過期與否同樣由呼叫端判斷）。 */
export async function fetchCertificationsForPreview(db: Db = prisma): Promise<(StoredCertification & { published: boolean })[]> {
  const rows = await db.certification.findMany({ orderBy, select: { ...certificationSelect, published: true } });
  return rows.map((row) => ({ ...row, expiresOn: dateOnly(row.expiresOn) }));
}

// ───── 工程實績 ─────

export type ProjectStatus = "PLANNED" | "IN_PROGRESS" | "COMPLETED";

export type StoredProjectSummary = {
  id: number;
  slug: string;
  title: string;
  category: string | null;
  location: string | null;
  structure: string | null;
  scale: string | null;
  status: ProjectStatus;
  startDate: string | null;
  endDate: string | null;
  summary: string | null;
  featured: boolean;
  /** ISO 時間，給 sitemap 的 lastModified */
  updatedAt: string;
  cover: StoredImage | null;
};

const projectSummarySelect = {
  id: true,
  slug: true,
  title: true,
  category: true,
  location: true,
  structure: true,
  scale: true,
  status: true,
  startDate: true,
  endDate: true,
  summary: true,
  featured: true,
  updatedAt: true,
  coverImage: { select: imageSelect },
} as const;

function toProjectSummary(row: {
  id: number;
  slug: string;
  title: string;
  category: string | null;
  location: string | null;
  structure: string | null;
  scale: string | null;
  status: ProjectStatus;
  startDate: Date | null;
  endDate: Date | null;
  summary: string | null;
  featured: boolean;
  updatedAt: Date;
  coverImage: StoredImage | null;
}): StoredProjectSummary {
  const { coverImage, startDate, endDate, updatedAt, ...rest } = row;
  return {
    ...rest,
    startDate: dateOnly(startDate),
    endDate: dateOnly(endDate),
    updatedAt: updatedAt.toISOString(),
    cover: coverImage,
  };
}

export async function fetchPublishedProjects(db: Db = prisma): Promise<StoredProjectSummary[]> {
  const rows = await db.project.findMany({ where: publishedWhere, orderBy, select: projectSummarySelect });
  return rows.map(toProjectSummary);
}

/** 預覽用：全部工程（含未上架）。 */
export async function fetchProjectsForPreview(db: Db = prisma): Promise<(StoredProjectSummary & { published: boolean })[]> {
  const rows = await db.project.findMany({ orderBy, select: { ...projectSummarySelect, published: true } });
  return rows.map((row) => ({ ...toProjectSummary(row), published: row.published }));
}

export type StoredProjectDetail = StoredProjectSummary & {
  client: string | null;
  description: string | null;
  gallery: StoredImage[];
};

const projectDetailSelect = {
  ...projectSummarySelect,
  client: true,
  description: true,
  images: { orderBy: { sortOrder: "asc" as const }, select: { media: { select: imageSelect } } },
} as const;

type ProjectDetailRow = Parameters<typeof toProjectSummary>[0] & {
  client: string | null;
  description: string | null;
  images: { media: StoredImage }[];
};

function toProjectDetail(row: ProjectDetailRow): StoredProjectDetail {
  const { client, description, images, ...summary } = row;
  return { ...toProjectSummary(summary), client, description, gallery: images.map((image) => image.media) };
}

/** 已上架的單一工程（含圖庫）；找不到或未上架回傳 null。 */
export async function fetchPublishedProjectBySlug(slug: string, db: Db = prisma): Promise<StoredProjectDetail | null> {
  const row = await db.project.findFirst({ where: { ...publishedWhere, slug }, select: projectDetailSelect });
  return row ? toProjectDetail(row) : null;
}

/** 預覽用：單一工程（不論是否上架）；找不到回傳 null。 */
export async function fetchProjectBySlugForPreview(slug: string, db: Db = prisma): Promise<(StoredProjectDetail & { published: boolean }) | null> {
  const row = await db.project.findFirst({ where: { slug }, select: { ...projectDetailSelect, published: true } });
  if (!row) return null;
  const { published, ...detail } = row;
  return { ...toProjectDetail(detail), published };
}

// ───── 最新消息（列表不帶內文；內文與封面在單篇頁才查） ─────

export type StoredNews = {
  id: number;
  slug: string;
  title: string;
  summary: string | null;
  /** YYYY-MM-DD，前台顯示的消息日期 */
  publishedAt: string;
  /** ISO 時間，給 sitemap 的 lastModified */
  updatedAt: string;
};

export type StoredNewsDetail = StoredNews & {
  content: string;
  cover: StoredImage | null;
};

const newsSelect = { id: true, slug: true, title: true, summary: true, publishedAt: true, updatedAt: true } as const;
const newsDetailSelect = { ...newsSelect, content: true, coverImage: { select: imageSelect } } as const;
// 依前台顯示的日期由新到舊；同一天再依後台排序
const newsOrderBy = [{ publishedAt: "desc" as const }, ...orderBy];

type NewsRow = Omit<StoredNews, "publishedAt" | "updatedAt"> & { publishedAt: Date; updatedAt: Date };

function toStoredNews(row: NewsRow): StoredNews {
  const { id, slug, title, summary, publishedAt, updatedAt } = row;
  return { id, slug, title, summary, publishedAt: dateOnly(publishedAt)!, updatedAt: updatedAt.toISOString() };
}

function toStoredNewsDetail(row: NewsRow & { content: string; coverImage: StoredImage | null }): StoredNewsDetail {
  return { ...toStoredNews(row), content: row.content, cover: row.coverImage };
}

export async function fetchPublishedNews(db: Db = prisma): Promise<StoredNews[]> {
  const rows = await db.news.findMany({ where: publishedWhere, orderBy: newsOrderBy, select: newsSelect });
  return rows.map(toStoredNews);
}

/** 預覽用：全部消息（含未上架）。 */
export async function fetchNewsForPreview(db: Db = prisma): Promise<(StoredNews & { published: boolean })[]> {
  const rows = await db.news.findMany({ orderBy: newsOrderBy, select: { ...newsSelect, published: true } });
  return rows.map((row) => ({ ...toStoredNews(row), published: row.published }));
}

/** 已上架的單篇消息（含內文、封面）；找不到或未上架回傳 null。 */
export async function fetchPublishedNewsBySlug(slug: string, db: Db = prisma): Promise<StoredNewsDetail | null> {
  const row = await db.news.findFirst({ where: { ...publishedWhere, slug }, select: newsDetailSelect });
  return row ? toStoredNewsDetail(row) : null;
}

/** 預覽用：單篇消息（不論是否上架）；找不到回傳 null。 */
export async function fetchNewsBySlugForPreview(slug: string, db: Db = prisma): Promise<(StoredNewsDetail & { published: boolean }) | null> {
  const row = await db.news.findFirst({ where: { slug }, select: { ...newsDetailSelect, published: true } });
  return row ? { ...toStoredNewsDetail(row), published: row.published } : null;
}

// ───── 職缺 ─────

export type StoredJob = {
  id: number;
  title: string;
  department: string | null;
  location: string | null;
  employmentType: string | null;
  salary: string | null;
  description: string | null;
  requirements: string | null;
  benefits: string | null;
};

const jobSelect = {
  id: true,
  title: true,
  department: true,
  location: true,
  employmentType: true,
  salary: true,
  description: true,
  requirements: true,
  benefits: true,
} as const;

export async function fetchPublishedJobs(db: Db = prisma): Promise<StoredJob[]> {
  return db.job.findMany({ where: publishedWhere, orderBy, select: jobSelect });
}

/** 預覽用：全部職缺（含未上架）。 */
export async function fetchJobsForPreview(db: Db = prisma): Promise<(StoredJob & { published: boolean })[]> {
  return db.job.findMany({ orderBy, select: { ...jobSelect, published: true } });
}

// ───── 上線前檢查用：各種內容在前台有沒有資料（沒有時前台顯示待填範例） ─────

export type PublicContentCounts = {
  team: number;
  certifications: number;
  projects: number;
  featuredProjects: number;
  news: number;
  jobs: number;
};

export async function countPublicContent(today: string, db: Db = prisma): Promise<PublicContentCounts> {
  const [team, certifications, projects, featuredProjects, news, jobs] = await Promise.all([
    db.teamMember.count({ where: publicTeamMemberWhere }),
    db.certification.count({ where: publicCertificationWhere(today) }),
    db.project.count({ where: publishedWhere }),
    db.project.count({ where: featuredProjectWhere }),
    db.news.count({ where: publishedWhere }),
    db.job.count({ where: publishedWhere }),
  ]);
  return { team, certifications, projects, featuredProjects, news, jobs };
}
