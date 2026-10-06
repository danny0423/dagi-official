// check-launch: skip-file（JSON-LD 空白欄位一律省略，不會輸出待填字樣，上線檢查不必掃這裡的 company.欄位）
import type { SiteCompany } from "@/lib/site-data/company";
import { siteUrl } from "@/lib/site";

// JSON-LD 結構化資料（docs/tech-architecture.md S4）。
// 公司資料來自資料庫（lib/site-data 的 getSiteCompany()）。只輸出已確認的欄位：
// 資料庫空白時值會是【待填：…】，含全形方括號的欄位一律省略，不輸出到搜尋引擎（AGENTS.md 內容鐵則）。

function confirmed(value: string | null | undefined): string | undefined {
  return value && !value.includes("【") ? value : undefined;
}

function absoluteUrl(path: string): string {
  return new URL(path, siteUrl).toString();
}

/** 全站共用：公司（綜合營造業）的基本資料。 */
export function generalContractorJsonLd(company: SiteCompany) {
  const address = confirmed(company.address);
  return {
    "@context": "https://schema.org",
    "@type": "GeneralContractor",
    "@id": `${absoluteUrl("/")}#organization`,
    name: confirmed(company.name),
    alternateName: confirmed(company.englishName),
    url: absoluteUrl("/"),
    description: confirmed(company.description),
    taxID: confirmed(company.taxId),
    foundingDate: confirmed(company.foundedDate),
    address: address ? { "@type": "PostalAddress", streetAddress: address, addressCountry: "TW" } : undefined,
    // 電話、Email 只在資料庫有值時輸出（跟畫面上的 tel:／mailto: 連結同一個條件）
    telephone: company.phoneHref ? confirmed(company.phone) : undefined,
    email: company.emailHref ? confirmed(company.email) : undefined,
  };
}

export type BreadcrumbItem = { name: string; path: string };

/** 內頁麵包屑，順序與畫面上的麵包屑相同（首頁 → 上層 → 本頁）。 */
export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
