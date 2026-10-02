# 前台 UI／UX 審查（app/(site)/）

審查日期 2026-10-02｜方法：impeccable critique＋audit（⚠️ 單一 context 執行：主控指定由單一 subagent 完成，A 設計判斷先完成、B 偵測器後跑）｜截圖：`review-screens/site/`（40 張，檔名 `頁面_寬度.png`）

## 總評

- 已通過：16 個網址 × 2 種寬度都沒有水平溢出；Tab 順序正確，每個焦點都有可見框線；skip link 會把焦點移到 `main`；reduced-motion 會關閉動畫；文字對比最低 4.82:1（`concrete-600` 在 `concrete-200` 上）。【待填】標記的樣式全站一致，沒有造成版面破損（見各頁截圖）。
- 擋上線的是功能和內容，不是視覺：沒有可用的聯絡管道、未開放的頁面和範例專案還在選單與 sitemap 裡（#1～#4）。
- 招標審查人員要找的登記資料，要從「關於我們」下拉選單進去；首頁和頁尾都沒有入口（#7）。
- SEO 只完成 title、`lang`、sitemap／robots；S2、S4、S5 未達成（#10、#11）。
- impeccable 分數：Nielsen 21/32（第 7、10 項 n/a）；Audit 14/20。偵測器 `detect.mjs` 掃描 `app/(site)` 與 `components` 的結果為 0 筆。

## 問題表

