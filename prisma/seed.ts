// 初始資料（npm run db:seed）：
// 1. 公司資料：還沒有才建立（之後在後台 /admin/settings 修改，重跑 seed 不會覆蓋）
// 2. 第一個管理員：從環境變數 ADMIN_EMAIL、ADMIN_PASSWORD（選填 ADMIN_NAME）建立；
//    帳號已存在時會把密碼重設成 ADMIN_PASSWORD、角色設為 ADMIN、重新啟用，並登出它所有裝置（忘記密碼時用）。
// 程式碼與 .env.example 都不放任何預設密碼。
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import { hashPassword, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "../lib/password";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function seedCompanySettings() {
  const existing = await prisma.companySettings.findUnique({ where: { id: 1 }, select: { id: true } });
  if (existing) {
    console.log("・公司資料已存在，略過（要修改請到後台 /admin/settings）");
    return;
  }
  // 使用者提供的公司登記資料；營造業等級、登記證字號、電話、Email 等尚未提供，先留空
  await prisma.companySettings.create({
    data: {
      id: 1,
      name: "達吉營造有限公司",
      taxId: "93683009",
      address: "臺中市西區五權路2之107號14樓",
      representative: "莊于萱",
      foundedOn: new Date("2024-03-14T00:00:00.000Z"),
    },
  });
  console.log("・已建立公司資料");
}

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.log("・沒有設定 ADMIN_EMAIL／ADMIN_PASSWORD，略過建立管理員");
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("ADMIN_EMAIL 格式錯誤");
  if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
    throw new Error(`ADMIN_PASSWORD 長度需介於 ${PASSWORD_MIN_LENGTH}～${PASSWORD_MAX_LENGTH} 個字元`);
  }

  const passwordHash = await hashPassword(password);
  const name = process.env.ADMIN_NAME?.trim() || "管理員";
  const existing = await prisma.adminUser.findUnique({ where: { email }, select: { id: true } });

  const user = await prisma.adminUser.upsert({
    where: { email },
    create: { email, name, role: "ADMIN", passwordHash, isActive: true },
    update: { role: "ADMIN", isActive: true, passwordHash },
  });
  await prisma.session.deleteMany({ where: { userId: user.id } });
  console.log(existing ? `・已更新管理員 ${email}（密碼已重設、所有裝置已登出）` : `・已建立管理員 ${email}`);
}

async function main() {
  await seedCompanySettings();
  await seedAdmin();
}

main()
  .catch((error) => {
    console.error("seed 失敗：", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
