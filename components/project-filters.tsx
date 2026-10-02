"use client";

import { useRef, useState, type ReactNode } from "react";

type ProjectItem = { id: string; category: string | null; status: string | null; content: ReactNode };
const filters = ["全部", "民間建築", "公共工程", "危老重建", "施工中", "已完工"];

export function ProjectFilters({ items }: { items: ProjectItem[] }) {
  const [filter, setFilter] = useState("全部");
  const allButton = useRef<HTMLButtonElement>(null);
  const visible = items.filter((item) => filter === "全部" || item.category === filter || item.status === filter);

  return <>
    <div className="project-filters" role="group" aria-label="篩選工程">
      {filters.map((label) => <button key={label} ref={label === "全部" ? allButton : undefined} type="button" aria-pressed={filter === label} aria-controls="project-results" onClick={() => setFilter(label)}>{label}</button>)}
    </div>
    <p className="filter-status" role="status">{filter === "全部" ? "所有工程" : filter} · {visible.length === 0 ? "目前沒有符合的項目" : "以下為範例專案，非真實案件"}</p>
    <div id="project-results" className="project-results">
      {visible.length > 0 ? visible.map((item) => <div key={item.id}>{item.content}</div>) : <div className="empty-state concrete">
        <h2>尚無符合的工程</h2>
        <p>範例專案的工程類別與施工狀態尚待填寫。</p>
        <button className="text-link" type="button" onClick={() => { setFilter("全部"); allButton.current?.focus(); }}>查看全部工程</button>
      </div>}
    </div>
  </>;
}
