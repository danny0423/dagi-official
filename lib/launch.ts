// 前台上線開關：集中決定每一頁是否已對外開放（docs/ux-review.md 第 2 項）。
// 預設值依 docs/site-architecture.md 的 Sitemap：「上線必備」為 true，「之後」為 false。
//
// launched: false 的頁面
//   - 不出現在主選單、頁尾、sitemap；首頁連到它的區塊（例如「精選工程」）也會隱藏
//   - production（next build／next start）訪客看到 404；已登入後台的人可以預覽，頁面頂部會顯示「預覽模式」橫幅
//   - development（next dev）任何人都可以直接輸入網址預覽，頁面頂部會顯示「未上線頁面預覽」橫幅
// 擋 404 的 requireLaunched() 在 lib/preview.ts（要查登入狀態，只能在 server 用）；這個檔案 client 元件也會用，不能放 server 專用的程式。
//
// 要開放某一頁：先把該頁的真實資料補齊，跑 `npm run check:launch` 確認沒有待填字樣，再把 launched 改成 true。
// 子網址跟著上層：例如 /projects 未開放時，/projects/[slug] 也一律未開放。

export type SitePage = {
  path: string;
  /** 給開發者看的頁面名稱（橫幅、上線檢查報告使用），不是選單文字 */
  name: string;
  launched: boolean;
};

export const sitePages = [
  { path: "/", name: "首頁", launched: true },
  { path: "/about", name: "關於我們", launched: true },
  { path: "/about/license", name: "營造業登記與資格", launched: true },
  { path: "/about/team", name: "專業團隊", launched: true },
  { path: "/about/group", name: "集團關係", launched: true },
  { path: "/services", name: "承攬業務", launched: true },
  { path: "/safety-quality", name: "工安與品質管理", launched: true },
  { path: "/contact", name: "聯絡我們／工程洽詢", launched: true },
  { path: "/privacy", name: "隱私權政策", launched: true },
  { path: "/projects", name: "工程實績（含單案頁）", launched: false },
  { path: "/news", name: "最新消息", launched: false },
  { path: "/careers", name: "人才招募", launched: false },
  { path: "/partners", name: "協力廠商合作", launched: false },
] as const satisfies readonly SitePage[];

export type SitePath = (typeof sitePages)[number]["path"];

/** 開發環境任何人都可以預覽未開放的頁面；正式環境只有已登入後台的人可以（lib/preview.ts）。 */
export const launchPreviewEnabled = process.env.NODE_ENV !== "production";

/** 找出網址所屬的頁面設定（取最長的符合項目：/about/license 對到自己，/projects/xxx 對到 /projects）。 */
export function findSitePage(pathname: string): SitePage | undefined {
  let match: SitePage | undefined;
  for (const page of sitePages) {
    const hit = page.path === "/"
      ? pathname === "/"
      : pathname === page.path || pathname.startsWith(`${page.path}/`);
    if (hit && (!match || page.path.length > match.path.length)) match = page;
  }
  return match;
}

/** 網址是否已開放；不在設定裡的網址視為未開放。 */
export function isLaunched(pathname: string): boolean {
  return findSitePage(pathname)?.launched ?? false;
}

export function launchedPages(): SitePage[] {
  return sitePages.filter((page) => page.launched);
}
