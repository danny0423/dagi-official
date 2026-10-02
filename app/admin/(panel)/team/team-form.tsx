import { AdminForm, CheckboxField, TextAreaField, TextField, type FormAction } from "@/app/admin/_components/form";
import { ImagePicker } from "@/app/admin/_components/image-picker";
import { formatDate } from "@/lib/admin/format";
import type { MediaDTO } from "@/lib/media-types";

export type TeamFormValues = {
  name: string;
  title: string | null;
  licenses: string | null;
  bio: string | null;
  experience: string | null;
  consentToPublish: boolean;
  consentDate: Date | null;
  published: boolean;
  photo: MediaDTO | null;
};

export function TeamForm({ action, initial, submitLabel }: { action: FormAction; initial?: TeamFormValues; submitLabel: string }) {
  return (
    <AdminForm action={action} submitLabel={submitLabel}>
      <div className="adm-form-grid">
        <TextField label="姓名" name="name" defaultValue={initial?.name} required maxLength={100} />
        <TextField label="職稱" name="title" defaultValue={initial?.title} maxLength={100} />
        <TextAreaField label="證照" name="licenses" defaultValue={initial?.licenses} rows={3} maxLength={2000} hint="一行一張" wide />
        <TextAreaField label="簡介" name="bio" defaultValue={initial?.bio} rows={4} maxLength={5000} wide />
        <TextAreaField
          label="過往經歷"
          name="experience"
          defaultValue={initial?.experience}
          rows={6}
          maxLength={10000}
          hint="個人在其他公司參與的工程，請註明「非本公司承攬」"
          wide
        />
        <ImagePicker name="photoId" label="照片" initial={initial?.photo ?? null} />
        <CheckboxField
          label="已取得當事人同意公開"
          name="consentToPublish"
          defaultChecked={initial?.consentToPublish}
          hint="沒有勾選的人不會出現在前台，也不能上架"
        />
        <TextField label="同意書簽署日期" name="consentDate" type="date" defaultValue={formatDate(initial?.consentDate)} />
        <CheckboxField label="上架（前台顯示）" name="published" defaultChecked={initial?.published} hint="需先勾選「已取得當事人同意公開」" />
      </div>
    </AdminForm>
  );
}
