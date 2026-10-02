import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // EC2 + Docker 部署用（D9）
  output: "standalone",
};

export default nextConfig;
