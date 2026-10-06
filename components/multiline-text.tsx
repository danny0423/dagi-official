// 後台多行文字欄位（簡介、經歷、工作內容…）在前台的顯示：每一行一個段落，空行略過。
// 回傳段落陣列（不包外層），放在 .section-body 之類的容器裡會套用既有的段落間距。
export function MultilineText({ text, className }: { text: string | null | undefined; className?: string }) {
  return (text ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => <p key={index} className={className}>{line}</p>);
}
