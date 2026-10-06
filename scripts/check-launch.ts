/**
 * 上線前檢查（docs/ux-review.md 第 2 項）：
 * 掃描 lib/launch.ts 中「已開放」的前台頁面，列出畫面上仍會出現待填、範例標記或暫用素材的位置。
 * 公司資料與內容以資料庫為準：連得到資料庫時，依 company_settings 實際值與已上架的內容判斷。
 *
 * 用法：
 *   npm run check:launch                     只列出，不擋（exit 0）
 *   LAUNCH_STRICT=1 npm run check:launch     有任何一處就 exit 1
 *   npm run build                            會先自動執行（prebuild）；預設只印警告，
 *                                            正式部署時設 LAUNCH_STRICT=1，讓 build 在還有待填時失敗。
 *
 * 掃描範圍：已開放頁面的 page.tsx、所在的 layout，以及它們用 @/ 或相對路徑引用到的專案檔案（遞迴）。
 *   - company.欄位（lib/site-data 的公司資料）：查資料庫的 company_settings，欄位空白、畫面會顯示【待填】時才列出
 *   - 範例區塊（資料庫沒有資料時才顯示）：
 *       行內寫 {條件 && ( // check-launch: fallback <種類> 到對應的右大括號為止；
 *       整個檔案都是範例時，檔案內寫 check-launch: fallback-file <種類>。
 *       種類＝lib/site-data/launch-check.ts 的 contentFallbacks（team、certifications、projects…），
 *       資料庫已有符合條件的資料時略過，沒有時照常列出
 *   - 連不到資料庫時（例如 Docker build 階段）：上面兩類印在「未檢查」區，不計入合計，LAUNCH_STRICT=1 也不會因此失敗。
 *     正式環境請看後台儀表板的「上線前檢查」（一定連得到資料庫，是權威的檢查結果）
 *   - 沒有傳 photo 的 <PhotoPlaceholder> 會畫出照片待填框，在使用處列出
 *   - {isLaunched("/路徑") && ...} 包住、而該路徑未開放的區塊不會顯示，略過
 *   - 純註解行、行尾標了 check-launch: ignore 的行略過；檔案內寫 check-launch: skip-file 的整個檔案略過（仍會追它的 import）
 *   - 另外比對 lib/site-data/launch-check.ts 的 companyColumnsByPage（後台儀表板用）與程式碼實際用到的欄位，不一致時列為設定問題
 * 限制：以檔案為單位判斷，元件內只在特定條件出現的字樣（例如只有協力廠商表單才有的欄位）也會列出，請人工判斷。
 */
import "dotenv/config";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import { todayInTaipei } from "../lib/admin/format";
import { findSitePage, isLaunched, sitePages, type SitePage } from "../lib/launch";
import { companyColumns, type CompanyColumn } from "../lib/placeholder-company";
import { companyFieldColumn, isBlank, showsPlaceholder, type CompanyRow, type SiteCompanyField } from "../lib/site-data/company";
import { companyColumnsByPage, contentFallbacks, SHARED, type UsageKey } from "../lib/site-data/launch-check";
import { countPublicContent, fetchCompanyRow, type PublicContentCounts } from "../lib/site-data/queries";

type Finding = { file: string; line: number; column: number; kind: string; text: string; fallback?: string };
type CompanyRef = { file: string; line: number; column: number; field: SiteCompanyField; fallback?: string };
type Scan = { findings: Finding[]; refs: CompanyRef[] };

const root = process.cwd();
const appDir = join(root, "app");
const siteDir = join(appDir, "(site)");
const strict = process.env.LAUNCH_STRICT === "1";

const rel = (file: string) => relative(root, file).split(sep).join("/");
const count = (text: string, char: string) => text.split(char).length - 1;
const fallbackKinds = new Set<string>(contentFallbacks.map((item) => item.kind));

function isCompanyField(name: string): name is SiteCompanyField {
  return Object.hasOwn(companyFieldColumn, name);
}

