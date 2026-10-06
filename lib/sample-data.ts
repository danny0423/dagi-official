import type { Prisma, PrismaClient } from "@/lib/generated/prisma/client";

// 範例資料（npm run db:seed:samples 建立、npm run db:clear:samples 清除）的判斷規則。
// 後台儀表板（提醒上線前要清掉）與 prisma/ 底下的腳本共用，所以不能加 "server-only"。
//
// 範例資料一律「標題／名稱以【範例】開頭」，清除時只認這個標記：
// - 內容（工程實績、最新消息、職缺、團隊成員、證照）：標題或名稱以【範例】開頭
// - 收件匣：前台表單任何人都能送，所以多加一個條件：Email 是 @example.com（保留給範例用的網域，真實來信不會用）
// - 圖片：原始檔名以【範例】開頭，而且沒有上傳者（後台上傳一定會記錄上傳者，所以不會誤刪真的上傳檔）
// 改過標題、拿掉【範例】的資料就不再視為範例，清除時會保留。

export const SAMPLE_PREFIX = "【範例】";
export const SAMPLE_EMAIL_DOMAIN = "@example.com";

const startsWithSample = { startsWith: SAMPLE_PREFIX };
const sampleEmail = { endsWith: SAMPLE_EMAIL_DOMAIN };

export const sampleWhere = {
  project: { title: startsWithSample } satisfies Prisma.ProjectWhereInput,
  news: { title: startsWithSample } satisfies Prisma.NewsWhereInput,
  job: { title: startsWithSample } satisfies Prisma.JobWhereInput,
  teamMember: { name: startsWithSample } satisfies Prisma.TeamMemberWhereInput,
  certification: { name: startsWithSample } satisfies Prisma.CertificationWhereInput,
  inquiry: { name: startsWithSample, email: sampleEmail } satisfies Prisma.InquiryWhereInput,
  vendorApplication: { companyName: startsWithSample, email: sampleEmail } satisfies Prisma.VendorApplicationWhereInput,
  media: { originalName: startsWithSample, uploadedById: null } satisfies Prisma.MediaWhereInput,
};

type Db = Pick<
  PrismaClient,
  "project" | "news" | "job" | "teamMember" | "certification" | "inquiry" | "vendorApplication" | "media"
>;

export type SampleCounts = Record<keyof typeof sampleWhere, number>;

/** 各種範例資料的筆數 */
export async function countSampleData(db: Db): Promise<SampleCounts> {
  const [project, news, job, teamMember, certification, inquiry, vendorApplication, media] = await Promise.all([
    db.project.count({ where: sampleWhere.project }),
    db.news.count({ where: sampleWhere.news }),
    db.job.count({ where: sampleWhere.job }),
    db.teamMember.count({ where: sampleWhere.teamMember }),
    db.certification.count({ where: sampleWhere.certification }),
    db.inquiry.count({ where: sampleWhere.inquiry }),
    db.vendorApplication.count({ where: sampleWhere.vendorApplication }),
    db.media.count({ where: sampleWhere.media }),
  ]);
  return { project, news, job, teamMember, certification, inquiry, vendorApplication, media };
}

export function totalSampleCount(counts: SampleCounts): number {
  return Object.values(counts).reduce((a, b) => a + b, 0);
}
