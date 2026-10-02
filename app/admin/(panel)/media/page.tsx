import type { Metadata } from "next";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/guard";
import { formatBytes, formatDateTime } from "@/lib/admin/format";
import { mediaUsageCountSelect, sumUsage, toMediaDTO } from "@/lib/media";
import { deleteMedia, updateMediaAlt } from "@/app/admin/_actions/media";
import { ActionButton } from "@/app/admin/_components/action-button";
import { AdminForm, TextField } from "@/app/admin/_components/form";
import { MediaUploader } from "@/app/admin/_components/image-picker";
import { EmptyState, PageHeader, Pager, type SearchParams } from "@/app/admin/_components/page-parts";

export const metadata: Metadata = { title: "媒體庫" };

const PAGE_SIZE = 24;

export default async function MediaPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  const [items, total] = await Promise.all([
    prisma.media.findMany({
      orderBy: { id: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { ...mediaUsageCountSelect, uploadedBy: { select: { name: true } } },
    }),
    prisma.media.count(),
  ]);

  return (
    <div className="adm-page">
      <PageHeader
        title="媒體庫"
        description="內容用到的圖片都在這裡。替代文字（alt）會給螢幕閱讀器與搜尋引擎看，請描述圖片內容。"
      />
      <MediaUploader />
      {items.length === 0 ? (
        <EmptyState>媒體庫還沒有圖片</EmptyState>
      ) : (
        <div className="adm-media-grid">
          {items.map((item) => {
            const media = toMediaDTO(item);
            const usage = sumUsage(item._count);
            return (
              <article key={item.id} className="adm-media-card">
                <a href={media.url} target="_blank" rel="noreferrer" aria-label={`開啟原圖 #${item.id}`}>
                  <Image
                    src={media.url}
                    alt={media.alt}
                    width={item.width ?? 400}
                    height={item.height ?? 300}
                    className="adm-thumb"
                    unoptimized
                  />
                </a>
                <div className="adm-media-card-body">
                  <div className="adm-media-meta">
                    <div>
                      #{item.id}・{item.originalName ?? "（無檔名）"}
                    </div>
                    <div>
                      {item.width && item.height ? `${item.width}×${item.height}・` : ""}
                      {formatBytes(item.size)}・{item.mimeType.replace("image/", "").toUpperCase()}
                    </div>
                    <div>
                      {formatDateTime(item.createdAt)}
                      {item.uploadedBy ? `・${item.uploadedBy.name}` : ""}
                    </div>
                  </div>
                  <div>
                    {usage > 0 ? (
                      <span className="adm-badge adm-badge-steel">使用中：{usage} 處</span>
                    ) : (
                      <span className="adm-badge">未使用</span>
                    )}
                    {!item.alt && <span className="adm-badge adm-badge-warn ml-1">缺替代文字</span>}
                  </div>
                  <AdminForm action={updateMediaAlt.bind(null, item.id)} submitLabel="儲存替代文字">
                    <TextField label="替代文字" name="alt" defaultValue={item.alt} maxLength={300} />
                  </AdminForm>
                  <ActionButton
                    action={deleteMedia.bind(null, item.id)}
                    label="刪除圖片"
                    variant="danger"
                    confirmMessage={
                      usage > 0
                        ? `這張圖片仍被 ${usage} 處內容使用，必須先移除引用才能刪除。按「確定」會列出使用位置。`
                        : "確定要刪除這張圖片？刪除後無法復原。"
                    }
                  />
                </div>
              </article>
            );
          })}
        </div>
      )}
      <Pager page={page} pageCount={Math.ceil(total / PAGE_SIZE)} href={(p) => `/admin/media?page=${p}`} />
    </div>
  );
}
