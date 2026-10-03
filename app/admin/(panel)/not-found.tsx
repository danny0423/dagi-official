import Link from "next/link";

// 後台的 404（docs/ux-review-admin.md #24）：(panel) 底下的頁面呼叫 notFound()（例如 /admin/jobs/[id] 找不到資料）時，
// 會顯示這頁，保留後台外框與側邊選單；不會落到前台樣式的 app/not-found.tsx。
// 後台底下打錯的網址由 [...missing]/page.tsx 呼叫 notFound() 導來這裡。
export default function AdminNotFound() {
  return (
    <div className="adm-page">
      <div className="adm-card adm-error-view" role="alert">
        <div>
          <p className="adm-hint">網站後台</p>
          <h1>找不到這個頁面</h1>
        </div>
        <p>這筆資料可能已經被刪除，或網址打錯了。可以從左側選單回到要找的功能。</p>
        <div className="adm-actions">
          <Link href="/admin" className="adm-btn adm-btn-primary">
            回儀表板
          </Link>
        </div>
      </div>
    </div>
  );
}
