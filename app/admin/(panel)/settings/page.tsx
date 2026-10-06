import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/admin/guard";
import { formatDate, formatDateTime } from "@/lib/admin/format";
import { updateCompanySettings } from "@/app/admin/_actions/settings";
import { AdminForm, TextAreaField, TextField } from "@/app/admin/_components/form";
import { PageHeader } from "@/app/admin/_components/page-parts";

export const metadata: Metadata = { title: "公司資料" };

// 公司資料（F6）：前台全站（頁首、頁尾、登記資格、聯絡我們、各頁 metadata、JSON-LD）都從這裡讀（lib/site-data）。只有 ADMIN 能改。
// 欄位空白時前台顯示【待填：…】（對照見 lib/placeholder-company.ts）；儲存後前台快取立即失效（app/admin/_actions/settings.ts）。
export default async function SettingsPage() {
  await requireRole("ADMIN");
  const settings = await prisma.companySettings.findUnique({ where: { id: 1 } });

  return (
    <div className="adm-page">
      <PageHeader
        title="公司資料"
        description={
          settings
            ? `最後更新：${formatDateTime(settings.updatedAt)}。登記證字號、統編等可公開查證的資料，請照官方文件填寫。`
            : "尚未建立公司資料，儲存後即建立。"
        }
      />
      <div className="adm-card">
        <AdminForm action={updateCompanySettings} submitLabel="儲存公司資料">
          <fieldset className="adm-fieldset">
            <legend>基本資料</legend>
            <div className="adm-form-grid">
              <TextField label="公司名稱" name="name" defaultValue={settings?.name} required maxLength={100} />
              <TextField label="英文名稱" name="englishName" defaultValue={settings?.englishName} maxLength={200} />
              <TextField label="統一編號" name="taxId" defaultValue={settings?.taxId} maxLength={8} inputMode="numeric" />
              <TextField label="代表人" name="representative" defaultValue={settings?.representative} maxLength={50} />
              <TextField label="設立日期" name="foundedOn" type="date" defaultValue={formatDate(settings?.foundedOn)} />
              <TextField label="實收資本額" name="capital" defaultValue={settings?.capital} maxLength={100} hint="例：新臺幣 ○ 萬元" />
            </div>
          </fieldset>
          <fieldset className="adm-fieldset">
            <legend>營造業登記</legend>
            <div className="adm-form-grid">
              <TextField label="營造業等級" name="contractorGrade" defaultValue={settings?.contractorGrade} maxLength={20} hint="例：甲等、乙等、丙等" />
              <TextField label="營造業登記證字號" name="licenseNumber" defaultValue={settings?.licenseNumber} maxLength={100} />
              <TextField label="登記縣市" name="registeredCity" defaultValue={settings?.registeredCity} maxLength={20} />
              <TextField label="登記機關" name="registrationAuthority" defaultValue={settings?.registrationAuthority} maxLength={100} />
              <TextField
                label="專任工程人員人數"
                name="engineerCount"
                type="number"
                inputMode="numeric"
                defaultValue={settings?.engineerCount}
              />
            </div>
          </fieldset>
          <fieldset className="adm-fieldset">
            <legend>聯絡資訊</legend>
            <div className="adm-form-grid">
              <TextField label="地址" name="address" defaultValue={settings?.address} maxLength={200} wide />
              <TextField label="電話" name="phone" type="tel" defaultValue={settings?.phone} maxLength={50} />
              <TextField label="傳真" name="fax" type="tel" defaultValue={settings?.fax} maxLength={50} />
              <TextField label="Email" name="email" type="email" defaultValue={settings?.email} maxLength={254} />
              <TextField label="服務時間" name="serviceHours" defaultValue={settings?.serviceHours} maxLength={100} />
              <TextField label="洽詢回覆時間" name="responseTime" defaultValue={settings?.responseTime} maxLength={100} hint="例：○ 個工作天內" />
            </div>
          </fieldset>
          <fieldset className="adm-fieldset">
            <legend>其他</legend>
            <div className="adm-form-grid">
              <TextField label="集團（隆磐建設）官網" name="groupUrl" type="url" defaultValue={settings?.groupUrl} maxLength={500} wide />
              <TextAreaField
                label="一句話介紹"
                name="description"
                defaultValue={settings?.description}
                rows={2}
                maxLength={300}
                hint="搜尋結果的網站描述"
                wide
              />
            </div>
          </fieldset>
        </AdminForm>
      </div>
    </div>
  );
}
