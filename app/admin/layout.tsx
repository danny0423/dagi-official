import type { Metadata } from "next";

// 後台不收錄、不裝 GA4
export const metadata: Metadata = {
  title: "後台",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <>{children}</>;
}
