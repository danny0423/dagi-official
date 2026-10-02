import { AdminForm, CheckboxField, TextAreaField, TextField, type FormAction } from "@/app/admin/_components/form";
import { ImagePicker } from "@/app/admin/_components/image-picker";
import { formatDate } from "@/lib/admin/format";
import type { MediaDTO } from "@/lib/media-types";

export type CertificationFormValues = {
  name: string;
  issuer: string | null;
  certificateNumber: string | null;
  issuedOn: Date | null;
  expiresOn: Date | null;
  note: string | null;
  published: boolean;
  image: MediaDTO | null;
};

export function CertificationForm({
  action,
  initial,
  submitLabel,
}: {
  action: FormAction;
  initial?: CertificationFormValues;
  submitLabel: string;
}) {
  return (
    <AdminForm action={action} submitLabel={submitLabel}>
      <div className="adm-form-grid">
        <TextField label="證照名稱" name="name" defaultValue={initial?.name} required maxLength={200} wide />
        <TextField label="發證單位" name="issuer" defaultValue={initial?.issuer} maxLength={200} />
        <TextField label="證號" name="certificateNumber" defaultValue={initial?.certificateNumber} maxLength={100} />
        <TextField label="發證日期" name="issuedOn" type="date" defaultValue={formatDate(initial?.issuedOn)} />
        <TextField
          label="有效期限"
          name="expiresOn"
          type="date"
          defaultValue={formatDate(initial?.expiresOn)}
          hint="空白代表沒有期限；60 天內到期會在儀表板提醒"
        />
        <TextAreaField label="備註" name="note" defaultValue={initial?.note} rows={3} maxLength={2000} wide />
        <ImagePicker name="imageId" label="證照圖片" initial={initial?.image ?? null} />
        <CheckboxField label="上架（前台顯示）" name="published" defaultChecked={initial?.published} />
      </div>
    </AdminForm>
  );
}
