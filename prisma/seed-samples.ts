// 範例資料（npm run db:seed:samples）：讓後台每一種可以新增的內容都有幾筆範例，前台與後台的各種畫面都看得到完整樣子。
//
// - 每次執行都會「先刪掉既有的範例資料，再重新建立」（clearSamples，規則見 lib/sample-data.ts），
//   所以可以重複執行，結果一定是下面定義的這一份；在後台改過的範例也會被還原。非範例資料不會動到。
// - 所有標題／名稱都以【範例】開頭，人名用代稱、編號類欄位寫【範例】、電話用 0000 開頭、Email 用 @example.com，
//   一眼就看得出不是真的（AGENTS.md 內容鐵則）。不會建立帳號，也不會修改公司資料。
// - 圖片用程式產生（sharp 把 SVG 轉成 JPG／PNG／WebP，sharp 是 next 附帶的套件），清水模灰底＋「範例圖片」字樣，
//   透過 lib/storage 存進儲存區（依 STORAGE_DRIVER），並寫入 media 表。不使用 assets/ 的素材，也不下載網路圖片。
// - 只允許寫入本機資料庫（DATABASE_URL 的主機是 localhost／127.0.0.1）；要寫到其他環境請加 SAMPLES_ALLOW_REMOTE=1。
// - 上線前一定要執行 npm run db:clear:samples 清除。
import "dotenv/config";
import { randomBytes } from "node:crypto";
import sharp from "sharp";
import type { PrismaClient } from "../lib/generated/prisma/client";
import { SLUG_PATTERN } from "../lib/admin/slug";
import { countSampleData, SAMPLE_PREFIX } from "../lib/sample-data";
import { getStorage } from "../lib/storage";
import {
  clearSamples,
  createScriptPrisma,
  databaseLabel,
  isLocalDatabase,
  printCacheReminder,
  printClearResult,
} from "./samples-lib";

const prisma = createScriptPrisma();

// ───────── 範例圖片 ─────────

type ImageFormat = "jpeg" | "png" | "webp";

type ImageSpec = {
  /** 原始檔名（不含【範例】與副檔名），媒體庫會顯示 */
  name: string;
  /** 圖上第二行：用途，例「範例：工程封面」 */
  purpose: string;
  /** 圖上第三行：屬於哪筆內容 */
  caption: string;
  /** 替代文字；工程圖庫在前台會當成圖說顯示 */
  alt: string;
  width: number;
  height: number;
  format?: ImageFormat;
  /** concrete：清水模牆面（照片類）；document：紙本文件（證照影本） */
  style?: "concrete" | "document";
};

const FORMATS = {
  jpeg: { mime: "image/jpeg", ext: "jpg" },
  png: { mime: "image/png", ext: "png" },
  webp: { mime: "image/webp", ext: "webp" },
} as const;

// 清水模的灰階，每張圖輪流用不同的冷暖灰，圖庫裡的照片才分得出來
const CONCRETE_TONES = [
  ["#d6d4cf", "#a7a49e"],
  ["#d2d3d1", "#9ea1a2"],
  ["#dbd6cd", "#aba498"],
  ["#cfcdc8", "#8f8c86"],
] as const;

const FONT = "Noto Sans CJK TC, Noto Sans TC, PingFang TC, Microsoft JhengHei, sans-serif";

