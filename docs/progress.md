# 進度

## 已完成

| 日期 | 項目 | 依據 |
|---|---|---|
| 2026-10-02 | 網站架構＋placeholder 文案＋內容收集清單 | `docs/site-architecture.md`、`docs/content-collection.md`，commit `40f324d` |
| 2026-10-02 | 技術架構與需求、技術選型 D1～D13 | `docs/tech-architecture.md`、`docs/decisions.md`，commit `fb9d599` |
| 2026-10-02 | Next.js 骨架：13 個前台佔位頁、`/admin`＋`proxy.ts`、`/api/health`、robots／sitemap、Prisma、docker compose、Dockerfile | commit `df05b86` |
| 2026-10-02 | 骨架實測：全部前台頁 200、未登入進 `/admin` 307 導向登入頁、`/api/health` 回 `{"ok":true,"db":true}`、後台頁有 `noindex` | 本機 `npm run dev` 實測 |

## 下一步

| # | 項目 | 狀態 | 依據 |
|---|---|---|---|
| 1 | 前台畫面設計（風格已定：清水模） | 待交給設計 AI | `docs/design-brief.md` |
| 2 | Prisma schema（11 張表） | 未開始 | `docs/tech-architecture.md` 第 5 節 |
| 3 | 後台登入（D12） | 未開始 | `docs/decisions.md` D12 |
| 4 | 洽詢表單＋SES 寄信＋Turnstile | 未開始 | `docs/tech-architecture.md` F2、N2 |
| 5 | GA4 事件 G1～G5 | 未開始 | `docs/tech-architecture.md` GA4 需求 |
| 6 | EC2 部署＋Nginx＋GitHub Actions | 未開始 | `docs/decisions.md` D9、D10 |
| 7 | 待決：Q1 工程實績上線方式、Q5 AWS 區域 | 待使用者決定 | `docs/decisions.md` |
