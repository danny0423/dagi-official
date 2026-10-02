import { AdminForm, CheckboxField, TextAreaField, TextField, type FormAction } from "@/app/admin/_components/form";
import { ImagePicker } from "@/app/admin/_components/image-picker";
import { formatDate, todayInTaipei } from "@/lib/admin/format";
import type { MediaDTO } from "@/lib/media-types";

export type NewsFormValues = {
  title: string;
  slug: string;
  summary: string | null;
  content: string;
  publishedAt: Date;
  published: boolean;
  coverImage: MediaDTO | null;
};

export function NewsForm({ action, initial, submitLabel }: { action: FormAction; initial?: NewsFormValues; submitLabel: string }) {
  return (
    <AdminForm action={action} submitLabel={submitLabel}>
      <div className="adm-form-grid">
        <TextField label="標題" name="title" defaultValue={initial?.title} required maxLength={200} wide />
        <TextField
          label="網址代稱"
          name="slug"
          defaultValue={initial?.slug}
          required
          maxLength={100}
          hint="只能用英文小寫、數字與連字號，例如 2026-10-company-founded"
        />
        <TextField
          label="日期"
          name="publishedAt"
          type="date"
          defaultValue={initial ? formatDate(initial.publishedAt) : todayInTaipei()}
          required
          hint="顯示在前台的消息日期"
        />
        <TextAreaField label="摘要" name="summary" defaultValue={initial?.summary} rows={3} maxLength={500} wide />
        <TextAreaField label="內文" name="content" defaultValue={initial?.content} rows={14} maxLength={50000} required wide />
        <ImagePicker name="coverImageId" label="封面圖片" initial={initial?.coverImage ?? null} />
        <CheckboxField label="上架（前台顯示）" name="published" defaultChecked={initial?.published} />
      </div>
    </AdminForm>
  );
}
