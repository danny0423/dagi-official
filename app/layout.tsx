import type { Metadata } from "next";
import { siteUrl } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "【待填：公司名稱】營造",
    template: "%s｜【待填：公司名稱】營造",
  },
  description: "【待填：公司一句話介紹】",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-TW">
      <body>{children}</body>
    </html>
  );
}
