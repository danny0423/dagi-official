import type { ContentKind } from "@/lib/admin/content";
import { formatDate, todayInTaipei } from "@/lib/admin/format";
import { contentAnchor, isCertificationValid } from "@/lib/content";
import { isLaunched, type SitePath } from "@/lib/launch";

// 後台「前台查看」連結：五種內容在前台的網址規則，只在這裡定義（列表的操作欄、編輯頁頂部共用）。
//   工程實績  /projects/{代稱}         消息  /news/{代稱}
//   職缺      /careers#job-{id}        團隊  /about/team#member-{id}        證照  /about/license#cert-{id}
// 列表型內容（職缺、團隊、證照）沒有單頁，連到所在頁面的錨點（lib/content.ts 的 contentAnchor），打開會捲到並強調那張卡片。
// 一律帶「已存檔」的資料（代稱改了還沒存，連結仍是舊網址；存檔後頁面重新產生就換成新的）。
//
// guestVisible：訪客現在看不看得到這一筆（頁面已開放、已上架、團隊成員已同意公開、證照未過期）。
// 看不到時連結照樣可以點：登入後台的人在前台會看到預覽（lib/preview.ts），所以後台不需要灰掉的按鈕。
// 頁面是否開放看 lib/launch.ts 的設定值（也就是正式環境的狀況），開發環境任何人都能預覽未開放頁面不算。

type LinkFields = {
  projects: { slug: string; published: boolean };
  news: { slug: string; published: boolean };
  jobs: { id: number; published: boolean };
  team: { id: number; published: boolean; consentToPublish: boolean };
  certifications: { id: number; published: boolean; expiresOn: Date | null };
};

type Rule<K extends ContentKind> = {
  /** 所在的前台頁面（lib/launch.ts 的上線開關） */
  page: SitePath;
  href: (item: LinkFields[K]) => string;
  /** 已上架之外，訪客還看不到的情況 */
  hidden?: (item: LinkFields[K]) => boolean;
};

const rules: { [K in ContentKind]: Rule<K> } = {
  projects: { page: "/projects", href: (item) => `/projects/${encodeURIComponent(item.slug)}` },
  news: { page: "/news", href: (item) => `/news/${encodeURIComponent(item.slug)}` },
  jobs: { page: "/careers", href: (item) => `/careers#${contentAnchor.job(item.id)}` },
  team: {
    page: "/about/team",
    href: (item) => `/about/team#${contentAnchor.teamMember(item.id)}`,
    hidden: (item) => !item.consentToPublish,
  },
  certifications: {
    page: "/about/license",
    href: (item) => `/about/license#${contentAnchor.certification(item.id)}`,
    // 跟前台同一套判斷：台北時間的今天，到期日當天仍有效
    hidden: (item) => !isCertificationValid(item.expiresOn ? formatDate(item.expiresOn) : null, todayInTaipei()),
  },
};

export type PublicLink = {
  href: string;
  /** 訪客看得到（false 時連結旁標示「預覽（訪客看不到）」） */
  guestVisible: boolean;
};

export function publicLinkOf<K extends ContentKind>(kind: K, item: LinkFields[K]): PublicLink {
  const rule: Rule<K> = rules[kind];
  return {
    href: rule.href(item),
    guestVisible: isLaunched(rule.page) && item.published && !rule.hidden?.(item),
  };
}
