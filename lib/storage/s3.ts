import "server-only";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { assertValidKey, type StorageDriver } from "@/lib/storage/types";

// S3 儲存（D9）。⚠ 尚未實測，換成 STORAGE_DRIVER=s3 前要先在測試 bucket 驗證上傳、讀取、刪除。
// 環境變數：
//   S3_BUCKET、S3_REGION、S3_PUBLIC_BASE_URL（必填；公開讀取網址，例 https://<bucket>.s3.<region>.amazonaws.com 或 CloudFront 網址）
//   S3_KEY_PREFIX（選填，例 uploads/）
//   S3_ACCESS_KEY_ID、S3_SECRET_ACCESS_KEY（選填；EC2 建議用 IAM Role，不填就走 AWS 預設憑證鏈）
//   S3_ENDPOINT（選填；S3 相容服務才需要）

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`STORAGE_DRIVER=s3 需要設定環境變數 ${name}`);
  return value;
}

let client: S3Client | null = null;

function getClient(): S3Client {
  if (client) return client;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  client = new S3Client({
    region: requireEnv("S3_REGION"),
    ...(process.env.S3_ENDPOINT ? { endpoint: process.env.S3_ENDPOINT, forcePathStyle: true } : {}),
    ...(accessKeyId && secretAccessKey ? { credentials: { accessKeyId, secretAccessKey } } : {}),
  });
  return client;
}

function objectKey(key: string): string {
  return `${process.env.S3_KEY_PREFIX ?? ""}${key}`;
}

export const s3StorageDriver: StorageDriver = {
  name: "s3",

  async put(key, body, contentType) {
    assertValidKey(key);
    await getClient().send(
      new PutObjectCommand({
        Bucket: requireEnv("S3_BUCKET"),
        Key: objectKey(key),
        Body: body,
        ContentType: contentType,
        // 檔名是隨機 id、不會被覆寫，可以長期快取
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
  },

  async delete(key) {
    assertValidKey(key);
    await getClient().send(new DeleteObjectCommand({ Bucket: requireEnv("S3_BUCKET"), Key: objectKey(key) }));
  },

  getUrl(key) {
    return `${requireEnv("S3_PUBLIC_BASE_URL").replace(/\/+$/, "")}/${objectKey(key)}`;
  },
};
