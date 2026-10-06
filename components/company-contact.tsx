import { PlaceholderText } from "@/components/placeholder-text";
import type { SiteCompany } from "@/lib/site-data";

// 公司電話／Email：資料庫有值才產生 tel:／mailto: 連結（GA4 的 click_phone、click_email 依連結判斷），
// 空白時只顯示【待填】字樣，不產生假連結。
// 欄位用 company.phone／company.email 明寫，不用 company[kind]，上線檢查腳本才找得到引用了哪些欄位。
export function CompanyContact({ kind, company }: { kind: "phone" | "email"; company: SiteCompany }) {
  const [text, href] = kind === "phone" ? [company.phone, company.phoneHref] : [company.email, company.emailHref];
  const content = <PlaceholderText text={text} />;
  return href ? <a href={href}>{content}</a> : <span>{content}</span>;
}
