// check-launch: fallback-file projects（只在資料庫沒有已上架的工程時顯示）
// 範例專案：資料庫沒有已上架的工程實績時，列表與 /projects/example-project 顯示這筆，僅供版型預覽；不可當作公司的實際承攬紀錄。
export const sampleProject = {
  slug: "example-project",
  notice: "【範例專案，非真實案件】",
  name: "【待填：工程名稱】",
  location: "【待填：縣市區】",
  categoryLabel: "【待填：工程類別】",
  statusLabel: "【待填：施工中／完工年份】",
  category: null,
  status: null,
} as const;
