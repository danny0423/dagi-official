// 待接 company_settings；沒有真實聯絡資料時，不產生假的 tel/mailto。
// 公司名稱、統一編號、地址、代表人、設立日期：使用者提供（2026-10-02，未經第三方核對）。
// name 是完整登記名稱，已含「營造」，引用時不要再接「營造」；頁首、title 等短稱用 shortName。
// 成立年份全站一律用西元（founded），完整設立日期見 foundedDate（民國113年3月14日）。
export const company = {
  name: "達吉營造有限公司",
  shortName: "達吉營造",
  grade: "【待填：甲／乙／丙級】",
  registeredCity: "【待填：登記縣市】",
  registrationAuthority: "【待填：登記機關】",
  capital: "【待填：實收資本額】",
  representative: "莊于萱",
  founded: "2024",
  foundedDate: "2024-03-14",
  engineers: "【待填：專任工程人員人數】",
  projects: "【待填：累計承攬件數，沒有就整列拿掉】",
  taxId: "93683009",
  license: "【待填：營造業登記證字號】",
  address: "臺中市西區五權路2之107號14樓",
  phone: "【待填：公司電話】",
  phoneHref: null as string | null,
  email: "【待填：公司 Email】",
  emailHref: null as string | null,
  fax: "【待填：公司傳真，沒有就拿掉】",
  serviceHours: "【待填：服務時間】",
  responseTime: "【待填：回覆時間，例：○ 個工作天】",
  groupUrl: "https://www.longpon.com.tw/",
} as const;
