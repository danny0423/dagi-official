import { company } from "@/lib/placeholder-company";
import { PlaceholderText } from "@/components/placeholder-text";

export function CompanyContact({ kind }: { kind: "phone" | "email" }) {
  const href = kind === "phone" ? company.phoneHref : company.emailHref;
  const content = <PlaceholderText text={company[kind]} />;
  return href ? <a href={href}>{content}</a> : <span>{content}</span>;
}
