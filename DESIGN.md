---
name: dagi-official
description: 清水模灰階、鋼藍重點與思源黑體的綜合營造業官網
colors:
  steel: "#38566b"
  steel-hover: "#294252"
  concrete-50: "#f6f5f2"
  concrete-100: "#eeede9"
  concrete-200: "#ddded9"
  concrete-300: "#c5c8c4"
  concrete-600: "#595f5e"
  concrete-900: "#242a2b"
  placeholder: "#f2e8c9"
  placeholder-ink: "#615025"
typography:
  site-display:
    fontFamily: "Noto Sans TC, sans-serif"
    fontSize: "clamp(3.25rem, 6.1vw, 5.5rem)"
    fontWeight: 700
    lineHeight: 1.27
    letterSpacing: "-0.035em"
  site-heading:
    fontSize: "clamp(2rem, 3.8vw, 3.5rem)"
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: "-0.025em"
  site-title:
    fontSize: "clamp(1.5rem, 2.4vw, 2rem)"
    fontWeight: 700
    lineHeight: 1.5
  site-body:
    fontFamily: "Noto Sans TC, sans-serif"
    fontSize: "1rem"
    lineHeight: 1.8
  site-lead:
    fontSize: "1.125rem"
  site-small:
    fontSize: "0.8125rem"
spacing:
  site-gutter: "clamp(1.25rem, 4.5vw, 4.5rem)"
  site-section: "clamp(4rem, 8vw, 7.5rem)"
  site-gap: "clamp(1.5rem, 3vw, 3rem)"
components:
  button-primary:
    backgroundColor: "{colors.steel}"
    textColor: "white"
    padding: "1rem 1.5rem"
  button-primary-hover:
    backgroundColor: "{colors.steel-hover}"
  placeholder-label:
    backgroundColor: "{colors.placeholder}"
    textColor: "{colors.placeholder-ink}"
    padding: "0.15em 0.2em"
  service-card:
    backgroundColor: "{colors.concrete-100}"
    padding: "2rem 1.5rem 2.5rem"
  service-card-hover:
    backgroundColor: "{colors.concrete-200}"
---

# Design System: dagi-official

## Overview

**前台頁面實作，待使用者視覺確認。** 本文件記錄設計 token、共用頁首頁尾與 14 個前台頁面（含工程單案）。使用者已指示直接延伸首頁風格完成其餘頁面。

已拍板方向為清水模、思源黑體（Noto Sans TC）與鋼藍強調色。用大標、清楚網格、灰階材質與留白呈現沉穩、可靠的營造業形象。設計供建設公司、招標審查人員與地主閱讀。

實作來源為 `app/globals.css`、`app/(site)/` 與 `components/`；上方 token 對應現有 CSS 命名。本輪僅執行 ESLint，未啟動 dev、執行 build、驗證 375px／1440px 瀏覽器畫面或取得截圖；排版、字型載入、操作與對比尚不能宣稱完成視覺或無障礙驗證。

## Colors

- **主色**：`steel` 用於主要 CTA、導覽洽詢入口、焦點及互動重點；`steel-hover` 為主要按鈕懸停色。
- **灰階**：`concrete-50` 是全站底色，`concrete-100` 承載交替區塊與服務卡，`concrete-200`／`concrete-300` 提供材質底與分隔；`concrete-600` 為次要文字，`concrete-900` 為主文字及頁尾底色。
- **待填提示**：`placeholder` 搭配 `placeholder-ink`，保留清楚的淡黃色資料標記。

鋼藍只用於操作與重點；清水模灰階維持主要面積，不另引入隆磐品牌色。

## Typography

前台 layout 透過 `next/font/google` 載入 Noto Sans TC，採 `display: swap`、`preload: false`；CSS 以產生的字型變數優先，再退回同名字型與 sans-serif。前台設定限定於 `site-shell`。

標題採粗重字重與平衡換行；內文採一般字重，讓中文段落有足夠行距。信任列使用 `tabular-nums`。待填文字為所在文字的 0.875 倍、字重 400，可在長欄位內換行。

## Layout

共用容器最大寬度為 81rem；實際寬度是視窗扣除左右 `site-gutter`。主要區塊使用 `site-section` 上下留白，多欄內容使用 `site-gap`。

| CSS 斷點 | 已實作的配置 |
|---|---|
| 大於 1100px | 完整水平導覽；頁首最小高度 6.5rem。Hero 雙欄 1.15:0.85，服務卡三欄，頁尾三欄。 |
| 最大 1100px | 導覽改切換按鈕與可捲動展開選單；頁首最小高度 5.5rem，頁尾兩欄，原則項目標題與文字改上下排列。 |
| 最大 767px | 頁首最小高度 5rem；Hero、信任列、服務卡、工程、原則、集團、聯絡與頁尾主區改單欄；CTA 區延展，頁尾連結換行。 |

