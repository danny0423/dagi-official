"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { ArrowIcon } from "@/components/arrow-icon";

const links = [
  { href: "/services", label: "承攬業務" },
  { href: "/projects", label: "工程實績" },
  { href: "/safety-quality", label: "工安品質" },
  { href: "/news", label: "最新消息" },
  { href: "/contact", label: "聯絡我們" },
];
const aboutLinks = [
  { href: "/about", label: "關於我們" },
  { href: "/about/license", label: "營造業登記與資格" },
  { href: "/about/team", label: "專業團隊" },
  { href: "/about/group", label: "集團關係" },
];

export function SiteNavigation() {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const about = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();

  function close() {
    setOpen(false);
    if (about.current) about.current.open = false;
  }

  return (
    <nav aria-label="主要導覽" className="site-navigation"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) close();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          if (about.current?.open) {
            about.current.open = false;
            about.current.querySelector("summary")?.focus();
          } else if (open) {
            close();
            toggle.current?.focus();
          }
        }
      }}>
      <button ref={toggle} className="menu-toggle" type="button" aria-expanded={open} aria-controls="site-menu" onClick={() => {
        if (open) close(); else setOpen(true);
      }}>
        <span>{open ? "關閉" : "選單"}</span>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d={open ? "m6 6 12 12M6 18 18 6" : "M3 8h18M3 16h18"} stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>
      <ul id="site-menu" className={`site-menu${open ? " is-open" : ""}`}>
        <li>
          <details ref={about} className="about-menu">
            <summary className={pathname.startsWith("/about") ? "is-active" : ""}>關於我們
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="m2 4 4 4 4-4" stroke="currentColor" strokeWidth="1.5" /></svg>
            </summary>
            <ul className="about-submenu">
              {aboutLinks.map(({ href, label }) => <li key={href}><Link href={href} aria-current={pathname === href ? "page" : undefined} onClick={close}>{label}</Link></li>)}
            </ul>
          </details>
        </li>
        {links.map(({ href, label }) => <li key={href}>
          <Link href={href} className={href === "/contact" ? "nav-contact" : undefined} data-cta={href === "/contact" ? "header" : undefined} aria-current={pathname === href ? "page" : undefined} onClick={close}>{label}{href === "/contact" && <ArrowIcon diagonal />}</Link>
        </li>)}
      </ul>
    </nav>
  );
}