function escapeXml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function concreteBackground(width: number, height: number, index: number): string {
  const [light, dark] = CONCRETE_TONES[index % CONCRETE_TONES.length]!;
  // 模板分割線（橫向長條板）與螺栓孔，看起來像清水模牆面
  const panelW = Math.round(width / 4);
  const panelH = Math.round(panelW / 2);
  const lines: string[] = [];
  const holes: string[] = [];
  for (let x = panelW; x < width; x += panelW) lines.push(`<line x1="${x}" y1="0" x2="${x}" y2="${height}"/>`);
  for (let y = panelH; y < height; y += panelH) lines.push(`<line x1="0" y1="${y}" x2="${width}" y2="${y}"/>`);
  const holeR = Math.max(4, width / 220).toFixed(1);
  for (let x = 0; x < width; x += panelW) {
    for (let y = 0; y < height; y += panelH) {
      for (const fx of [0.2, 0.8]) {
        for (const fy of [0.3, 0.7]) {
          holes.push(`<circle cx="${(x + panelW * fx).toFixed(1)}" cy="${(y + panelH * fy).toFixed(1)}" r="${holeR}"/>`);
        }
      }
    }
  }
  return `
<defs>
  <linearGradient id="tone" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${light}"/><stop offset="1" stop-color="${dark}"/></linearGradient>
  <filter id="mottle" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.006" numOctaves="3" seed="${index * 13 + 3}"/><feColorMatrix type="matrix" values="0 0 0 0 0.35  0 0 0 0 0.34  0 0 0 0 0.32  0 0 0 0.55 -0.12"/></filter>
  <filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="${index * 7 + 11}"/><feColorMatrix type="matrix" values="0 0 0 0 0.2  0 0 0 0 0.2  0 0 0 0 0.2  0 0 0 0.35 -0.05"/></filter>
</defs>
<rect width="100%" height="100%" fill="url(#tone)"/>
<rect width="100%" height="100%" filter="url(#mottle)"/>
<rect width="100%" height="100%" filter="url(#grain)"/>
<g stroke="#77746e" stroke-opacity="0.45" stroke-width="${Math.max(2, width / 600).toFixed(1)}">${lines.join("")}</g>
<g fill="#6f6c66" fill-opacity="0.55" stroke="#e4e2dd" stroke-opacity="0.5" stroke-width="1.5">${holes.join("")}</g>`;
}

function documentBackground(width: number, height: number): string {
  const s = Math.min(width, height);
  const outer = s * 0.04;
  const inner = s * 0.058;
  return `
<defs>
  <filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="5"/><feColorMatrix type="matrix" values="0 0 0 0 0.4  0 0 0 0 0.38  0 0 0 0 0.35  0 0 0 0.18 -0.03"/></filter>
</defs>
<rect width="100%" height="100%" fill="#f1efe9"/>
<rect width="100%" height="100%" filter="url(#grain)"/>
<rect x="${outer}" y="${outer}" width="${width - outer * 2}" height="${height - outer * 2}" fill="none" stroke="#8f8c86" stroke-width="${(s * 0.006).toFixed(1)}"/>
<rect x="${inner}" y="${inner}" width="${width - inner * 2}" height="${height - inner * 2}" fill="none" stroke="#8f8c86" stroke-width="1.5"/>
<text x="${width / 2}" y="${height * 0.2}" text-anchor="middle" font-family="${FONT}" font-weight="700" font-size="${(s * 0.07).toFixed(0)}" fill="#5f5c57" letter-spacing="${(s * 0.02).toFixed(0)}">證　書</text>
<g stroke="#b9b6b0" stroke-width="2">${[0.66, 0.71, 0.76].map((fy) => `<line x1="${width * 0.2}" y1="${height * fy}" x2="${width * 0.8}" y2="${height * fy}"/>`).join("")}</g>`;
}

