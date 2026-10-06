# dagi-official

隆磐建設成立的新公司官網。新公司是**綜合營造業**（營造業法下的承攬商：負責施工，不買地、不賣房）。公司：達吉營造有限公司。首頁已設計，其餘前台頁設計中；後台系統已完成（`app/admin/`）。本機啟動方式見 `README.md`。技術棧：Next.js 單一專案（前台＋後台＋API）、PostgreSQL（RDS）、EC2 + Docker、S3、GA4。

## 已拍板的決策

- **業態：營造業**，不是建設公司。網站對象是建設公司／起造人、政府招標機關、危老地主，不是購屋者。網站上不出現建案銷售、坪數格局、接待中心這類內容。
- **對外會掛 隆磐 的名字**：保留「集團關係」頁，並連結到 隆磐建設官網。
- **工程實績上線方式（建議，尚未正式確認）**：上線時先不開實績頁，改在「專業團隊」放核心人員的過往個人經歷，並標注「非本公司承攬」。等公司有第一件自己承攬的工程時再開實績頁。
- 參考站 https://www.longpon.com.tw/ 只能參考結構慣例，不可以抄文案或版面。

## 內容的鐵則：所有事實都用 placeholder

營造業的登記證字號、統一編號、工程實績、得標紀錄、證照都可以公開查證，網站上的假資料會有法律責任。因此：

- 任何事實性內容（證照、字號、數字、日期、案件名稱、人名）一律寫成 `【待填：項目】`；範例案件寫成 `【範例專案，非真實案件】`。可以替換的敘述文字（簡介、服務說明）才寫成擬真的範例文字。
- placeholder 一律用中文描述欄位名稱，不要用看起來像真實格式的值（例如任何長得像字號或統編的英數字串）。
- 有關 隆磐建設 的事實，只能用 `【待填】` 表示，不可以自己推測。
- 隆磐建設 的工程實績**屬於 隆磐**，不可以當作新公司的實績顯示；集團關係頁只能放連結。

## 已知陷阱

- Next.js 16：`middleware.ts` 已改名 `proxy.ts`，匯出函式名稱是 `proxy`。
- Prisma：npm 的 `latest` 標籤指向 8.0 rc，本專案固定 7.10（`prisma`、`@prisma/client`、`@prisma/adapter-pg` 三個版本要一致）。Prisma 7 必須用 driver adapter，設定檔是 `prisma.config.ts`。
- 開發機的 5432、5433 已被別的服務占用，開發用 PostgreSQL 對外 port 是 5434。
- Git push 走 SSH（`git@github.com:danny0423/dagi-official.git`）；HTTPS 會用到本機存的另一個 GitHub 帳號而 403。
- `.env` 不進 git，只 commit `.env.example`。
- `assets/dagi素材/`（本機、不進 git）經檢視是 隆磐建設 舊官網素材，不是達吉的 logo 或工地照，不可用在網站上（`docs/assets-manifest.md`）；唯一例外是首頁主視覺暫用的一張氛圍照（D17），上線前要換掉。
- 公司名稱（`getSiteCompany()` 的 `company.name`）是「達吉營造有限公司」，已含「營造」；需要短稱用 `company.shortName`，不要寫成 `${company.name}營造`。
- 前台資料一律經 `lib/site-data/`（公司資料、團隊、證照、工程實績、消息、職缺），前台頁面不要直接用 prisma；`next build` 時沒有資料庫，靠它的 `connection()` 才不會在 build 時連資料庫。後台新增會影響前台的寫入時，server action 成功後要呼叫 `updateTag(SITE_TAGS.xxx)`（五種內容走 `lib/admin/content.ts` 的 `revalidateContent()`），否則前台最久 1 小時後才更新。
- 前台頁面是否開放由 `lib/launch.ts` 決定；新增前台頁要登記並在 page 開頭呼叫 `requireLaunched(path)`。開放前看後台儀表板的「上線前檢查」（資料庫部分，權威）並跑 `npm run check:launch`（原始碼裡的【待填】）；正式部署 build 時設 `LAUNCH_STRICT=1`。資料庫沒資料時才顯示的範例區塊要標 `// check-launch: fallback <種類>`，頁面新用到公司欄位要同步 `lib/site-data/launch-check.ts` 的 `companyColumnsByPage`（check:launch 會提示）。
- 後台表單一律用 `app/admin/_components/form.tsx` 的 `AdminForm`（內建未存檔提醒、錯誤定位、登入過期不丟資料）；server action 開頭用 `authorizeAction()` 回傳狀態，不要 redirect。
- 用 `process.cwd()` 組檔案路徑會讓 standalone 把整個專案打包進去；`next.config.ts` 的 `outputFileTracingExcludes` 已排除 `assets/`、`review-screens/`、`storage/`、`docs/`、`.env*`，新增大型或敏感資料夾時要一起加進去（`.dockerignore` 也要）。
- 資料庫一開始沒有管理員帳號，要先跑 `npm run db:seed` 建立（指令見 `README.md`）。

## 文件

- `docs/progress.md` — 接手時先讀：做到哪、下一步是什麼
- `docs/design-brief.md` — 做前台畫面、改樣式或元件時讀：風格（清水模）、照片佔位規則、技術規則、完成條件
- `docs/site-architecture.md` — 動到頁面、區塊或文案時讀：完整 sitemap、每頁區塊順序、placeholder 範例文字
- `docs/content-collection.md` — 要追蹤缺哪些真實資料、或判斷哪一頁能不能上線時讀
- `docs/tech-architecture.md` — 寫程式、建資料表、設定部署前讀：需求清單（功能／SEO／GA4／非功能）、技術棧、目錄規劃、資料表草稿
- `docs/decisions.md` — 做技術選型或推翻既有決策前讀：決策紀錄與待決事項

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
