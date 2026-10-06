# dagi-official

隆磐建設成立的綜合營造業公司官網。AI 協作者請先讀 `AGENTS.md`。

## 本機開發

```bash
cp .env.example .env      # 第一次才需要
npm install               # 會自動跑 prisma generate
npm run db:up             # 啟動開發用 PostgreSQL（port 5434）
npm run db:migrate        # 建立／更新資料表
npm run dev               # http://localhost:3000
```

- 健康檢查：`/api/health`（網站與資料庫都正常回 `{"ok":true}`）
- 後台：`/admin`（沒登入會被導到 `/admin/login`）

## 建立第一個管理員

```bash
ADMIN_EMAIL="you@example.com" ADMIN_PASSWORD="至少10個字元的密碼" npm run db:seed
```

- 也會建立公司資料（只在還沒有時建立，之後到後台「公司資料」修改）。
- 帳號已存在時會把密碼重設成 `ADMIN_PASSWORD`（忘記密碼時用），並登出它所有裝置。可加 `ADMIN_NAME` 設定顯示名稱。
- 密碼不要留在 shell 歷史或 `.env` 裡：指令前面加一個空白（bash 預設不記錄），或暫時寫進 `.env`、建完就刪掉。
- 其他帳號由管理員在後台「帳號管理」新增。角色：管理員（全部功能）、編輯（內容與收件匣）。

## 範例資料（看完整畫面用）

```bash
npm run db:seed:samples    # 建立範例資料（會先刪掉舊的範例再重建，可以重複執行）
npm run db:clear:samples   # 刪除所有範例資料與範例圖片
```

- 每一種後台可以新增的內容都會有 3～4 筆範例，涵蓋不同狀態（上架／未上架、首頁精選、已過期證照、未同意公開的團隊成員、收件匣三種處理狀態…），範例圖片是程式產生的清水模灰底圖（標著「範例圖片」）。
- 範例一律以「【範例】」開頭，人名用代稱、電話 `0000` 開頭、Email 用 `@example.com`；不建帳號、不改公司資料。判斷哪些是範例的規則在 `lib/sample-data.ts`，清除時只刪符合規則的資料。
- 只會寫入本機資料庫（`DATABASE_URL` 是 localhost）；確定要寫到別的環境才加 `SAMPLES_ALLOW_REMOTE=1`。
- 腳本直接寫資料庫，不會通知網站更新快取：正式模式（`next start`）請登入後台，到儀表板按「重新整理前台快取」（管理員才看得到）；`next dev` 用瀏覽器強制重新整理（Ctrl+Shift+R）即可。
- **上線前一定要跑 `npm run db:clear:samples`**。資料庫裡還有範例時，後台儀表板的「上線前檢查」會提醒。

## 圖片儲存（`STORAGE_DRIVER`）

| 值 | 存在哪 | 說明 |
|---|---|---|
| `local`（預設） | 專案根目錄 `storage/uploads/`（不進 git） | 由 `/media/...` 提供給前台。Docker 部署時要把 `/app/storage` 掛成 volume，否則容器重建後圖片會消失 |
| `s3` | AWS S3 | 需設定 `S3_BUCKET`、`S3_REGION`、`S3_PUBLIC_BASE_URL`（其餘選填，見 `.env.example`）。**尚未實測** |

資料庫只存相對路徑，切換時不用改資料，但要先把 `storage/uploads/` 底下的檔案照原路徑搬到 S3。
