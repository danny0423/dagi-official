import Link from "next/link";
import type { ReactNode } from "react";
import { ActionButton } from "@/app/admin/_components/action-button";
import { EmptyState, PublishedBadge } from "@/app/admin/_components/page-parts";
import { deleteContent, moveContent, togglePublished } from "@/app/admin/_actions/content";
import { CONTENT_KINDS, type ContentKind } from "@/lib/admin/content";

// 五種內容共用的列表：自訂欄位＋上下架、上移／下移、編輯、刪除。
// 每格都帶 data-label：手機寬度（admin.css 900px 以下）表格改成一筆一張卡片，用它當欄位名稱。
export type Column<T> = { header: string; cell: (row: T) => ReactNode; className?: string };

export function ContentTable<T extends { id: number; published: boolean }>({
  kind,
  rows,
  columns,
  titleOf,
  emptyText,
}: {
  kind: ContentKind;
  rows: T[];
  columns: Column<T>[];
  titleOf: (row: T) => string;
  emptyText: ReactNode;
}) {
  if (rows.length === 0) return <EmptyState>{emptyText}</EmptyState>;
  const basePath = CONTENT_KINDS[kind].adminPath;
  const label = CONTENT_KINDS[kind].label;

  return (
    <div className="adm-table-wrap">
      <table className="adm-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.header} scope="col">
                {column.header}
              </th>
            ))}
            <th scope="col">上架</th>
            <th scope="col">排序</th>
            <th scope="col">操作</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id}>
              {columns.map((column) => (
                <td key={column.header} className={column.className} data-label={column.header}>
                  {column.cell(row)}
                </td>
              ))}
              <td data-label="上架">
                <div className="adm-actions">
                  <PublishedBadge published={row.published} />
                  <ActionButton
                    action={togglePublished.bind(null, kind, row.id)}
                    label={row.published ? "下架" : "上架"}
                    ariaLabel={`「${titleOf(row)}」${row.published ? "下架" : "上架"}`}
                  />
                </div>
              </td>
              <td data-label="排序">
                <div className="adm-actions flex-nowrap">
                  <ActionButton
                    action={moveContent.bind(null, kind, row.id, "up")}
                    label="↑"
                    ariaLabel={`「${titleOf(row)}」上移`}
                    disabled={index === 0}
                  />
                  <ActionButton
                    action={moveContent.bind(null, kind, row.id, "down")}
                    label="↓"
                    ariaLabel={`「${titleOf(row)}」下移`}
                    disabled={index === rows.length - 1}
                  />
                </div>
              </td>
              <td className="adm-cell-actions" data-label="操作">
                <div className="adm-actions flex-nowrap">
                  <Link href={`${basePath}/${row.id}`} className="adm-btn adm-btn-sm" aria-label={`編輯「${titleOf(row)}」`}>
                    編輯
                  </Link>
                  <ActionButton
                    action={deleteContent.bind(null, kind, row.id)}
                    label="刪除"
                    ariaLabel={`刪除「${titleOf(row)}」`}
                    variant="danger"
                    confirmMessage={`確定要刪除${label}「${titleOf(row)}」？刪除後無法復原。`}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
