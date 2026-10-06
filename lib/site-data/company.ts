import { companyColumns, DEFAULT_COMPANY_NAME, DEFAULT_GROUP_URL, type CompanyColumn } from "@/lib/placeholder-company";

// 公司資料：資料庫值 → 前台顯示值（純函式，client／server 與 scripts/ 都能用，不能加 "server-only"）。

/** 從資料庫讀出來、可以 JSON 序列化的公司資料（日期已轉成 YYYY-MM-DD，因為快取會 JSON 序列化）。 */
export type CompanyRow = {
  name: string;
  englishName: string | null;
  taxId: string | null;
  representative: string | null;
  foundedOn: string | null;
  contractorGrade: string | null;
  licenseNumber: string | null;
  registeredCity: string | null;
  registrationAuthority: string | null;
  capital: string | null;
  engineerCount: number | null;
  address: string | null;
  phone: string | null;
  fax: string | null;
  email: string | null;
  serviceHours: string | null;
  responseTime: string | null;
  groupUrl: string | null;
  description: string | null;
};

/**
 * 前台用的公司資料。空白欄位已換成【待填：…】（見 lib/placeholder-company.ts），畫面直接用 <PlaceholderText> 顯示即可。
 * 鍵名沿用改讀資料庫前的 company.xxx，scripts/check-launch.ts 依 companyFieldColumn 找出對應的資料庫欄位。
 */
export type SiteCompany = {
  /** 完整登記名稱（已含「營造」，不要再接「營造」） */
  name: string;
  /** 短稱（頁首、title 用）：去掉「股份有限公司／有限公司」 */
  shortName: string;
  grade: string;
  registeredCity: string;
  registrationAuthority: string;
  capital: string;
  representative: string;
  /** 成立年份（西元，全站一律用這個） */
  founded: string;
  /** 設立日期 YYYY-MM-DD；空白時是 null（只給 JSON-LD 用，不顯示待填） */
  foundedDate: string | null;
  engineers: string;
  taxId: string;
  license: string;
  address: string;
  phone: string;
  /** 有電話才有 tel: 連結；沒有真實電話時不產生假連結 */
  phoneHref: string | null;
  email: string;
  /** 有 Email 才有 mailto: 連結 */
  emailHref: string | null;
  fax: string;
  serviceHours: string;
  responseTime: string;
  groupUrl: string;
  englishName: string | null;
  /** 一句話介紹（SEO description）；空白時各頁用自己的預設描述 */
  description: string | null;
};

/** 前台顯示鍵 → 資料庫欄位（上線檢查、後台儀表板用來對應「哪個欄位空白」）。 */
export const companyFieldColumn = {
  name: "name",
  shortName: "name",
  grade: "contractorGrade",
  registeredCity: "registeredCity",
  registrationAuthority: "registrationAuthority",
  capital: "capital",
  representative: "representative",
  founded: "foundedOn",
  foundedDate: "foundedOn",
  engineers: "engineerCount",
  taxId: "taxId",
  license: "licenseNumber",
  address: "address",
  phone: "phone",
  phoneHref: "phone",
  email: "email",
  emailHref: "email",
  fax: "fax",
  serviceHours: "serviceHours",
  responseTime: "responseTime",
  groupUrl: "groupUrl",
  englishName: "englishName",
  description: "description",
} as const satisfies Record<keyof SiteCompany, CompanyColumn>;

export type SiteCompanyField = keyof typeof companyFieldColumn;

/** 這個顯示鍵在欄位空白時會不會顯示【待填】（foundedDate、phoneHref 這類空白時是 null，不算）。 */
export function showsPlaceholder(field: SiteCompanyField): boolean {
  return !["foundedDate", "phoneHref", "emailHref"].includes(field) && companyColumns[companyFieldColumn[field]].placeholder !== null;
}

function clean(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/** 欄位是否空白（空字串、只有空白都算空白）。 */
export function isBlank(row: CompanyRow | null, column: CompanyColumn): boolean {
  if (!row) return true;
  const value = row[column];
  return typeof value === "number" ? false : clean(value) === null;
}

function text(row: CompanyRow | null, column: Exclude<CompanyColumn, "engineerCount">): string {
  const info = companyColumns[column];
  return clean(row?.[column]) ?? info.defaultValue ?? info.placeholder ?? "";
}

/** 「達吉營造有限公司」→「達吉營造」 */
export function shortNameOf(name: string): string {
  return name.replace(/(股份有限公司|有限公司)$/u, "").trim() || name;
}

/**
 * 電話 → tel: 連結，只取第一支號碼：先把全形數字、符號轉半形，再取第一段「數字開頭（可帶 +），只含數字、空白、-、括號、點」的字，
 * 遇到分機（「分機」「轉」「#」「ext」）、頓號、斜線、「或」等其他字就停（後台欄位常填「04-2222-3333、0912-345-678」）。
 * 數字少於 6 碼不是電話；超過 15 碼（E.164 上限）通常是好幾支號碼只用空白隔開，寧可不產生連結，避免撥錯。
 * 例：「(04) 2222-3333 分機 12」→ tel:0422223333、「+886-4-2222-3333」→ tel:+886422223333、「04-2222-3333、0912-345-678」→ tel:0422223333
 */
export function telHref(phone: string | null): string | null {
  const first = clean(phone)?.normalize("NFKC").match(/\+?\d[\d\s\-().]*/)?.[0] ?? "";
  const digits = first.replace(/\D/g, "");
  if (digits.length < 6 || digits.length > 15) return null;
  return `tel:${first.startsWith("+") ? "+" : ""}${digits}`;
}

export function toSiteCompany(row: CompanyRow | null): SiteCompany {
  const name = clean(row?.name) ?? DEFAULT_COMPANY_NAME;
  const foundedDate = clean(row?.foundedOn);
  const phone = clean(row?.phone);
  const email = clean(row?.email);
  return {
    name,
    shortName: shortNameOf(name),
    grade: text(row, "contractorGrade"),
    registeredCity: text(row, "registeredCity"),
    registrationAuthority: text(row, "registrationAuthority"),
    capital: text(row, "capital"),
    representative: text(row, "representative"),
    founded: foundedDate ? foundedDate.slice(0, 4) : companyColumns.foundedOn.placeholder,
    foundedDate,
    engineers: row?.engineerCount != null ? String(row.engineerCount) : companyColumns.engineerCount.placeholder,
    taxId: text(row, "taxId"),
    license: text(row, "licenseNumber"),
    address: text(row, "address"),
    phone: text(row, "phone"),
    phoneHref: telHref(phone),
    email: text(row, "email"),
    emailHref: email ? `mailto:${email}` : null,
    fax: text(row, "fax"),
    serviceHours: text(row, "serviceHours"),
    responseTime: text(row, "responseTime"),
    groupUrl: clean(row?.groupUrl) ?? DEFAULT_GROUP_URL,
    englishName: clean(row?.englishName),
    description: clean(row?.description),
  };
}