// ---- 前台 page.tsx 與網址 ----
function listPageFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return listPageFiles(full);
    return name === "page.tsx" ? [full] : [];
  });
}

function routeOf(pageFile: string): string {
  const segments = relative(appDir, dirname(pageFile)).split(sep).filter((segment) => segment && !/^\(.*\)$/.test(segment));
  return `/${segments.join("/")}`;
}

/** 從 app/ 到頁面所在資料夾，沿路的 layout.tsx。 */
function layoutChain(pageFile: string): string[] {
  const layouts: string[] = [];
  let dir = appDir;
  for (const segment of ["", ...relative(appDir, dirname(pageFile)).split(sep).filter(Boolean)]) {
    dir = segment ? join(dir, segment) : dir;
    const layout = join(dir, "layout.tsx");
    if (existsSync(layout)) layouts.push(layout);
  }
  return layouts;
}

// ---- 追蹤 import ----
const importPattern = /(?:import|export)\s[^'"`;]*?from\s*["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)|import\s+["']([^"']+)["']/g;

function resolveImport(spec: string, fromFile: string): string | null {
  let base: string;
  if (spec.startsWith("@/")) base = join(root, spec.slice(2));
  else if (spec.startsWith(".")) base = resolve(dirname(fromFile), spec);
  else return null; // 套件不掃
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, join(base, "index.ts"), join(base, "index.tsx")]) {
    if (/\.(tsx?|m?js)$/.test(candidate) && existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

function closure(entries: string[]): Set<string> {
  const seen = new Set<string>();
  const queue = [...entries];
  while (queue.length > 0) {
    const file = queue.pop()!;
    if (seen.has(file)) continue;
    seen.add(file);
    for (const match of readFileSync(file, "utf8").matchAll(importPattern)) {
      const target = resolveImport(match[1] ?? match[2] ?? match[3], file);
      if (target && !seen.has(target)) queue.push(target);
    }
  }
  return seen;
}

// ---- 掃描單一檔案 ----
const scanCache = new Map<string, Scan>();
const markerIssues = new Set<string>();

function fallbackMarker(text: string, pattern: RegExp, file: string, lineNo: number): string | undefined {
  const kind = text.match(pattern)?.[1];
  if (kind && !fallbackKinds.has(kind)) {
    markerIssues.add(`${rel(file)}:${lineNo} 的範例標記種類「${kind}」不在 lib/site-data/launch-check.ts 的 contentFallbacks 裡`);
  }
  return kind;
}

function scanFile(file: string): Scan {
  const cached = scanCache.get(file);
  if (cached) return cached;

  const source = readFileSync(file, "utf8");
  const scan: Scan = { findings: [], refs: [] };
  scanCache.set(file, scan);
  if (source.includes("check-launch: skip-file")) return scan;

  const lines = source.split("\n");
  const fileFallback = fallbackMarker(source, /check-launch: fallback-file (\w+)/, file, 1);
  const skipped = new Set<number>(); // 行號（從 1 起算）
  const fallbackLines = new Map<number, string>();
  let gateDepth = 0;
  let fallbackDepth = 0;
  let fallbackKind: string | undefined;
  let inBlockComment = false;

  lines.forEach((rawLine, index) => {
    const lineNo = index + 1;
    const trimmed = rawLine.trim();

    // 未開放頁面的區塊：{isLaunched("/projects") && ...} 到對應的右大括號為止
    if (gateDepth > 0) {
      gateDepth += count(rawLine, "{") - count(rawLine, "}");
      skipped.add(lineNo);
      if (gateDepth <= 0) gateDepth = 0;
      return;
    }
    // 註解
    if (inBlockComment) {
      skipped.add(lineNo);
      if (rawLine.includes("*/")) inBlockComment = false;
      return;
    }
    if (/^(\/\/|\*|\/\*|\{\/\*)/.test(trimmed)) {
      skipped.add(lineNo);
      if ((trimmed.startsWith("/*") || trimmed.startsWith("{/*")) && !trimmed.includes("*/")) inBlockComment = true;
      return;
    }
    if (rawLine.includes("check-launch: ignore")) {
      skipped.add(lineNo);
      return;
    }

    let line = rawLine;
    const gate = line.match(/\{\s*isLaunched\(\s*["'`]([^"'`]+)["'`]\s*\)\s*&&/);
    if (gate && gate.index !== undefined && !isLaunched(gate[1])) {
      const rest = line.slice(gate.index);
      const depth = count(rest, "{") - count(rest, "}");
      if (depth > 0) gateDepth = depth;
      line = line.slice(0, gate.index);
    }

    // 範例區塊：{條件 && ( // check-launch: fallback <種類> 到對應的右大括號為止
    let lineFallback = fallbackDepth > 0 ? fallbackKind : undefined;
    if (fallbackDepth > 0) {
      fallbackDepth += count(rawLine, "{") - count(rawLine, "}");
      if (fallbackDepth <= 0) fallbackDepth = 0;
    } else {
      const marker = fallbackMarker(rawLine, /check-launch: fallback (\w+)/, file, lineNo);
      if (marker) {
        const code = rawLine.slice(0, rawLine.indexOf("//"));
        const depth = count(code, "{") - count(code, "}");
        if (depth > 0) {
          fallbackDepth = depth;
          fallbackKind = marker;
        }
        lineFallback = marker;
      }
    }
    const fallback = lineFallback ?? fileFallback;
    if (fallback) fallbackLines.set(lineNo, fallback);

    for (const match of line.matchAll(/【(待填|範例)[^】]*】?/g)) {
      scan.findings.push({ file, line: lineNo, column: match.index, kind: match[1], text: match[0], fallback });
    }
    for (const match of line.matchAll(/\bcompany\.(\w+)/g)) {
      if (isCompanyField(match[1])) scan.refs.push({ file, line: lineNo, column: match.index, field: match[1], fallback });
    }
    for (const match of line.matchAll(/["'`](\/images\/[^"'`]*temp[^"'`]*)["'`]/g)) {
      scan.findings.push({ file, line: lineNo, column: match.index, kind: "暫用素材", text: match[1], fallback });
    }
  });

  // 沒有傳 photo 的照片佔位（可能跨行，所以對整份檔案比對）
  for (const match of source.matchAll(/<PhotoPlaceholder\b([\s\S]*?)\/>/g)) {
    const lineNo = source.slice(0, match.index).split("\n").length;
    if (skipped.has(lineNo) || /\bphoto=/.test(match[1])) continue;
    const description = match[1].match(/description=(?:"([^"]*)"|\{`([^`]*)`\})/);
    scan.findings.push({
      file, line: lineNo, column: match.index, kind: "照片佔位",
      text: `沒有照片：${description?.[1] ?? description?.[2] ?? "（未寫 description）"}`,
      fallback: fallbackLines.get(lineNo) ?? fileFallback,
    });
  }

  scan.findings.sort((a, b) => a.line - b.line || a.column - b.column);
  return scan;
}

const scanOf = (files: Iterable<string>): Scan => {
  const scans = [...files].sort().map(scanFile);
  return { findings: scans.flatMap((s) => s.findings), refs: scans.flatMap((s) => s.refs) };
};

// ---- 依頁面分組 ----
const pageFiles = listPageFiles(siteDir).sort();
const setupIssues: string[] = [];
const pagesByPath = new Map<string, string[]>();

for (const pageFile of pageFiles) {
  const route = routeOf(pageFile);
  const page = findSitePage(route);
  if (!page) {
    setupIssues.push(`${rel(pageFile)}（${route}）沒有登記在 lib/launch.ts，不受上線開關控制`);
    continue;
  }
  if (!readFileSync(pageFile, "utf8").includes("requireLaunched(")) {
    setupIssues.push(`${rel(pageFile)} 沒有呼叫 requireLaunched()，頁面未開放時正式環境不會回 404`);
  }
  pagesByPath.set(page.path, [...(pagesByPath.get(page.path) ?? []), pageFile]);
}

const launched: SitePage[] = sitePages.filter((page) => page.launched && pagesByPath.has(page.path));
const unlaunched: SitePage[] = sitePages.filter((page) => !page.launched);

// 每個已開放頁面都會經過的 layout＝全站共用
const chains = launched.map((page) => pagesByPath.get(page.path)!.flatMap(layoutChain));
const sharedLayouts = chains.length > 0 ? chains[0].filter((layout) => chains.every((chain) => chain.includes(layout))) : [];
const sharedFiles = closure(sharedLayouts);

/** 這一頁自己的檔案（不含全站共用的部分） */
function ownFiles(path: string): string[] {
  const files = pagesByPath.get(path)!;
  const own = closure([...files, ...files.flatMap(layoutChain).filter((layout) => !sharedLayouts.includes(layout))]);
  return [...own].filter((file) => !sharedFiles.has(file));
}

const groups: { title: string; scan: Scan }[] = [
  { title: "全站共用（頁首、頁尾等，每一頁都會出現）", scan: scanOf(sharedFiles) },
  ...launched.map((page) => ({ title: `${page.name} ${page.path}`, scan: scanOf(ownFiles(page.path)) })),
];

// ---- 後台儀表板用的欄位對照表（companyColumnsByPage）是否跟程式碼一致 ----
function placeholderColumnsOf(refs: CompanyRef[]): CompanyColumn[] {
  const columns = new Set(refs.filter((ref) => showsPlaceholder(ref.field)).map((ref) => companyFieldColumn[ref.field]));
  return (Object.keys(companyColumns) as CompanyColumn[]).filter((column) => columns.has(column));
}

const usageScans: [UsageKey, Scan][] = [
  [SHARED, scanOf(sharedFiles)],
  ...[...pagesByPath.keys()].map((path) => [path as UsageKey, scanOf(ownFiles(path))] as [UsageKey, Scan]),
];
for (const [key, scan] of usageScans) {
  const actual = placeholderColumnsOf(scan.refs);
  const declared: readonly string[] = companyColumnsByPage[key] ?? [];
  const missing = actual.filter((column) => !declared.includes(column));
  const extra = declared.filter((column) => !actual.includes(column as CompanyColumn));
  if (missing.length > 0 || extra.length > 0) {
    setupIssues.push(
      `lib/site-data/launch-check.ts 的 companyColumnsByPage["${key}"] 跟程式碼不一致（後台儀表板的上線前檢查會不準），` +
        `請改成 ${JSON.stringify(actual)}`,
    );
  }
}
setupIssues.push(...markerIssues);

// ---- 資料庫 ----
type DbState = { ok: true; row: CompanyRow | null; counts: PublicContentCounts } | { ok: false; reason: string };

async function loadDatabase(): Promise<DbState> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return { ok: false, reason: "沒有設定 DATABASE_URL" };
  // 連不到時不要卡住 build：連線 5 秒、整體 10 秒逾時
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString, connectionTimeoutMillis: 5000 }) });
  let timer: NodeJS.Timeout | undefined;
  try {
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error("查詢逾時（10 秒）")), 10_000);
    });
    const [row, counts] = await Promise.race([
      Promise.all([fetchCompanyRow(db), countPublicContent(todayInTaipei(), db)]),
      timeout,
    ]);
    return { ok: true, row, counts };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, reason: message.split("\n").map((line) => line.trim()).filter(Boolean).at(-1) ?? "未知錯誤" };
  } finally {
    clearTimeout(timer);
    await db.$disconnect().catch(() => {});
  }
}

