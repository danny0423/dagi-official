// 登入者預覽時，訪客看不到的那一筆內容上方的標籤（lib/site-data/preview.ts 的 previewLabels，例如「未上架・只有你看得到」）。
// 訪客拿到的是公開資料，沒有 previewLabels，這裡什麼都不輸出。
export function PreviewLabels({ labels }: { labels?: string[] }) {
  if (!labels?.length) return null;
  return (
    <div className="preview-labels">
      {labels.map((label) => <span className="preview-label" key={label}>{label}</span>)}
    </div>
  );
}
