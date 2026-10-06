import type { Metadata } from "next";
import { MultilineText } from "@/components/multiline-text";
import { PageHeading } from "@/components/page-heading";
import { PageSection } from "@/components/page-section";
import { PlaceholderText } from "@/components/placeholder-text";
import { PreviewLabels } from "@/components/preview-labels";
import { contentAnchor } from "@/lib/content";
import { isAdminPreview, requireLaunched } from "@/lib/preview";
import { getPublishedJobs, getSiteCompany, type PublicJob } from "@/lib/site-data";
import { getPreviewJobs, type MaybePreview } from "@/lib/site-data/preview";
import { pageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const company = await getSiteCompany();
  return pageMetadata({
    path: "/careers",
    title: "人才招募",
    description: `${company.name}人才招募：招募職缺、資格條件與福利。`,
  });
}

export default async function Page() {
  await requireLaunched("/careers");
  // 已上架的職缺（排序同後台）；一個都沒有時顯示範例職缺與福利待填。
  // 登入後台的人看到全部職缺，未上架的加標籤（lib/preview.ts）。每張卡片有錨點 id，後台「前台查看」會連到 #job-{id}
  const jobs: MaybePreview<PublicJob>[] = (await isAdminPreview()) ? await getPreviewJobs() : await getPublishedJobs();
  return <>
    <PageHeading path="/careers" title="人才招募" />
    <div className="site-container interior-content">
      <PageSection id="open-positions" title="招募職缺">
        {jobs.map((job) => <article className="job-opening" id={contentAnchor.job(job.id)} key={job.id}>
          <PreviewLabels labels={job.previewLabels} />
          <div className="job-heading"><h3>{job.title}</h3>{job.location && <p>{job.location}</p>}</div>
          <dl className="detail-list">
            {[
              ["部門", job.department],
              ["工作性質", job.employmentType],
              ["薪資", job.salary],
            ].filter(([, value]) => value).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
            {[
              ["工作內容", job.description],
              ["資格條件", job.requirements],
              ["福利", job.benefits],
            ].filter(([, value]) => value).map(([label, value]) => <div key={label}><dt>{label}</dt><dd className="job-text"><MultilineText text={value} /></dd></div>)}
          </dl>
        </article>)}
        {/* 職缺資料表沒有「投遞方式／人力銀行連結」欄位，維持待填（需要時再加欄位） */}
        {jobs.length > 0 && <p className="content-notice"><PlaceholderText text="應徵方式：【待填：投遞方式或人力銀行連結】" /></p>}
        {jobs.length === 0 && ( // check-launch: fallback jobs
          <article className="job-opening">
            <p><PlaceholderText text="【待填：確認此職缺是否開放招募】" /></p>
            <div className="job-heading"><h3>工地主任</h3><p><PlaceholderText text="【待填：工作地點】" /></p></div>
            <p><PlaceholderText text="負責工地現場管理、進度與品質控管。需要具備【待填：資格條件】。" /></p>
            <div className="job-apply"><button type="button" className="button-primary" disabled aria-describedby="job-link-notice">前往投遞</button><p id="job-link-notice"><PlaceholderText text="【待填：人力銀行連結】" /></p></div>
          </article>
        )}
      </PageSection>
      {jobs.length === 0 && ( // check-launch: fallback jobs
        <PageSection id="benefits" title="福利與工作環境"><p className="interior-lead"><PlaceholderText text="【待填：實際提供的福利】" /></p></PageSection>
      )}
    </div>
  </>;
}