// ---- 輸出 ----
async function main() {
  const db = await loadDatabase();
  const unchecked: Finding[] = [];

  /** 依資料庫判斷：公司欄位 → 待填 finding；範例區塊 → 資料庫有資料就略過 */
  function resolveGroup(scan: Scan): Finding[] {
    const result: Finding[] = [];
    for (const finding of scan.findings) {
      if (!finding.fallback) result.push(finding);
      else if (!db.ok) unchecked.push(finding);
      else if (db.counts[finding.fallback as keyof PublicContentCounts] === 0) {
        result.push({ ...finding, text: `${finding.text}（資料庫沒有資料時顯示的範例）` });
      }
    }
    for (const ref of scan.refs) {
      if (!showsPlaceholder(ref.field)) continue;
      const column = companyFieldColumn[ref.field];
      const info = companyColumns[column];
      const finding: Finding = {
        file: ref.file, line: ref.line, column: ref.column, kind: "待填",
        text: `company.${ref.field} → 公司資料「${info.label}」空白，畫面顯示 ${info.placeholder}`,
      };
      if (!db.ok) unchecked.push(finding);
      else if (ref.fallback && db.counts[ref.fallback as keyof PublicContentCounts] > 0) continue;
      else if (isBlank(db.row, column)) result.push(finding);
    }
    return result.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.column - b.column);
  }

  const resolved = groups.map(({ title, scan }) => ({ title, findings: resolveGroup(scan) }));
  const unique = new Set(resolved.flatMap(({ findings }) => findings.map((f) => `${f.file}:${f.line}:${f.column}`)));

  console.log(`\n上線前檢查：lib/launch.ts 已開放 ${launched.length} 頁${strict ? "（LAUNCH_STRICT=1）" : ""}`);
  if (db.ok) {
    console.log("資料庫：已連線，公司資料依 company_settings 實際值判斷，範例區塊依已上架的內容判斷。");
  } else {
    console.log(`[警告] 未檢查資料庫欄位：連不到資料庫（${db.reason}）。`);
    console.log("       公司資料欄位與範例區塊列在最後的「未檢查」區，不計入合計；正式環境請看後台儀表板的「上線前檢查」。");
  }
  for (const { title, findings } of resolved) {
    console.log(`\n■ ${title}：${findings.length} 處`);
    for (const f of findings) console.log(`  ${rel(f.file)}:${f.line}  [${f.kind}] ${f.text}`);
  }
  if (setupIssues.length > 0) {
    console.log(`\n■ 上線開關設定問題：${setupIssues.length} 處`);
    for (const issue of setupIssues) console.log(`  ${issue}`);
  }
  if (!db.ok) {
    const seen = new Set<string>();
    const list = unchecked
      .filter((f) => {
        const key = `${f.file}:${f.line}:${f.column}`;
        return seen.has(key) ? false : (seen.add(key), true);
      })
      .sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.column - b.column);
    console.log(`\n■ 未檢查（要連得到資料庫才能判斷，不計入合計）：${list.length} 處`);
    for (const f of list) {
      const note = f.fallback ? `（範例區塊：資料庫有${contentFallbacks.find((item) => item.kind === f.fallback)?.condition ?? f.fallback}時不顯示）` : "";
      console.log(`  ${rel(f.file)}:${f.line}  [${f.kind}] ${f.text}${note}`);
    }
  }
  console.log(`\n未開放、不檢查：${unlaunched.map((page) => `${page.name} ${page.path}`).join("、") || "（無）"}`);

  const total = unique.size + setupIssues.length;
  console.log(`合計 ${total} 處（同一個位置在多頁出現只算一次）。`);

  if (total === 0) {
    console.log(db.ok ? "已開放的頁面沒有待填字樣。\n" : "已開放的頁面沒有待填字樣（資料庫部分未檢查）。\n");
  } else if (strict) {
    console.error("[失敗] LAUNCH_STRICT=1：已開放的頁面還有待填內容，停止。補齊資料或在 lib/launch.ts 關閉該頁後再試。\n");
    process.exit(1);
  } else {
    console.log("[警告] 目前只提示、不影響 build。正式部署請設 LAUNCH_STRICT=1，還有待填時會讓 build 失敗。\n");
  }
}

main().catch((error) => {
  console.error("[錯誤] 上線前檢查執行失敗：", error);
  process.exit(1);
});
