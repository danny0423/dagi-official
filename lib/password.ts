import { hash, verify } from "@node-rs/argon2";

// 密碼雜湊：argon2id（@node-rs/argon2 預設參數 m=19456KiB, t=2, p=1，符合 OWASP 建議）。
// 這個檔案也給 prisma/seed.ts 用，所以不能加 "server-only"。

export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 128;

export function hashPassword(password: string): Promise<string> {
  return hash(password);
}

export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  try {
    return await verify(passwordHash, password);
  } catch {
    // 雜湊格式壞掉時視為密碼錯誤，不讓例外洩漏細節
    return false;
  }
}

// 帳號不存在時也要跑一次雜湊比對，讓回應時間跟「密碼錯誤」差不多，避免從時間差猜出帳號是否存在。
let dummyHash: Promise<string> | null = null;
export async function verifyAgainstDummy(password: string): Promise<false> {
  dummyHash ??= hash("dummy-password-for-timing-only");
  await verifyPassword(await dummyHash, password);
  return false;
}
