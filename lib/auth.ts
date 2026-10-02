// 後台登入 session cookie 名稱（D12）
// 這個檔案會被 proxy.ts 匯入，只放常數，不要加資料庫或 Node 專屬的程式。
export const SESSION_COOKIE = "admin_session";

// session 有效期：7 天（不滑動延長，到期需重新登入）
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
