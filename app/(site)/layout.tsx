import { Noto_Sans_TC } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const notoSansTC = Noto_Sans_TC({
  variable: "--font-noto-sans-tc",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <div className={`site-shell ${notoSansTC.variable}`}>
      <a href="#main-content" className="skip-link">跳至主要內容</a>
      <SiteHeader />
      <main id="main-content" tabIndex={-1}>{children}</main>
      <SiteFooter />
    </div>
  );
}
