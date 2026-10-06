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

export async function fetchPublicTeamMembers(db: Db = prisma): Promise<StoredTeamMember[]> {
  return db.teamMember.findMany({
    where: publicTeamMemberWhere,
    orderBy,
    select: {
      id: true,
      name: true,
      title: true,
      licenses: true,
      bio: true,
      experience: true,
      photo: { select: imageSelect },
    },
  });
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

export async function fetchPublishedCertifications(db: Db = prisma): Promise<StoredCertification[]> {
  const rows = await db.certification.findMany({
    where: publishedWhere,
    orderBy,
    select: {
      id: true,
      name: true,
      issuer: true,
      certificateNumber: true,
      expiresOn: true,
      note: true,
      image: { select: imageSelect },
    },
  });
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

export type StoredProjectDetail = StoredProjectSummary & {
  client: string | null;
  description: string | null;
  gallery: StoredImage[];
};

/** 已上架的單一工程（含圖庫）；找不到或未上架回傳 null。 */
export async function fetchPublishedProjectBySlug(slug: string, db: Db = prisma): Promise<StoredProjectDetail | null> {
  const row = await db.project.findFirst({
    where: { ...publishedWhere, slug },
    select: {
      ...projectSummarySelect,
      client: true,
      description: true,
      images: { orderBy: { sortOrder: "asc" }, select: { media: { select: imageSelect } } },
    },
  });
  if (!row) return null;
  const { client, description, images, ...summary } = row;
  return { ...toProjectSummary(summary), client, description, gallery: images.map((image) => image.media) };
}

// ───── 最新消息（目前前台只有列表，沒有單篇頁，所以不帶內文） ─────

export type StoredNews = {
  id: number;
  slug: string;
  title: string;
  summary: string | null;
  publishedAt: string;
};

export async function fetchPublishedNews(db: Db = prisma): Promise<StoredNews[]> {
  // 依前台顯示的日期由新到舊；同一天再依後台排序
  const rows = await db.news.findMany({
    where: publishedWhere,
    orderBy: [{ publishedAt: "desc" }, ...orderBy],
    select: { id: true, slug: true, title: true, summary: true, publishedAt: true },
  });
  return rows.map((row) => ({ ...row, publishedAt: dateOnly(row.publishedAt)! }));
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

export async function fetchPublishedJobs(db: Db = prisma): Promise<StoredJob[]> {
  return db.job.findMany({
    where: publishedWhere,
    orderBy,
    select: {
      id: true,
      title: true,
      department: true,
      location: true,
      employmentType: true,
      salary: true,
      description: true,
      requirements: true,
      benefits: true,
    },
  });
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
