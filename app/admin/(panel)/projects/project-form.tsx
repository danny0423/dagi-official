import {
  AdminForm,
  CheckboxField,
  SelectField,
  SlugField,
  TextAreaField,
  TextField,
  type FormAction,
} from "@/app/admin/_components/form";
import { GalleryPicker, ImagePicker } from "@/app/admin/_components/image-picker";
import { formatDate, projectStatusLabel } from "@/lib/admin/format";
import type { MediaDTO } from "@/lib/media-types";

export type ProjectFormValues = {
  title: string;
  slug: string;
  category: string | null;
  location: string | null;
  structure: string | null;
  scale: string | null;
  client: string | null;
  startDate: Date | null;
  endDate: Date | null;
  status: keyof typeof projectStatusLabel;
  summary: string | null;
  description: string | null;
  featured: boolean;
  published: boolean;
  coverImage: MediaDTO | null;
  gallery: MediaDTO[];
};

const statusOptions = Object.entries(projectStatusLabel).map(([value, label]) => ({ value, label }));

export function ProjectForm({
  action,
  initial,
  submitLabel,
}: {
  action: FormAction;
  initial?: ProjectFormValues;
  submitLabel: string;
}) {
  return (
    <AdminForm action={action} submitLabel={submitLabel}>
      <div className="adm-form-grid">
        <TextField label="工程名稱" name="title" defaultValue={initial?.title} required maxLength={200} wide />
        <SlugField
          sourceLabel="工程名稱"
          pathPrefix="/projects/"
          example="台中辦公大樓新建工程"
          defaultValue={initial?.slug}
          note={initial ? "已上架的工程改了代稱，舊網址會失效。" : undefined}
        />
        <SelectField label="工程狀態" name="status" options={statusOptions} defaultValue={initial?.status ?? "IN_PROGRESS"} />
        <TextField label="類別" name="category" defaultValue={initial?.category} maxLength={100} hint="例：住宅、廠房、公共工程" />
        <TextField label="地點" name="location" defaultValue={initial?.location} maxLength={200} />
        <TextField label="業主／起造人" name="client" defaultValue={initial?.client} maxLength={200} />
        <TextField label="構造" name="structure" defaultValue={initial?.structure} maxLength={100} hint="例：RC、SRC、SS" />
        <TextField label="規模" name="scale" defaultValue={initial?.scale} maxLength={200} hint="例：地上 ○ 層、地下 ○ 層" />
        <TextField label="開工日期" name="startDate" type="date" defaultValue={formatDate(initial?.startDate)} />
        <TextField label="完工日期" name="endDate" type="date" defaultValue={formatDate(initial?.endDate)} />
        <TextAreaField label="摘要" name="summary" defaultValue={initial?.summary} rows={3} maxLength={500} wide />
        <TextAreaField label="工程說明" name="description" defaultValue={initial?.description} rows={10} maxLength={20000} wide />
        <ImagePicker name="coverImageId" label="封面圖片" initial={initial?.coverImage ?? null} />
        <GalleryPicker name="galleryIds" label="圖庫（可多張、可排序）" initial={initial?.gallery ?? []} />
        <CheckboxField label="首頁精選" name="featured" defaultChecked={initial?.featured} />
        <CheckboxField
          label="上架（前台顯示）"
          name="published"
          defaultChecked={initial?.published}
          hint="隆磐建設的工程屬於隆磐，不可登錄成本公司實績"
        />
      </div>
    </AdminForm>
  );
}
