import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // EC2 + Docker 部署用（D9）
  output: "standalone",
  // lib/storage/local.ts 用 process.cwd() 組路徑，會讓檔案追蹤把整個專案目錄打包進 standalone。
  // 排除執行期用不到、或不該出貨的檔案（隆磐素材、審查截圖、上傳檔、文件、環境變數檔）。
  outputFileTracingExcludes: {
    "/**": [
      "./assets/**/*",
      "./review-screens/**/*",
      "./storage/**/*",
      "./docs/**/*",
      "./.env",
      "./.env.*",
      "./.git/**/*",
      "./*.md",
      "./tsconfig.tsbuildinfo",
    ],
  },
};

export default nextConfig;
