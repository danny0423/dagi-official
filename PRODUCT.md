# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

建設公司／起造人、政府招標審查人員、危老地主。需要確認營造廠的登記資格、承攬範圍與洽詢方式。

## Product Purpose

綜合營造業公司官網；公司負責承攬施工，不是買地或銷售住宅的建設公司。

## Capabilities and Constraints

- 依據 `AGENTS.md`、`docs/design-brief.md`、`docs/site-architecture.md`。
- 使用者已指示直接完成其餘頁面；前台涵蓋 14 個頁面檔案（含工程單案），沿用首頁 token 與共用頁首頁尾。
- 尚缺的事實性資料使用明確標記的中文 placeholder。公司資料從資料庫的 `company_settings`（後台「公司資料」）讀取，欄位空白時顯示的待填文字集中於 `lib/placeholder-company.ts`，不得自行補造其他資料。無真實工地照片，不使用素材照片。
- 本輪僅做前台：洽詢與協力表單可檢查欄位，尚未開放送出、儲存或上傳；完成訊息為明確標示的文案預覽。
- 工程實績上線方式仍待決定，首頁範例不代表真實承攬。
- 本階段只執行 ESLint；啟動開發伺服器、build、commit 需另取得同意。

## Brand Commitments

文件指定清水模風格與思源黑體。使用者選定鋼藍 `#38566B` 作為 CTA 與重點強調色。

## Evidence on Hand

區塊順序與範例文案位於 `docs/site-architecture.md`。已存在的公司資料沿用共用常數；未提供的登記資格、實績、照片、聯絡資料與隆磐關係不得自行補足。

## Accessibility & Inclusion

繁體中文、WCAG AA 文字對比、鍵盤操作、可見焦點與減少動態偏好。目標寬度為 375px 與 1440px。
