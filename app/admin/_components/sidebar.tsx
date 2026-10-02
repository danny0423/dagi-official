"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

// 後台側邊選單。只負責顯示；權限由每個頁面與 action 自己檢查。

type NavItem = { href: string; label: string; count?: number };
type NavGroup = { title: string; items: NavItem[]; adminOnly?: boolean };

export function AdminSidebar({
  siteName,
  user,
  inboxCounts,
}: {
  siteName: string;
  user: { name: string; email: string; role: "ADMIN" | "EDITOR"; roleLabel: string };
  inboxCounts: { inquiries: number; vendors: number };
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const groups: NavGroup[] = [
    { title: "總覽", items: [{ href: "/admin", label: "儀表板" }] },
    {
      title: "內容管理",
      items: [
        { href: "/admin/projects", label: "工程實績" },
        { href: "/admin/news", label: "最新消息" },
        { href: "/admin/jobs", label: "職缺" },
        { href: "/admin/team", label: "團隊成員" },
        { href: "/admin/certifications", label: "證照" },
        { href: "/admin/media", label: "媒體庫" },
      ],
    },
    {
      title: "收件匣",
      items: [
        { href: "/admin/inquiries", label: "工程洽詢", count: inboxCounts.inquiries },
        { href: "/admin/vendor-applications", label: "協力廠商", count: inboxCounts.vendors },
      ],
    },
    {
      title: "系統設定",
      adminOnly: true,
      items: [
        { href: "/admin/settings", label: "公司資料" },
        { href: "/admin/users", label: "帳號管理" },
      ],
    },
  ];

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside className="adm-sidebar" data-open={open}>
      <Link href="/admin" className="adm-brand" onClick={() => setOpen(false)}>
        <strong>{siteName}</strong>
        <span>網站後台</span>
      </Link>
      <button
        type="button"
        className="adm-menu-toggle"
        aria-expanded={open}
        aria-controls="adm-nav"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? "關閉選單" : "選單"}
      </button>
      <nav id="adm-nav" className="adm-nav" aria-label="後台選單">
        {groups
          .filter((group) => !group.adminOnly || user.role === "ADMIN")
          .map((group) => (
            <div key={group.title} className="adm-nav-group">
              <p>{group.title}</p>
              <ul>
                {group.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={isActive(item.href) ? "page" : undefined}
                      onClick={() => setOpen(false)}
                    >
                      <span>{item.label}</span>
                      {item.count ? (
                        <span className="adm-nav-count" aria-label={`${item.count} 筆未處理`}>
                          {item.count}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
      </nav>
      <div className="adm-user">
        <p>{user.name}</p>
        <p className="adm-user-meta">
          {user.roleLabel}・{user.email}
        </p>
        {/* 一般表單 POST 到 route handler，沒有 JS 也能登出 */}
        <form method="post" action="/api/admin/logout">
          <button type="submit">登出</button>
        </form>
      </div>
    </aside>
  );
}
