import type { Metadata } from "next";
import "./admin.css";

// 後台不收錄、不裝 GA4。登入頁也在這層底下，所以這裡不做登入檢查；
// 需要登入的頁面放在 (panel)/，由 (panel)/layout.tsx 與各頁面自己的 requireAdmin()/requireRole() 檢查。
export const metadata: Metadata = {
  title: { default: "後台", template: "%s｜後台" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <div className="admin-shell">{children}</div>;
}
