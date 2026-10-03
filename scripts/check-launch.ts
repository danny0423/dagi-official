/**
 * 上線前檢查（docs/ux-review.md 第 2 項）：
 * 掃描 lib/launch.ts 中「已開放」的前台頁面，列出畫面上仍會出現待填、範例標記或暫用素材的位置。
 *
 * 用法：
 *   npm run check:launch                     只列出，不擋（exit 0）
 *   LAUNCH_STRICT=1 npm run check:launch     有任何一處就 exit 1
 *   npm run build                            會先自動執行（prebuild）；預設只印警告，
 *                                            正式部署時設 LAUNCH_STRICT=1，讓 build 在還有待填時失敗。
 *
 * 掃描範圍：已開放頁面的 page.tsx、所在的 layout，以及它們用 @/ 或相對路徑引用到的專案檔案（遞迴）。
 *   - lib/placeholder-company.ts 不整份掃描，只檢查實際被引用的 company.欄位 是否仍是待填值
 *   - 沒有傳 photo 的 <PhotoPlaceholder> 會畫出照片待填框，在使用處列出
 *   - {isLaunched("/路徑") && ...} 包住、而該路徑未開放的區塊不會顯示，略過
 *   - 純註解行、行尾標了 check-launch: ignore 的行略過
 * 限制：以檔案為單位判斷，元件內只在特定條件出現的字樣（例如只有協力廠商表單才有的欄位）也會列出，請人工判斷。
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { findSitePage, isLaunched, sitePages, type SitePage } from "../lib/launch";

type Finding = { file: string; line: number; column: number; kind: string; text: string };

const root = process.cwd();
const appDir = join(root, "app");
const siteDir = join(appDir, "(site)");
const companyFile = join(root, "lib", "placeholder-company.ts");
const strict = process.env.LAUNCH_STRICT === "1";

const rel = (file: string) => relative(root, file).split(sep).join("/");
const count = (text: string, char: string) => text.split(char).length - 1;

// ---- lib/placeholder-company.ts 的欄位值 ----
const companyFields = new Map<string, { line: number; value: string }>();
readFileSync(companyFile, "utf8").split("\n").forEach((text, index) => {
  const match = text.match(/^\s*(\w+):\s*(["'`])(.*)\2/);
  if (match) companyFields.set(match[1], { line: index + 1, value: match[3] });
});

const markerKind = (text: string) => (text.includes("【待填") ? "待填" : text.includes("【範例") ? "範例" : null);

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
const scanCache = new Map<string, Finding[]>();

function scanFile(file: string): Finding[] {
  if (file === companyFile) return []; // 只看被引用的欄位，在引用處列出
  const cached = scanCache.get(file);
  if (cached) return cached;

  const source = readFileSync(file, "utf8");
  const lines = source.split("\n");
  const findings: Finding[] = [];
  const skipped = new Set<number>(); // 行號（從 1 起算）
  let gateDepth = 0;
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

    for (const match of line.matchAll(/【(待填|範例)[^】]*】?/g)) {
      findings.push({ file, line: lineNo, column: match.index, kind: match[1], text: match[0] });
    }
    for (const match of line.matchAll(/\bcompany\.(\w+)/g)) {
      const field = companyFields.get(match[1]);
      const kind = field && markerKind(field.value);
      if (field && kind) findings.push({ file, line: lineNo, column: match.index, kind, text: `company.${match[1]} → ${field.value}` });
    }
    for (const match of line.matchAll(/["'`](\/images\/[^"'`]*temp[^"'`]*)["'`]/g)) {
      findings.push({ file, line: lineNo, column: match.index, kind: "暫用素材", text: match[1] });
    }
  });

  // 沒有傳 photo 的照片佔位（可能跨行，所以對整份檔案比對）
  for (const match of source.matchAll(/<PhotoPlaceholder\b([\s\S]*?)\/>/g)) {
    const lineNo = source.slice(0, match.index).split("\n").length;
    if (skipped.has(lineNo) || /\bphoto=/.test(match[1])) continue;
    const description = match[1].match(/description=(?:"([^"]*)"|\{`([^`]*)`\})/);
    findings.push({ file, line: lineNo, column: match.index, kind: "照片佔位", text: `沒有照片：${description?.[1] ?? description?.[2] ?? "（未寫 description）"}` });
  }

  findings.sort((a, b) => a.line - b.line || a.column - b.column);
  scanCache.set(file, findings);
  return findings;
}

const findingsOf = (files: Iterable<string>) => [...files].sort().flatMap(scanFile);

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

const groups: { title: string; findings: Finding[] }[] = [
  { title: "全站共用（頁首、頁尾等，每一頁都會出現）", findings: findingsOf(sharedFiles) },
  ...launched.map((page) => {
    const files = pagesByPath.get(page.path)!;
    const own = closure([...files, ...files.flatMap(layoutChain).filter((layout) => !sharedLayouts.includes(layout))]);
    return { title: `${page.name} ${page.path}`, findings: findingsOf([...own].filter((file) => !sharedFiles.has(file))) };
  }),
];

// ---- 輸出 ----
const unique = new Set(groups.flatMap(({ findings }) => findings.map((f) => `${f.file}:${f.line}:${f.column}`)));

console.log(`\n上線前檢查：lib/launch.ts 已開放 ${launched.length} 頁${strict ? "（LAUNCH_STRICT=1）" : ""}`);
for (const { title, findings } of groups) {
  console.log(`\n■ ${title}：${findings.length} 處`);
  for (const f of findings) console.log(`  ${rel(f.file)}:${f.line}  [${f.kind}] ${f.text}`);
}
if (setupIssues.length > 0) {
  console.log(`\n■ 上線開關設定問題：${setupIssues.length} 處`);
  for (const issue of setupIssues) console.log(`  ${issue}`);
}
console.log(`\n未開放、不檢查：${unlaunched.map((page) => `${page.name} ${page.path}`).join("、") || "（無）"}`);

const total = unique.size + setupIssues.length;
console.log(`合計 ${total} 處（同一個位置在多頁出現只算一次）。`);

if (total === 0) {
  console.log("已開放的頁面沒有待填字樣。\n");
} else if (strict) {
  console.error("[失敗] LAUNCH_STRICT=1：已開放的頁面還有待填內容，停止。補齊資料或在 lib/launch.ts 關閉該頁後再試。\n");
  process.exit(1);
} else {
  console.log("[警告] 目前只提示、不影響 build。正式部署請設 LAUNCH_STRICT=1，還有待填時會讓 build 失敗。\n");
}
