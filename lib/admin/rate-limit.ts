import "server-only";

// 登入嘗試頻率限制（記憶體內）。
// ⚠ 只在單一 Node 程序內有效：之後若跑多個容器／多台機器，計數不會共用，要改成 Redis 或資料庫。
// 規則：15 分鐘內，同 IP＋同帳號失敗 5 次、或同 IP 不分帳號失敗 20 次，就先擋到時間窗結束。

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS_PER_ACCOUNT = 5;
const MAX_FAILS_PER_IP = 20;
const MAX_BUCKETS = 10_000;

type Bucket = { count: number; resetAt: number };

// 開發模式熱重載時保留計數
const globalForLimit = globalThis as unknown as { loginBuckets?: Map<string, Bucket> };
const buckets = (globalForLimit.loginBuckets ??= new Map<string, Bucket>());

function keys(ip: string, email: string) {
  return { account: `acct:${ip}:${email}`, ip: `ip:${ip}` };
}

function read(key: string, now: number): Bucket | null {
  const bucket = buckets.get(key);
  if (!bucket) return null;
  if (bucket.resetAt <= now) {
    buckets.delete(key);
    return null;
  }
  return bucket;
}

function sweep(now: number) {
  if (buckets.size < MAX_BUCKETS) return;
  for (const [key, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(key);
}

export function checkLoginAllowed(ip: string, email: string): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  const k = keys(ip, email);
  const blocked = [
    [read(k.account, now), MAX_FAILS_PER_ACCOUNT],
    [read(k.ip, now), MAX_FAILS_PER_IP],
  ] as const;
  for (const [bucket, max] of blocked) {
    if (bucket && bucket.count >= max) {
      return { allowed: false, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) };
    }
  }
  return { allowed: true, retryAfterSec: 0 };
}

export function recordLoginFailure(ip: string, email: string): void {
  const now = Date.now();
  sweep(now);
  const k = keys(ip, email);
  for (const key of [k.account, k.ip]) {
    const bucket = read(key, now);
    if (bucket) bucket.count += 1;
    else buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
  }
}

export function clearLoginFailures(ip: string, email: string): void {
  buckets.delete(keys(ip, email).account);
}
