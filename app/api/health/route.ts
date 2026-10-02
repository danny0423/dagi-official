import { prisma } from "@/lib/db";

// 部署後的健康檢查：網站與資料庫都正常才回 200
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ ok: true, db: true });
  } catch {
    return Response.json({ ok: false, db: false }, { status: 503 });
  }
}
