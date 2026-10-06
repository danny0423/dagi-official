# 進度

## 已完成

| 日期 | 項目 | 依據 |
|---|---|---|
| 2026-10-02 | 網站架構＋placeholder 文案＋內容收集清單 | `docs/site-architecture.md`、`docs/content-collection.md`，commit `40f324d` |
| 2026-10-02 | 技術架構與需求、技術選型 D1～D13 | `docs/tech-architecture.md`、`docs/decisions.md`，commit `fb9d599` |
| 2026-10-02 | Next.js 骨架：13 個前台佔位頁、`/admin`＋`proxy.ts`、`/api/health`、robots／sitemap、Prisma、docker compose、Dockerfile | commit `df05b86` |
| 2026-10-02 | 骨架實測：全部前台頁 200、未登入進 `/admin` 307 導向登入頁、`/api/health` 回 `{"ok":true,"db":true}`、後台頁有 `noindex` | 本機 `npm run dev` 實測 |
| 2026-10-06 | 前台改讀資料庫：`lib/site-data/`（公司資料、團隊、證照、工程實績、最新消息、職缺），`unstable_cache`＋標籤快取、`connection()` 讓 build 不連資料庫，後台存檔後 `updateTag` 立即更新；沒資料時維持待填範例；`check:launch` 改以資料庫為準，後台儀表板加「上線前檢查」。eslint／tsc 通過；`next build` 不連資料庫實測成功（standalone 288MB→88MB，排除素材與 .env）；瀏覽器實測 12 情境通過（正式模式＋dev），修 3 個 bug（多支電話 tel 連結、重複 key ×2） | `docs/tech-architecture.md` 第 5 節「前台資料流與快取」 |

## 下一步

| # | 項目 | 狀態 | 依據 |
|---|---|---|---|
| 1 | 前台畫面設計（風格已定：清水模） | 待交給設計 AI | `docs/design-brief.md` |
| 2 | Prisma schema（11 張表＋工程圖庫 `project_images`） | 已完成：`prisma/schema.prisma`，migration `init_admin`；`npm run db:seed` 建公司資料（使用者提供的名稱、統編、地址、代表人、設立日期）與第一個管理員 | `docs/tech-architecture.md` 第 5 節 |
| 3 | 後台登入（D12） | 已完成：argon2id、DB session（只存 token 的 SHA-256）、7 天到期、登入頻率限制（記憶體內，多台機器要換）、ADMIN／EDITOR 權限 | `docs/decisions.md` D12、`lib/admin/` |
| 3a | 後台系統 | 已完成：儀表板、公司資料、五種內容管理（新增／編輯／刪除／上下架／排序）、收件匣、媒體庫、帳號管理；curl 實測通過。前台已改讀資料庫（2026-10-06）。待辦：S3 實測（D16）、瀏覽器人工操作驗證畫面（含後台存檔後前台更新） | `app/admin/`、`docs/tech-architecture.md` 第 4、5 節 |
| 3b | UX 修正（`docs/ux-review.md` 第 2～9 項） | 已完成，eslint／tsc 通過，瀏覽器實測 23 情境通過（dev 模式） | `docs/ux-review.md` |
| 4 | 洽詢表單＋SES 寄信＋Turnstile | 未開始 | `docs/tech-architecture.md` F2、N2 |
| 5 | GA4 事件 G1～G5 | 未開始 | `docs/tech-architecture.md` GA4 需求 |
| 6 | EC2 部署＋Nginx＋GitHub Actions | 未開始 | `docs/decisions.md` D9、D10 |
| 7 | 待決：Q1 工程實績上線方式、Q5 AWS 區域 | 待使用者決定 | `docs/decisions.md` |
