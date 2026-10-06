// check-launch: skip-file（這裡的待填文字只有在資料庫欄位空白時才會顯示，由上線檢查依資料庫實際值判斷）
//
// 公司資料的「資料庫欄位 → 標籤／待填文字／預設值」對照（client／server 共用，不能加 "server-only"）。
// 前台一律讀資料庫的 company_settings（lib/site-data/），這裡只決定欄位空白時畫面顯示什麼：
//   - placeholder：空白時顯示的【待填：…】字樣（AGENTS.md 內容鐵則：事實性內容沒有真實值就寫待填）
//   - defaultValue：空白時改用的預設值（只有公司名稱與集團官網，都是已確認的事實）
//   - 兩者都沒有：空白時不顯示（只用在 JSON-LD、SEO 描述等，省略即可）
// 欄位名稱與後台 /admin/settings 的表單一致；新增欄位要同步改 prisma/schema.prisma 的 CompanySettings。

/** 公司名稱（使用者提供，2026-10-02）。資料庫必填，只有 company_settings 整筆不存在時才會用到。 */
export const DEFAULT_COMPANY_NAME = "達吉營造有限公司";

/** 集團（隆磐建設）官網。集團關係頁、頁尾一定要有這個連結，資料庫空白時用這個。 */
export const DEFAULT_GROUP_URL = "https://www.longpon.com.tw/";

export const companyColumns = {
  name: { label: "公司名稱", placeholder: null, defaultValue: DEFAULT_COMPANY_NAME },
  englishName: { label: "英文名稱", placeholder: null, defaultValue: null },
  taxId: { label: "統一編號", placeholder: "【待填：統一編號】", defaultValue: null },
  representative: { label: "代表人", placeholder: "【待填：負責人】", defaultValue: null },
  foundedOn: { label: "設立日期", placeholder: "【待填：成立年份】", defaultValue: null },
  contractorGrade: { label: "營造業等級", placeholder: "【待填：甲／乙／丙級】", defaultValue: null },
  licenseNumber: { label: "營造業登記證字號", placeholder: "【待填：營造業登記證字號】", defaultValue: null },
  registeredCity: { label: "登記縣市", placeholder: "【待填：登記縣市】", defaultValue: null },
  registrationAuthority: { label: "登記機關", placeholder: "【待填：登記機關】", defaultValue: null },
  capital: { label: "實收資本額", placeholder: "【待填：實收資本額】", defaultValue: null },
  engineerCount: { label: "專任工程人員人數", placeholder: "【待填：專任工程人員人數】", defaultValue: null },
  address: { label: "地址", placeholder: "【待填：公司登記地址】", defaultValue: null },
  phone: { label: "電話", placeholder: "【待填：公司電話】", defaultValue: null },
  fax: { label: "傳真", placeholder: "【待填：公司傳真，沒有就拿掉】", defaultValue: null },
  email: { label: "Email", placeholder: "【待填：公司 Email】", defaultValue: null },
  serviceHours: { label: "服務時間", placeholder: "【待填：服務時間】", defaultValue: null },
  responseTime: { label: "洽詢回覆時間", placeholder: "【待填：回覆時間，例：○ 個工作天】", defaultValue: null },
  groupUrl: { label: "集團（隆磐建設）官網", placeholder: null, defaultValue: DEFAULT_GROUP_URL },
  description: { label: "一句話介紹", placeholder: null, defaultValue: null },
} as const satisfies Record<string, { label: string; placeholder: string | null; defaultValue: string | null }>;

export type CompanyColumn = keyof typeof companyColumns;

/** 空白時會在畫面顯示【待填】的欄位（上線檢查只看這些）。 */
export type PlaceholderColumn = {
  [K in CompanyColumn]: (typeof companyColumns)[K]["placeholder"] extends string ? K : never;
}[CompanyColumn];

export const placeholderColumns = (Object.keys(companyColumns) as CompanyColumn[]).filter(
  (column): column is PlaceholderColumn => companyColumns[column].placeholder !== null,
);

export function isPlaceholderColumn(column: CompanyColumn): column is PlaceholderColumn {
  return companyColumns[column].placeholder !== null;
}
