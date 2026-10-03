// 輸出 JSON-LD 結構化資料。依 Next.js 文件建議用原生 <script>，並把 < 轉成 < 避免 XSS。
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
