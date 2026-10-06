import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { DEFAULT_COMPANY_NAME } from "@/lib/placeholder-company";

// 前台共用的分享預覽圖（LINE、Facebook 等），docs/ux-review-site.md #10。
// 還沒有正式素材：先用清水模灰底＋公司名稱與「綜合營造業」的純文字圖；不放暫用的隆磐照片（D17）。
// 各頁不要自己設定 openGraph，否則會蓋掉這張圖（見 lib/seo/metadata.ts）。
// 例外：這張圖的公司名稱刻意不讀資料庫，固定用 DEFAULT_COMPANY_NAME。字型只含下面這些字的子集，
// 後台改了名稱會缺字；而且這張圖在 build 時就產生（build 時沒有資料庫）。正式改名時照下面的步驟重做字型並改常數。
const companyName = DEFAULT_COMPANY_NAME;
export const alt = `${companyName}｜綜合營造業`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// ImageResponse 內建字型沒有中文字形，所以帶入 Noto Sans TC 的子集（只含圖上的字，各約 5KB；SIL OFL 1.1，見 lib/seo/og-fonts/OFL.txt）。
// build 時不需要連網。圖上文字改了（例如公司名稱）要重新產生子集，否則會缺字：
//   curl 'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@700&text=<網址編碼後的全部文字>'
//   再下載回應裡的 truetype 字型網址，覆蓋 lib/seo/og-fonts/noto-sans-tc-700-subset.ttf（500 字重同理）。
// 這張圖在 build 時就產生成靜態檔；字型在函式裡才讀，避免執行期載入模組時因為找不到字型檔而出錯。
const fontDir = join(process.cwd(), "lib/seo/og-fonts");

export default async function Image() {
  const [bold, medium] = await Promise.all([
    readFile(join(fontDir, "noto-sans-tc-700-subset.ttf")),
    readFile(join(fontDir, "noto-sans-tc-500-subset.ttf")),
  ]);
  return new ImageResponse(
    (
      <div style={{
        width: "100%", height: "100%", display: "flex", position: "relative",
        backgroundColor: "#ddded9",
        backgroundImage: "radial-gradient(circle at 18% 23%, #ffffff66, #ffffff00 60%), linear-gradient(115deg, #ffffff1f, #242a2b0a)",
        color: "#242a2b", fontFamily: "Noto Sans TC",
      }}>
        <div style={{ position: "absolute", top: 40, left: 40, right: 40, bottom: 40, display: "flex", border: "1px solid #242a2b26" }} />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", width: "100%", padding: "0 120px" }}>
          <div style={{ width: 96, height: 4, backgroundColor: "#38566b" }} />
          <div style={{ marginTop: 48, fontSize: 96, fontWeight: 700, lineHeight: 1.3, letterSpacing: "-0.02em" }}>{companyName}</div>
          <div style={{ marginTop: 24, fontSize: 40, fontWeight: 500, letterSpacing: "0.3em", color: "#595f5e" }}>綜合營造業</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Noto Sans TC", data: bold, weight: 700, style: "normal" },
        { name: "Noto Sans TC", data: medium, weight: 500, style: "normal" },
      ],
    },
  );
}
