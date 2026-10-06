// 前台資料快取的標籤（client／server 共用，不能加 "server-only"；後台 server action 也要 import）。
// lib/site-data/index.ts 讀資料時掛上這些標籤；後台寫入成功後呼叫 updateTag(SITE_TAGS.xxx) 讓快取立即失效。
// 圖片（media）會出現在團隊、證照、工程實績裡，所以這些查詢都另外掛 SITE_TAGS.media，改替代文字時一次清掉。

export const SITE_TAGS = {
  company: "site:company",
  team: "site:team",
  certifications: "site:certifications",
  projects: "site:projects",
  news: "site:news",
  jobs: "site:jobs",
  media: "site:media",
} as const;

export type SiteTag = (typeof SITE_TAGS)[keyof typeof SITE_TAGS];