| # | 嚴重度 | 頁面 | 問題 | 依據 | 建議改法 |
|---|---|---|---|---|---|
| 1 | P0 | 全站／聯絡我們 | 訪客找不到任何能聯絡的方式：表單的「送出」是停用狀態，電話和 Email 也都是待填 | `components/inquiry-form.tsx:54`、`lib/placeholder-company.ts:20-23`、`contact_375.png` | 上線前至少完成 F2（存 DB＋SES 通知）並填入一支真實電話；兩者缺一就不開站 |
| 2 | P0 | 首頁 | 主視覺是隆磐 2021 年的工地照，畫面沒有任何說明，訪客會以為是達吉自己的工地 | `app/(site)/page.tsx:37-38`、`home_1440.png`、D17 | 依 D17 上線前換成自家照片；換不了就改回 `PhotoPlaceholder` 的清水模底（不放照片） |
| 3 | P0 | 隱私權政策／聯絡我們 | 表單要求勾選「已閱讀並同意隱私權政策」，但政策頁只有待填內容 | `app/(site)/privacy/page.tsx:13`、`inquiry-form.tsx:49` | 拿到法務內文（content-collection #16）才開放表單；內容要包含 GA4 cookie |
| 4 | P0 | 工程實績／最新消息／人才招募／協力廠商 | 「之後」才上線的頁面現在都能從主選單、頁尾和 sitemap 進入，內容全是範例；營造廠官網公開「範例專案」會傷信任 | `components/site-navigation.tsx:8-14`、`site-footer.tsx:26-31`、`app/sitemap.ts:5-19`、`projects_1440.png` | 用單一設定檔（例如 `lib/launch.ts`）控制哪些頁面已上線，選單、頁尾、sitemap、首頁「精選工程」都讀這份設定；未上線的頁面回 404 或 noindex |
| 5 | P1 | 不存在的網址 | 打錯網址會看到英文的「This page could not be found.」，沒有頁首、頁尾和任何連結，只能按瀏覽器返回 | `404_1440.png`；`app/` 沒有 `not-found.tsx` | 新增中文 `not-found.tsx`：沿用頁首頁尾，提供「回首頁／營造業登記與資格／工程洽詢」三個連結 |
| 6 | P1 | `/projects/[slug]` 錯誤網址 | 在站內版型中仍顯示英文 404 文案 | `projects-sample_375.png` | 同 #5，`(site)` 底下的 `notFound()` 也會用到同一份中文頁 |
| 7 | P1 | 首頁、頁尾、主選單 | 招標審查人員要點「關於我們」→下拉→「營造業登記與資格」才看得到登記資料；首頁的等級、頁尾的登記證欄位都不能點 | `site-navigation.tsx:15-20`、`site-footer.tsx:14-17`、`page.tsx:30` | 頁尾的登記資料區塊整塊連到 `/about/license`；首頁 Hero 副標或信任列加上「查看登記資料」連結；評估把「登記資格」提到主選單第一層 |
| 8 | P1 | 聯絡我們 | 想直接打電話的地主，在手機上要先捲過整張表單（約 2,000px）才看到電話和地址 | `app/(site)/contact/page.tsx:15-16`、`contact_375.png` | 把電話、地址、服務時間的摘要移到表單前面；桌機可以放在目前空著的左欄並 sticky |
| 9 | P1 | 協力廠商合作 | 協力表單蒐集聯絡人和電話，卻沒有隱私同意或個資告知 | `inquiry-form.tsx:49`（`!partner` 才顯示）、`partners_1440.png` | 協力表單也加上同意勾選與隱私權政策連結 |
| 10 | P1 | 全站 | 每一頁的 description 都一樣，也沒有 OG title／image；貼到 LINE 只會出現一張沒有圖的通用卡片（S2 未達成） | `app/layout.tsx:6-13`、各頁 `metadata` 只有 title | 每頁補上 `description`；在 root 設定 `openGraph`，並加入 `opengraph-image`（先用清水模＋公司名的文字圖） |
| 11 | P1 | 全站 | 搜尋結果無法顯示公司資訊和麵包屑路徑，也沒有指定正式網址（S4、S5 未達成） | 腳本檢測 16 個網址：0 筆 `ld+json`、0 個 canonical | root 加 `alternates.canonical`；首頁輸出 `GeneralContractor`，只放已確認的欄位（名稱、統編、地址）；`PageHeading` 同步輸出 `BreadcrumbList` |
| 12 | P1 | 首頁 | Hero 照片是頁面的 LCP 元素，卻是 lazy 載入（Next 在 console 發出警告），手機上首屏會慢 | `page.tsx:38`、`components/photo-placeholder.tsx:15`、console warning | 只對 Hero 圖加 `fetchPriority="high"` 或 `preload`（Next 16 已不用 `priority`） |
| 13 | P2 | 關於、工安、承攬、集團、團隊 | 段落之間完全沒有間距（實測 0px），長段文字黏在一起 | `app/globals.css:48`（`.site-shell p{margin:0}`，權重較高）蓋過 `:236`；其他地方用 `!important` 補（`:150`、`:272`、`:285`） | 改成 `.site-shell :where(p){margin:0}` 降低權重，再拿掉那些 `!important` |
| 14 | P2 | 承攬業務 | 業務項目的 h3（43px）比章節 h2「承攬範圍說明」（40px）還大，層級看起來顛倒 | `globals.css:271` vs `:234`、`services_1440.png` | h3 上限降到 h2 以下，或把三個業務項目改成可見的 h2 |
| 15 | P2 | 所有內頁 | 每個內頁的標題區塊都高 326px、h1 88px，和首頁 Hero 一樣大；登記資料表在 1440×900 的畫面從 y≈600 才開始 | `globals.css:220,226`、`about-license_1440.png` | 內頁 h1 降一級（約 `site-heading`），區塊高度減半，讓內容在第一屏就看得到；首頁保持最大字級 |
| 16 | P2 | 首頁 | 信任列的數字只有 18px，「2024」看起來像一般內文，補上真實數字後也撐不起「信任」 | `globals.css:121`、`home_1440.png` | 數字放大到 `site-title` 以上並維持 `tabular-nums`，標籤維持小字 |
| 17 | P2 | 聯絡我們、最新消息（手機） | h1 換行後，第二行以「／」開頭 | `contact_375.png`、`news_375.png`、`contact/page.tsx:13`、`news/page.tsx:9` | h1 只放「工程洽詢」，「聯絡我們」改成麵包屑或副標；或在「／」前插入 `<wbr>` 控制斷行 |
| 18 | P2 | 關於我們子頁（手機） | 章節導覽四個項目換成兩行，「集團關係」單獨落在第二行 | `about-team_375.png`、`globals.css:228-229` | 手機改成可橫向捲動的單行，或排成 2×2 |
| 19 | P2 | 主選單 vs 關於我們頁 | 同一個 `/about`，下拉選單叫「關於我們」，頁內導覽叫「公司簡介」 | `site-navigation.tsx:16`、`components/page-heading.tsx:28` | 統一叫「公司簡介」 |
| 20 | P2 | 專業團隊 | 人像照片框是 5:4 橫式，真人照片放進去容易裁到頭頂或下巴 | `globals.css:260` | 改成 4:5 或 3:4 直式 |
| 21 | P2 | 首頁 | Hero 照片原檔只有 1067×800，裁成 4:5 後在 Retina 螢幕會放大約 1.7 倍而變糊；`sizes` 沒有考慮 cover 裁切 | `public/images/site/hero-temp-longpon.jpg`、`page.tsx:38` | 自家照片的長邊至少 1800px；`sizes` 改成依圖框高度換算的寬度 |
| 22 | P2 | 全站 | 手機每開一頁約要下載 0.8～1.0MB 字型（13～16 個檔，dev 實測）；字型 CSS 是 100–900 可變字重、109 個切片 | `app/(site)/layout.tsx:5-10`、腳本網路統計 | 先用 production build 跑 Lighthouse 確認；若偏重，指定實際用到的 400／500／700，或改成標題用 Noto、內文用系統字（後者要使用者拍板，因為和 brief 不同） |
| 23 | P2 | 關於、登記、團隊、集團、工安、消息 | 讀完頁面後，內容區沒有下一步，只剩頁尾的「工程洽詢」 | 各頁原始碼；只有 `services/page.tsx:35` 有 CTA | 在內容結尾放一行情境 CTA，例如登記頁「需要投標文件？聯絡我們」、團隊頁「與工務團隊討論您的工程」 |
| 24 | P2 | 全站（手機） | 頁首不會固定，首頁長 4,600px，捲到中段就沒有洽詢入口 | `globals.css:69`（`position: relative`） | 手機改用 sticky 頁首，或在有真實電話後加底部「撥打／洽詢」列（見功能建議表） |
| 25 | P2 | 聯絡我們 | 「您的身分」預設選了「建設公司／起造人」，沒注意的地主會被記成建商 | `inquiry-form.tsx:20` | 不要預設，改成必選 |
| 26 | P2 | 聯絡我們 | 錯誤提示只有瀏覽器原生泡泡，加上框線變 2px，沒有文字；年長使用者容易漏看 | `globals.css:321`、`contact-form-check_375.png` | 正式串接時加上欄位下方的錯誤文字，並在表單頂部列出錯誤摘要 |
| 27 | P2 | 工程實績 | 篩選按鈕的框線對比只有 1.55:1，未選的按鈕看起來不像按鈕 | `globals.css:282` | 框線改用 `concrete-600`，或至少達到 3:1 |
| 28 | P2 | 最新消息 | 列表標題用了 h2，和隱藏的 h2「文章列表」同一層 | `app/(site)/news/page.tsx:15` | 每則消息的標題改成 h3 |
| 29 | P2 | 頁尾 | 【待填】標記是 0.875em，放在 13px 的頁尾裡只剩約 11px，不易閱讀 | `globals.css:55`、`home_375.png` | 標記字級設下限，例如 `max(0.875em, 12px)` |
| 30 | P2 | 全站 | 瀏覽器分頁顯示的是 Next.js 預設的黑底三角形圖示，不是公司圖示 | `app/favicon.ico`（25,931 bytes，已截圖確認） | 拿到 logo 前先用「達」字或清水模色塊做暫時圖示 |
| 31 | P2 | 部署 | 正式環境如果漏設 `NEXT_PUBLIC_SITE_URL`，sitemap 和之後的 canonical 會指向 localhost，搜尋引擎抓不到正確網址 | `lib/site.ts:1` | production 環境沒設定這個值時直接 build 失敗 |

