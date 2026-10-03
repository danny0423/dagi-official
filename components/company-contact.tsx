import { company } from "@/lib/placeholder-company";
import { PlaceholderText } from "@/components/placeholder-text";

// 欄位用 company.phone／company.email 明寫，不用 company[kind]，上線檢查腳本才找得到引用了哪些欄位。
export function CompanyContact({ kind }: { kind: "phone" | "email" }) {
  const [text, href] = kind === "phone" ? [company.phone, company.phoneHref] : [company.email, company.emailHref];
  const content = <PlaceholderText text={text} />;
  return href ? <a href={href}>{content}</a> : <span>{content}</span>;
}
