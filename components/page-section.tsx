import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowIcon } from "@/components/arrow-icon";

export function PageSection({ id, title, children, className = "" }: {
  id: string;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return <section aria-labelledby={id} className={`interior-section ${className}`}>
    <h2 id={id}>{title}</h2>
    <div className="section-body">{children}</div>
  </section>;
}

export function InquiryLink({ location }: { location: string }) {
  return <Link href="/contact" className="button-primary" data-cta={location}>工程洽詢<ArrowIcon /></Link>;
}