function sampleSvg(spec: ImageSpec, index: number): string {
  const { width, height } = spec;
  const s = Math.min(width, height);
  const plateW = Math.round(width * 0.66);
  const plateH = Math.round(s * 0.44);
  const px = (width - plateW) / 2;
  const py = spec.style === "document" ? height * 0.3 : (height - plateH) / 2;
  const background = spec.style === "document" ? documentBackground(width, height) : concreteBackground(width, height, index);
  // 左上角的【範例】：文件樣式要放在外框裡面
  const corner = spec.style === "document" ? { x: s * 0.085, y: s * 0.13 } : { x: s * 0.03, y: s * 0.065 };
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
${background}
<rect x="${px}" y="${py}" width="${plateW}" height="${plateH}" rx="${(s * 0.012).toFixed(1)}" fill="#f4f3f0" fill-opacity="0.88"/>
<text x="${width / 2}" y="${py + plateH * 0.34}" text-anchor="middle" font-family="${FONT}" font-weight="700" font-size="${(s * 0.085).toFixed(0)}" fill="#2a2927">範例圖片</text>
<text x="${width / 2}" y="${py + plateH * 0.56}" text-anchor="middle" font-family="${FONT}" font-weight="500" font-size="${(s * 0.042).toFixed(0)}" fill="#3d3b38">${escapeXml(spec.purpose)}</text>
<text x="${width / 2}" y="${py + plateH * 0.72}" text-anchor="middle" font-family="${FONT}" font-size="${(s * 0.03).toFixed(0)}" fill="#4f4d49">${escapeXml(spec.caption)}</text>
<text x="${width / 2}" y="${py + plateH * 0.88}" text-anchor="middle" font-family="${FONT}" font-size="${(s * 0.022).toFixed(0)}" fill="#6a6762" letter-spacing="2">SAMPLE IMAGE・非真實照片・${width} × ${height}</text>
<text x="${corner.x.toFixed(0)}" y="${corner.y.toFixed(0)}" font-family="${FONT}" font-weight="700" font-size="${(s * 0.036).toFixed(0)}" fill="#2a2927" fill-opacity="0.8">${SAMPLE_PREFIX}</text>
</svg>`;
}

async function renderImage(spec: ImageSpec, index: number): Promise<Buffer> {
  const image = sharp(Buffer.from(sampleSvg(spec, index)));
  const format = spec.format ?? "jpeg";
  if (format === "png") return image.png({ compressionLevel: 9 }).toBuffer();
  if (format === "webp") return image.webp({ quality: 80 }).toBuffer();
  return image.jpeg({ quality: 82, mozjpeg: true }).toBuffer();
}

// 儲存路徑格式同 lib/media.ts 的 saveUpload（年/月/32 碼隨機 hex.副檔名，lib/storage/types.ts 會驗證）
function newStorageKey(ext: string): string {
  const now = new Date();
  return `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${randomBytes(16).toString("hex")}.${ext}`;
}

let imageCount = 0;

/** 產生一張範例圖片、存進儲存區、寫入 media 表，回傳 media id */
async function createImage(db: PrismaClient, spec: ImageSpec): Promise<number> {
  const index = imageCount++;
  const format = FORMATS[spec.format ?? "jpeg"];
  const buffer = await renderImage(spec, index);
  const key = newStorageKey(format.ext);
  const storage = getStorage();
  await storage.put(key, buffer, format.mime);
  try {
    const media = await db.media.create({
      data: {
        storageKey: key,
        // 原始檔名以【範例】開頭、沒有上傳者：clearSamples 靠這兩點認出範例圖片（lib/sample-data.ts）
        originalName: `${SAMPLE_PREFIX}${spec.name}.${format.ext}`,
        alt: spec.alt,
        width: spec.width,
        height: spec.height,
        size: buffer.length,
        mimeType: format.mime,
        uploadedById: null,
      },
      select: { id: true },
    });
    return media.id;
  } catch (error) {
    await storage.delete(key).catch(() => {});
    throw error;
  }
}

// ───────── 小工具 ─────────

/** @db.Date 欄位：存成 UTC 午夜（同後台 lib/admin/validation.ts） */
const day = (value: string) => new Date(`${value}T00:00:00.000Z`);
/** 時間戳記（台北時間） */
const at = (value: string) => new Date(`${value}+08:00`);

/** 範例排在最上面：表裡沒有其他資料時從 0 開始，有的話排在現有最小排序值之前（間隔 10，同後台） */
function sortOrders(currentMin: number | null, count: number): number[] {
  const start = currentMin === null ? 0 : currentMin - count * 10;
  return Array.from({ length: count }, (_, i) => start + i * 10);
}

function assertSlug(slug: string): string {
  if (!SLUG_PATTERN.test(slug)) throw new Error(`範例資料的網址代稱不合規則：${slug}`);
  return slug;
}

// ───────── 範例內容 ─────────

const NOT_REAL_PROJECT = "（以下為版面示意用的範例文字，非真實工程紀錄）";

async function seedProjects(db: PrismaClient) {
  const p1 = "【範例】台中市西區集合住宅新建工程";
  const p2 = "【範例】彰化縣鋼構廠房新建工程";
  const p3 = "【範例】台中市危老重建工程";
  const p4 = "【範例】南投縣社區活動中心整建工程";
  const cover = (title: string, short: string) =>
    ({ name: `工程封面-${short}`, purpose: "範例：工程封面", caption: title, alt: `${title} 封面（範例圖片）`, width: 1600, height: 1200 }) as const;
  const photo = (title: string, short: string, n: number, alt: string, size: [number, number] = [1600, 1200]) =>
    ({ name: `工程照片-${short}-${n}`, purpose: `範例：工程照片 ${n}`, caption: title, alt, width: size[0], height: size[1] }) as const;

  const images = {
    p1Cover: await createImage(db, cover(p1, "台中西區集合住宅")),
    p1Gallery: [
      await createImage(db, photo(p1, "台中西區集合住宅", 1, "【範例】基礎開挖與擋土支撐")),
      await createImage(db, photo(p1, "台中西區集合住宅", 2, "【範例】標準層模板組立", [1600, 900])),
      await createImage(db, photo(p1, "台中西區集合住宅", 3, "【範例】工地出入口洗車台與防塵設施")),
    ],
    p2Cover: await createImage(db, cover(p2, "彰化鋼構廠房")),
    p2Gallery: [
      await createImage(db, photo(p2, "彰化鋼構廠房", 1, "【範例】鋼構吊裝作業")),
      await createImage(db, photo(p2, "彰化鋼構廠房", 2, "【範例】完工後廠房內部", [1600, 900])),
    ],
    p3Cover: await createImage(db, cover(p3, "台中危老重建")),
    p4Cover: await createImage(db, cover(p4, "南投活動中心")),
    p4Gallery: [await createImage(db, photo(p4, "南投活動中心", 1, "【範例】既有建物補強施工"))],
  };

  const min = (await db.project.aggregate({ _min: { sortOrder: true } }))._min.sortOrder;
  const order = sortOrders(min, 4);
  const gallery = (ids: number[]) => ({ create: ids.map((mediaId, i) => ({ mediaId, sortOrder: i })) });

  await db.$transaction([
    db.project.create({
      data: {
        title: p1,
        slug: assertSlug("範例-台中西區集合住宅"), // 中文代稱
        category: "住宅",
        location: "臺中市西區",
        structure: "RC 造",
        scale: "地上 14 層、地下 3 層",
        client: "【範例】起造人",
        startDate: day("2025-03-01"),
        status: "IN_PROGRESS",
        summary: "【範例】都市住宅區的集合住宅新建工程，示範「施工中」、首頁精選、有封面與圖庫的工程實績版面。",
        description: [
          NOT_REAL_PROJECT,
          "開挖前完成鄰房現況調查與監測儀器佈設，開挖期間每日檢視監測數據，超過警戒值即暫停施工並會同設計單位檢討。",
          "標準層採系統模板循環施工，每層混凝土澆置前由品管人員逐項查驗鋼筋、模板與預埋管線。",
          "工區鄰近住宅與學校，施工車輛避開上下學時段進出，並在工地出入口設置洗車台與防塵設施。",
          "每日開工前召開工具箱會議，落實高處作業防墜與開口防護。",
        ].join("\n"),
        featured: true,
        published: true,
        sortOrder: order[0]!,
        coverImageId: images.p1Cover,
        images: gallery(images.p1Gallery),
      },
    }),
    db.project.create({
      data: {
        title: p2,
        slug: assertSlug("sample-changhua-factory"),
        category: "廠房",
        location: "彰化縣",
        structure: "鋼構造",
        scale: "地上 2 層",
        client: "【範例】業主",
        startDate: day("2024-02-01"),
        endDate: day("2025-06-30"),
        status: "COMPLETED",
        summary: "【範例】工業區內的鋼構廠房新建工程，示範「已完工」、首頁精選的工程實績版面。",
        description: [
          NOT_REAL_PROJECT,
          "鋼構吊裝前完成吊裝計畫審查，並檢討吊車站位的地盤承載力，吊裝作業區設置管制範圍。",
          "柱腳錨栓於基礎澆置前以定位板固定，澆置後複測位置與高程，確保鋼柱安裝精度。",
          "屋頂浪板與天溝施工完成後進行灑水測試，確認排水順暢、無滲漏。",
        ].join("\n"),
        featured: true,
        published: true,
        sortOrder: order[1]!,
        coverImageId: images.p2Cover,
        images: gallery(images.p2Gallery),
      },
    }),
    db.project.create({
      data: {
        title: p3,
        slug: assertSlug("範例-危老重建"), // 中文代稱
        category: "危老重建",
        location: "臺中市北區",
        structure: "RC 造",
        scale: "地上 7 層、地下 1 層",
        client: "【範例】起造人",
        status: "PLANNED",
        summary: "【範例】都市危險及老舊建築物重建，示範「規劃中」、只有封面沒有圖庫、沒有工期的工程實績版面。",
        description: [
          NOT_REAL_PROJECT,
          "拆除前完成既有建物結構安全評估與鄰房現況調查，並與原住戶確認拆除與施工期程。",
          "施工計畫分為拆除、基礎、結構體與裝修四個階段，各階段開工前召開協調會議。",
        ].join("\n"),
        featured: false,
        published: true,
        sortOrder: order[2]!,
        coverImageId: images.p3Cover,
      },
    }),
    db.project.create({
      data: {
        title: p4,
        slug: assertSlug("sample-nantou-community-center"),
        category: "公共工程",
        location: "南投縣",
        structure: "RC 造",
        scale: "地上 2 層",
        client: "【範例】機關名稱",
        startDate: day("2026-05-01"),
        status: "IN_PROGRESS",
        summary: "【範例】未上架的工程實績：後台看得到，前台列表與單案網址都不會出現。",
        description: [NOT_REAL_PROJECT, "既有建物耐震補強與屋頂防水更新，施工期間活動中心部分空間維持開放，以圍籬區隔動線。"].join("\n"),
        featured: false,
        published: false,
        sortOrder: order[3]!,
        coverImageId: images.p4Cover,
        images: gallery(images.p4Gallery),
      },
    }),
  ]);
}

async function seedNews(db: PrismaClient) {
  const cover = await createImage(db, {
    name: "消息封面-網站上線",
    purpose: "範例：最新消息封面",
    caption: "【範例】公司官方網站上線",
    alt: "【範例】公司官方網站上線（範例圖片）",
    width: 1600,
    height: 900,
  });
  const min = (await db.news.aggregate({ _min: { sortOrder: true } }))._min.sortOrder;
  const order = sortOrders(min, 4);
  await db.news.createMany({
    data: [
      {
        title: "【範例】公司官方網站上線",
        slug: assertSlug("sample-news-website"),
        summary: "【範例】官方網站上線，提供承攬業務、專業團隊與工程洽詢資訊（版面示意用的範例消息）。",
        content: [
          "（以下為版面示意用的範例文字，非真實公告）",
          "官方網站正式上線，網站上可以查看承攬業務範圍、專業團隊與營造業登記資格。",
          "建設公司、起造人或危老重建的地主，可以透過「工程洽詢」表單留下需求，我們會由專人回覆。",
          "協力廠商也可以透過網站登記，說明專業工種與服務區域。",
        ].join("\n"),
        publishedAt: day("2026-09-15"),
        coverImageId: cover,
        published: true,
        sortOrder: order[0]!,
      },
      {
        title: "【範例】工地安全衛生教育訓練",
        slug: assertSlug("範例-安全衛生教育訓練"),
        summary: "【範例】針對新進工地人員舉辦安全衛生教育訓練，內容包含墜落防止、感電預防與緊急應變（範例消息）。",
        content: [
          "（以下為版面示意用的範例文字，非真實活動紀錄）",
          "本次訓練以實際工地常見的危害為主題，說明施工架、開口與高處作業的防墜措施。",
          "課程最後進行緊急應變演練，確認每位人員熟悉通報流程與疏散路線。",
        ].join("\n"),
        publishedAt: day("2026-08-20"),
        published: true,
        sortOrder: order[1]!,
      },
      {
        title: "【範例】參加營建品質管理研習",
        slug: assertSlug("sample-news-quality-training"),
        summary: "【範例】工務與品管人員參加營建品質管理研習，交流施工查驗與缺失改善的做法（範例消息）。",
        content: [
          "（以下為版面示意用的範例文字，非真實活動紀錄）",
          "研習內容包含三級品管制度、施工自主檢查表的設計，以及常見缺失的改善案例。",
          "回到工地後，我們將研習重點整理成內部教材，納入每月品管會議討論。",
        ].join("\n"),
        publishedAt: day("2026-07-10"),
        published: true,
        sortOrder: order[2]!,
      },
      {
        title: "【範例】年度教育訓練計畫（草稿）",
        slug: assertSlug("sample-news-draft"),
        summary: "【範例】未上架的消息：後台看得到，前台不會顯示。",
        content: "（範例草稿）年度教育訓練計畫內容整理中，確認後再上架。",
        publishedAt: day("2026-10-01"),
        published: false,
        sortOrder: order[3]!,
      },
    ],
  });
}

async function seedJobs(db: PrismaClient) {
  const min = (await db.job.aggregate({ _min: { sortOrder: true } }))._min.sortOrder;
  const order = sortOrders(min, 3);
  await db.job.createMany({
    data: [
      {
        title: "【範例】工地主任",
        department: "工務部",
        location: "臺中市（依工地派駐）",
        employmentType: "全職",
        salary: "【範例】面議（依經歷與證照敘薪）",
        description: [
          "（以下為版面示意用的範例職缺）",
          "負責工地現場施工管理，包含進度、品質與安全衛生。",
          "協調各協力廠商施工順序，主持每日工具箱會議。",
          "填寫施工日誌，配合業主與監造單位查驗。",
        ].join("\n"),
        requirements: ["具營造業工地主任執業證", "三年以上建築工程現場管理經驗", "具職業安全衛生相關證照者佳"].join("\n"),
        benefits: ["勞保、健保、勞工退休金提撥", "工地派駐交通補助", "年度教育訓練"].join("\n"),
        published: true,
        sortOrder: order[0]!,
      },
      {
        title: "【範例】品管工程師",
        department: "品管部",
        location: "臺中市",
        employmentType: "全職",
        salary: "【範例】面議",
        description: [
          "（以下為版面示意用的範例職缺）",
          "執行施工品質查驗，整理自主檢查表與品管紀錄。",
          "追蹤缺失改善進度，每月彙整品管報告。",
        ].join("\n"),
        requirements: ["土木、建築相關科系畢業", "具公共工程品質管理訓練結業證書者佳"].join("\n"),
        benefits: ["勞保、健保、勞工退休金提撥", "年度教育訓練"].join("\n"),
        published: true,
        sortOrder: order[1]!,
      },
      {
        title: "【範例】工務助理",
        department: "工務部",
        location: "臺中市",
        employmentType: "全職",
        salary: "【範例】面議",
        description: ["（未上架的範例職缺：後台看得到，前台不會顯示）", "協助工務文件整理、請款資料彙整與會議紀錄。"].join("\n"),
        requirements: "熟悉文書處理軟體",
        published: false,
        sortOrder: order[2]!,
      },
    ],
  });
}

async function seedTeam(db: PrismaClient) {
  const portrait = (name: string, short: string) =>
    ({ name: `團隊照片-${short}`, purpose: "範例：團隊成員照片", caption: name, alt: `${name}（範例圖片）`, width: 800, height: 1000 }) as const;
  const members = [
    { name: "【範例】專任工程人員 A", short: "專任工程人員A" },
    { name: "【範例】工地主任 A", short: "工地主任A" },
    { name: "【範例】品管人員 A", short: "品管人員A" },
    { name: "【範例】工地主任 B", short: "工地主任B" },
  ];
  const photos: number[] = [];
  for (const member of members) photos.push(await createImage(db, portrait(member.name, member.short)));

  const min = (await db.teamMember.aggregate({ _min: { sortOrder: true } }))._min.sortOrder;
  const order = sortOrders(min, 4);
  await db.teamMember.createMany({
    data: [
      {
        name: members[0]!.name,
        title: "專任工程人員",
        licenses: ["【範例】土木工程技師", "【範例】職業安全衛生管理員"].join("\n"),
        bio: "【範例文字】負責工程施工技術把關，參與每一件工程的施工計畫審查與重要工項查驗。",
        experience: [
          "【範例】2012～2018 年任職於【範例】前任職營造公司，擔任工地工程師，參與集合住宅新建工程。",
          "【範例】2018～2024 年任職於【範例】前任職營造公司，擔任專案經理，負責廠房與辦公大樓施工管理。",
        ].join("\n"),
        photoId: photos[0],
        consentToPublish: true,
        consentDate: day("2026-09-01"),
        published: true,
        sortOrder: order[0]!,
      },
      {
        name: members[1]!.name,
        title: "工地主任",
        licenses: ["【範例】營造業工地主任執業證", "【範例】施工安全評估人員"].join("\n"),
        bio: "【範例文字】負責工地現場的進度、品質與安全管理，協調各協力廠商的施工順序。",
        experience: "【範例】2015～2024 年任職於【範例】前任職營造公司，擔任工地主任，負責住宅與公共工程現場管理。",
        photoId: photos[1],
        consentToPublish: true,
        consentDate: day("2026-09-01"),
        published: true,
        sortOrder: order[1]!,
      },
      {
        // 沒有填過往經歷：前台「核心人員經歷」只列有填的人
        name: members[2]!.name,
        title: "品管人員",
        licenses: "【範例】公共工程品質管理人員",
        bio: "【範例文字】負責施工品質查驗與品管紀錄，追蹤缺失改善到結案。",
        photoId: photos[2],
        consentToPublish: true,
        consentDate: day("2026-09-03"),
        published: true,
        sortOrder: order[2]!,
      },
      {
        // 尚未同意公開：不能上架，前台不會出現（儀表板會提醒）
        name: members[3]!.name,
        title: "工地主任",
        licenses: "【範例】營造業工地主任執業證",
        bio: "【範例文字】尚未取得本人同意公開：後台看得到，前台不會顯示。",
        experience: "【範例】2016～2025 年任職於【範例】前任職營造公司，擔任工地主任。",
        photoId: photos[3],
        consentToPublish: false,
        published: false,
        sortOrder: order[3]!,
      },
    ],
  });
}

async function seedCertifications(db: PrismaClient) {
  const certificates = [
    {
      name: "【範例】品質管理系統認證",
      short: "品質管理系統",
      issuedOn: "2025-01-15",
      expiresOn: "2028-01-14",
      note: "【範例】認證範圍：建築工程施工",
    },
    {
      name: "【範例】職業安全衛生管理系統認證",
      short: "職業安全衛生管理系統",
      issuedOn: "2024-07-01",
      expiresOn: "2027-06-30",
      note: "【範例】認證範圍：營造工程施工",
    },
    {
      name: "【範例】優良工程獎狀",
      short: "優良工程獎狀",
      issuedOn: "2025-11-20",
      expiresOn: null,
      note: "【範例】沒有有效期限：前台顯示「無期限」",
    },
    {
      name: "【範例】環境管理系統認證",
      short: "環境管理系統",
      issuedOn: "2022-01-01",
      expiresOn: "2025-12-31",
      note: "【範例】已過期：雖然是上架狀態，前台也不會顯示；後台儀表板會提醒",
    },
  ];
  const images: number[] = [];
  for (const cert of certificates) {
    images.push(
      await createImage(db, {
        name: `證照影本-${cert.short}`,
        purpose: "範例：證照影本",
        caption: cert.name,
        alt: `${cert.name}證書影本（範例圖片）`,
        width: 1200,
        height: 1600,
        style: "document",
      }),
    );
  }
  const min = (await db.certification.aggregate({ _min: { sortOrder: true } }))._min.sortOrder;
  const order = sortOrders(min, certificates.length);
  await db.certification.createMany({
    data: certificates.map((cert, i) => ({
      name: cert.name,
      issuer: "【範例】發證單位",
      certificateNumber: "【範例】",
      issuedOn: day(cert.issuedOn),
      expiresOn: cert.expiresOn ? day(cert.expiresOn) : null,
      note: cert.note,
      imageId: images[i],
      published: true,
      sortOrder: order[i]!,
    })),
  });
}

async function seedUnusedMedia(db: PrismaClient) {
  // 沒有被任何內容引用的圖片：媒體庫顯示「未使用」、可以直接刪除；順便示範 WebP、PNG 兩種格式
  await createImage(db, {
    name: "未使用的圖片-工地環境",
    purpose: "範例：未使用的圖片",
    caption: "媒體庫裡沒有被任何內容使用的圖片",
    alt: "【範例】工地環境（未被任何內容使用的範例圖片）",
    width: 1600,
    height: 900,
    format: "webp",
  });
  await createImage(db, {
    name: "未使用的圖片-材料堆置區",
    purpose: "範例：未使用的圖片",
    caption: "媒體庫裡沒有被任何內容使用的圖片",
    alt: "",
    width: 1200,
    height: 900,
    format: "png",
  });
}

async function seedInbox(db: PrismaClient) {
  await db.inquiry.createMany({
    data: [
      {
        name: "【範例】聯絡人 A",
        company: "【範例】建設股份有限公司",
        phone: "0000-000-001",
        email: "sample-a@example.com",
        projectType: "新建工程（集合住宅）",
        location: "臺中市北屯區",
        budget: "【範例】約 2 億元",
        message:
          "【範例】我們規劃在北屯區興建一棟地上 12 層的集合住宅，目前建照申請中，想了解貴公司的承攬意願與可以配合的開工時間，方便的話請與我們聯絡。",
        status: "NEW",
        createdAt: at("2026-10-05T10:24:00"),
      },
      {
        name: "【範例】聯絡人 B",
        phone: "0000-000-002",
        email: "sample-b@example.com",
        projectType: "危老重建",
        location: "臺中市南區",
        budget: "尚未評估",
        message: "【範例】家中老屋已通過危老重建評估，想請教從拆除到完工大概需要多久，以及營造廠在過程中會負責哪些部分。",
        status: "NEW",
        createdAt: at("2026-10-04T20:05:00"),
      },
      {
        name: "【範例】聯絡人 C",
        company: "【範例】精密工業股份有限公司",
        phone: "0000-000-003",
        email: "sample-c@example.com",
        projectType: "廠房新建",
        location: "彰化縣",
        budget: "【範例】約 8,000 萬元",
        message: "【範例】公司預計在工業區新建一棟鋼構廠房，希望明年第二季開工，想先約時間討論施工規劃與報價。",
        status: "IN_PROGRESS",
        adminNote: "【範例】10/2 已電話聯繫，約 10/9 現場勘查；需先準備鋼構廠房的類似經歷資料。",
        createdAt: at("2026-09-30T14:40:00"),
      },
      {
        name: "【範例】聯絡人 D",
        company: "【範例】物業管理顧問有限公司",
        phone: "0000-000-004",
        email: "sample-d@example.com",
        projectType: "整修工程",
        location: "臺中市西屯區",
        budget: "【範例】約 500 萬元",
        message: "【範例】社區大樓外牆磁磚有剝落情形，管委會想了解外牆整修的施工方式與工期。",
        status: "CLOSED",
        adminNote: "【範例】9/18 已提供報價；管委會決定延到明年編列預算，先結案，明年初再追蹤。",
        createdAt: at("2026-09-12T09:15:00"),
      },
    ],
  });
  await db.vendorApplication.createMany({
    data: [
      {
        companyName: "【範例】鋼筋工程行",
        taxId: "【範例】",
        contactName: "【範例】聯絡人 E",
        phone: "0000-000-005",
        email: "vendor-e@example.com",
        trade: "鋼筋加工與綁紮",
        serviceArea: "臺中市、彰化縣",
        message: "【範例】本行從事鋼筋加工與綁紮，有集合住宅與廠房的施工經驗，希望成為貴公司的協力廠商。",
        status: "NEW",
        createdAt: at("2026-10-03T11:30:00"),
      },
      {
        companyName: "【範例】水電工程有限公司",
        taxId: "【範例】",
        contactName: "【範例】聯絡人 F",
        phone: "0000-000-006",
        email: "vendor-f@example.com",
        trade: "水電、消防設備",
        serviceArea: "中部地區",
        message: "【範例】提供建築水電與消防設備施工，附上公司簡介與施工實績供參考。",
        status: "IN_PROGRESS",
        adminNote: "【範例】已收到公司簡介與施工實績，待工務部評估後回覆。",
        createdAt: at("2026-09-25T16:20:00"),
      },
    ],
  });
}

// ───────── 執行 ─────────

async function main() {
  console.log(`資料庫：${databaseLabel()}`);
  if (!isLocalDatabase() && process.env.SAMPLES_ALLOW_REMOTE !== "1") {
    throw new Error(
      "DATABASE_URL 不是本機資料庫。範例資料只該出現在開發／測試環境；確定要寫入這個資料庫，請在指令前加 SAMPLES_ALLOW_REMOTE=1",
    );
  }

  // 1. 先清掉舊的範例（含圖片），再全部重建
  printClearResult(await clearSamples(prisma));

  // 2. 建立；任何一步失敗就把這次建到一半的範例清掉，不留殘缺的資料
  try {
    await seedProjects(prisma);
    await seedNews(prisma);
    await seedJobs(prisma);
    await seedTeam(prisma);
    await seedCertifications(prisma);
    await seedUnusedMedia(prisma);
    await seedInbox(prisma);
  } catch (error) {
    console.error("建立範例資料失敗，正在清除這次建立到一半的範例…");
    await clearSamples(prisma).catch((cleanupError) => console.error("清除也失敗：", cleanupError));
    throw error;
  }

  const counts = await countSampleData(prisma);
  console.log(
    `・已建立範例資料：工程實績 ${counts.project}、最新消息 ${counts.news}、職缺 ${counts.job}、團隊成員 ${counts.teamMember}、` +
      `證照 ${counts.certification}、工程洽詢 ${counts.inquiry}、協力廠商登記 ${counts.vendorApplication}、圖片 ${counts.media} 張`,
  );
  console.log("・帳號與公司資料沒有變動。上線前請執行 npm run db:clear:samples 清除範例資料。");
  printCacheReminder();
}

main()
  .catch((error) => {
    console.error("範例資料建立失敗：", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
