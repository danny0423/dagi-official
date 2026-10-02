import { AdminForm, CheckboxField, TextAreaField, TextField, type FormAction } from "@/app/admin/_components/form";

export type JobFormValues = {
  title: string;
  department: string | null;
  location: string | null;
  employmentType: string | null;
  salary: string | null;
  description: string | null;
  requirements: string | null;
  benefits: string | null;
  published: boolean;
};

export function JobForm({ action, initial, submitLabel }: { action: FormAction; initial?: JobFormValues; submitLabel: string }) {
  return (
    <AdminForm action={action} submitLabel={submitLabel}>
      <div className="adm-form-grid">
        <TextField label="職缺名稱" name="title" defaultValue={initial?.title} required maxLength={200} wide />
        <TextField label="部門" name="department" defaultValue={initial?.department} maxLength={100} />
        <TextField label="工作地點" name="location" defaultValue={initial?.location} maxLength={200} />
        <TextField label="工作性質" name="employmentType" defaultValue={initial?.employmentType} maxLength={50} hint="例：全職、約聘" />
        <TextField
          label="薪資"
          name="salary"
          defaultValue={initial?.salary}
          maxLength={200}
          hint="依就業服務法，經常性薪資未達新臺幣 4 萬元的職缺須公開薪資範圍"
        />
        <TextAreaField label="工作內容" name="description" defaultValue={initial?.description} rows={8} maxLength={10000} wide />
        <TextAreaField label="條件" name="requirements" defaultValue={initial?.requirements} rows={6} maxLength={10000} wide />
        <TextAreaField label="福利" name="benefits" defaultValue={initial?.benefits} rows={4} maxLength={10000} wide />
        <CheckboxField label="上架（前台顯示）" name="published" defaultChecked={initial?.published} />
      </div>
    </AdminForm>
  );
}
