import { AdminForm, CheckboxField, SlugField, TextAreaField, TextField, type FormAction } from "@/app/admin/_components/form";
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
        <SlugField
          sourceLabel="標題"
          pathPrefix="/news/"
          example="公司成立公告"
          defaultValue={initial?.slug}
          note="消息內頁上線後就是這個網址；已上架的消息改了代稱，舊網址會失效。"
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