## 功能建議

| # | 功能 | 給誰 | 價值 | 成本 | 建議優先度 |
|---|---|---|---|---|---|
| 1 | 洽詢表單串接（F2＋N2 Turnstile＋送出成功頁＋GA4 `generate_lead`） | 三種使用者都會用 | 網站唯一的轉換管道，目前完全不能用 | 中 | 最高（擋上線） |
| 2 | 上線開關＋【待填】建置檢查：一份設定決定哪些頁面開放；production build 時掃描已開放頁面，還有【待填】就讓 build 失敗 | 網站維護者 | 資料補齊一頁就開一頁，不會不小心把範例頁或待填字樣推上線 | 低 | 高 |
| 3 | 每頁 description／OG 圖／canonical＋JSON-LD（`GeneralContractor`、`BreadcrumbList`，只放已確認的欄位） | 透過搜尋或 LINE 分享找到網站的人 | 達成 S2、S4、S5；分享時有預覽卡 | 低 | 高 |
| 4 | 中文 404 頁（含頁首頁尾與三個常用入口） | 所有人 | 打錯網址還能繼續找到內容 | 低 | 高 |
| 5 | 「登記資格快速核對」：首頁和頁尾加入口；登記頁放主管機關查詢連結，提供公司提供的登記證或證書 PDF 下載，並加列印樣式 | 招標審查人員、建商採購 | 不用打電話就能核對、存檔；審查人員常需要列印 | 低（PDF 要公司提供） | 高 |
| 6 | 點擊撥號（`tel:`，GA4 G3）＋ LINE 官方帳號連結（公司有帳號才做） | 危老地主、建商 | 地主習慣用電話或 LINE，門檻比填表低 | 低 | 中高 |
| 7 | 手機底部固定「撥打電話｜工程洽詢」列（有真實電話後） | 用手機的地主、建商 | 長頁面任何位置都能一鍵聯絡 | 低 | 中 |
| 8 | GA4 G1–G5＋cookie 告知 | 網站維護者 | 知道訪客從哪裡來、哪個 CTA 有效 | 低～中 | 中（隱私權政策要先完成） |
| 9 | 地圖改成靜態圖＋「在 Google 地圖開啟」連結，取代整個 iframe | 所有人 | 少載第三方 JS、減少 cookie，手機直接開導航 | 低 | 中 |
| 10 | 送出後自動回覆信給填表人（SES） | 建商、地主 | 確認有收到，不必再打電話確認 | 低 | 中 |
| 11 | 危老重建 FAQ／流程說明（只寫一般流程與公司確認過的做法，不寫承諾天數或補助金額） | 危老地主 | 回答「我這種情況接不接、要準備什麼」，也能帶來搜尋流量 | 中（內容要公司審） | 中 |
| 12 | 洽詢表單附件上傳（圖說 PDF） | 建商、起造人 | 估價前就能拿到圖說，少一次來回 | 中（上傳限制、檔案檢查、儲存） | 低～中 |
| 13 | 工程進度日誌（最新消息改成施工中工程的定期進度與照片；後台已有 news 表） | 建商、地主 | 證明公司有在施工、有在運作 | 中（要有人每月更新） | 低（等第一件自己承攬的工程） |

麵包屑畫面上已經有了（`components/page-heading.tsx:13-19`），只缺 #3 的 `BreadcrumbList` 結構化資料。

## 審查限制

- 只在 headless Chromium 測試。Safari／iOS 的 `<details>` 下拉點外面能不能關閉、LINE 內建瀏覽器、真機觸控、200% 縮放、實際螢幕報讀器朗讀都沒有驗證。
- 效能數字來自 dev server（JS 約 3.5MB 是開發模式，不代表正式環境）；字型傳輸量、LCP、CLS（dev 實測 0.000）都要用 production build 再量。
- 表單送出、GA4、`tel:`／`mailto:` 目前都還沒實作，無法測試。
- 主控給的 `/projects/sample` 會回 404；範例專案實際網址是 `/projects/example-project`，兩者都有截圖。
- 依指示沒有另外啟動 server，所以 impeccable 瀏覽器 overlay 沒有注入；也沒有寫入 `.impeccable/critique/` 快照。