首頁區塊順序及文案以 `docs/site-architecture.md` 為準；此文件不另定資訊架構。375px 與 1440px 是待驗證目標，並非已通過的畫面尺寸。

內頁共用麵包屑、大標與清水模頁首。內文以左側章節標題、右側內容的雙欄為基準，900px 以下改單欄；767px 以下表單、團隊、集團分工及消息列表再收為單欄。登記頁使用語意表格，業務頁使用分段敘述與有序流程，工程頁使用照片與資料，避免所有內容都套同一種卡片。

## Elevation & Depth

以灰階面積、CSS 漸層及細微徑向點紋呈現清水模深度，不使用材質圖片。一般卡片不設陰影；桌機「關於我們」子選單使用 `0 12px 30px #242a2b1a` 陰影，收合式導覽內移除陰影。

## Shapes

主要按鈕、卡片與照片區維持直角，目前沒有圓角 token。服務卡以頂部細線收邊；工程資訊、信任列與頁尾使用局部細線分隔。一般照片區固定 4:3，Hero 桌機為 4:5、最大 767px 時改為 4:3，並保留內縮 1.25rem 的細框。

## Components

| 共用元件／樣式 | 行為與使用規則 |
|---|---|
| `SiteHeader`、`SiteNavigation` | 公司名稱與業態、主選單、關於我們子選單及工程洽詢入口。現行頁面加底線；小螢幕按鈕提供 `aria-expanded`。Escape 關閉展開內容並回復焦點，焦點離開導覽或選取連結時關閉選單。 |
| `SiteFooter` | 深色底的公司登記、地址、聯絡資料、洽詢 CTA 與輔助連結。公司資料集中取自 `lib/placeholder-company.ts`。 |
| 主要按鈕／文字連結 | 主要按鈕使用鋼藍底白字；文字連結以底線及箭頭呈現。兩者最小高度 3.5rem、字重 500；主要按鈕背景過渡 180ms ease。CTA 保留 `data-cta` 位置標記。 |
| `PhotoPlaceholder` | 清水模底、置中中文待填標記及固定比例；有真實照片時透過 `photo` 傳入 src／alt，使用 `next/image` 與 object-fit cover。 |
| `PlaceholderText` | 保留 `【待填：…】` 與 `【範例專案，非真實案件】` 原文，將方括號段落以 mark 淡黃底標記。 |
| `CompanyContact` | 電話／Email 未有真實 href 時輸出文字；提供真實值後才輸出聯絡連結。 |
| `ArrowIcon` | 24px 方形 SVG，可用水平或斜向箭頭；裝飾圖示使用 `aria-hidden`。導覽與頁尾依情境縮至 18px／16px。 |
| 服務卡 | 灰底、頂部細線、標題與箭頭；懸停改深一階灰底。最大 767px 時內距改為 1.5rem。 |
| `PageHeading`、`AboutNavigation`、`PageSection` | 內頁麵包屑與單一主標、關於我們章節導覽、章節標題與內文配置。導覽標記目前頁面。 |
| `ProjectFilters` | 按類別或狀態篩選，使用 `aria-pressed` 與結果狀態訊息；尚未填寫分類的範例只出現在「全部」。空結果可重設並回到「全部」按鈕焦點。 |
| `InquiryForm` | 洽詢與協力登記的共用欄位、原生必填與格式檢查；送出與上傳停用，不儲存或寄出資料。洽詢的完成訊息僅為明確標示的文案預覽。 |

所有前台可聚焦元素設 2px 鋼藍 outline、外移 5px；深色頁尾改用白色焦點框。提供「跳至主要內容」連結。這些是程式碼已有的行為，仍待鍵盤實測。

Hero 文字使用 750ms 淡入與 12px 向上回位，緩動為 `cubic-bezier(0.16, 1, 0.3, 1)`。`prefers-reduced-motion: reduce` 關閉前台動畫與過渡。

## Do's and Don'ts

- 延用既定清水模、鋼藍與 Noto Sans TC，擴充頁面時優先重用 token 與共用元件。
- 依 `docs/site-architecture.md` 保留區塊與 placeholder；工程實績上線方式仍待決定。
- 保持待填與範例標記可見；公司名稱、字號、數字、日期、案件、人名與隆磐關係均不得自行補造。
- 不以素材工地照片暗示自家工程，不將隆磐的工程當作本公司實績。
- 不為未填的電話或 Email 產生假 `tel:`／`mailto:` 連結。
- 前台畫面實作不代表送件功能已串接，也不代表瀏覽器、build、對比與響應式驗證已通過。
