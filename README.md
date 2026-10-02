# dagi-official

隆磐建設成立的綜合營造業公司官網。AI 協作者請先讀 `AGENTS.md`。

## 本機開發

```bash
cp .env.example .env      # 第一次才需要
npm install               # 會自動跑 prisma generate
npm run db:up             # 啟動開發用 PostgreSQL（port 5434）
npm run dev               # http://localhost:3000
```

- 健康檢查：`/api/health`（網站與資料庫都正常回 `{"ok":true}`）
- 後台：`/admin`（目前沒有登入功能，沒有 cookie 會被導到 `/admin/login`）
