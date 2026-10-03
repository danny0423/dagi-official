import { company } from "@/lib/placeholder-company";
import { siteUrl } from "@/lib/site";

// JSON-LD 結構化資料（docs/tech-architecture.md S4）。
// 只輸出已確認的欄位；值裡面還有全形方括號標記（待填、範例）的欄位一律省略，不輸出到搜尋引擎（AGENTS.md 內容鐵則）。
// 電話、Email 等仍待填的欄位不放；補齊真實資料後再評估加入 telephone、email。

function confirmed(value: string | null | undefined): string | undefined {
  return value && !value.includes("【") ? value : undefined;
}

function absoluteUrl(path: string): string {
  return new URL(path, siteUrl).toString();
}

/** 全站共用：公司（綜合營造業）的基本資料。 */
export function generalContractorJsonLd() {
  const address = confirmed(company.address);
  return {
    "@context": "https://schema.org",
    "@type": "GeneralContractor",
    "@id": `${absoluteUrl("/")}#organization`,
    name: confirmed(company.name),
    url: absoluteUrl("/"),
    taxID: confirmed(company.taxId),
    foundingDate: confirmed(company.foundedDate),
    address: address ? { "@type": "PostalAddress", streetAddress: address, addressCountry: "TW" } : undefined,
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
