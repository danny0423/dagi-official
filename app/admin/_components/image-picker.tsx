"use client";

import Image from "next/image";
import { useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { useFieldError } from "@/app/admin/_components/form";
import { UPLOAD_ACCEPT, UPLOAD_MAX_BYTES, type MediaDTO } from "@/lib/media-types";

// 圖片欄位：從媒體庫挑選，或直接上傳（上傳後自動選取）。
// 這些元件會放在 AdminForm 的 <form> 裡，所以對話框內不能再放 <form>，按鈕一律 type="button"。

const ALLOWED = UPLOAD_ACCEPT.split(",");

export async function uploadImage(file: File, alt = ""): Promise<MediaDTO> {
  if (!ALLOWED.includes(file.type)) throw new Error(`「${file.name}」不是 JPG、PNG 或 WebP 圖片`);
  if (file.size > UPLOAD_MAX_BYTES) throw new Error(`「${file.name}」超過 10MB 上限`);
  const body = new FormData();
  body.append("file", file);
  body.append("alt", alt);
  const response = await fetch("/api/admin/media", { method: "POST", body });
  const data = (await response.json().catch(() => null)) as { ok?: boolean; message?: string; media?: MediaDTO } | null;
  if (response.status === 401) throw new Error("登入已過期，請重新登入");
  if (!response.ok || !data?.ok || !data.media) throw new Error(data?.message ?? "上傳失敗，請稍後再試");
  return data.media;
}

function Thumb({ media, className = "adm-thumb" }: { media: MediaDTO; className?: string }) {
  return (
    <Image
      src={media.url}
      alt={media.alt}
      width={media.width ?? 400}
      height={media.height ?? 300}
      className={className}
      unoptimized
    />
  );
}

function useMediaBrowser(onSelect: (media: MediaDTO) => void) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [items, setItems] = useState<MediaDTO[]>([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load(nextPage: number, q: string) {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(nextPage), q });
      const response = await fetch(`/api/admin/media?${params}`, { cache: "no-store" });
      const data = (await response.json().catch(() => null)) as
        | { ok?: boolean; message?: string; items?: MediaDTO[]; hasMore?: boolean }
        | null;
      if (!response.ok || !data?.ok) throw new Error(data?.message ?? "讀取媒體庫失敗");
      const loaded = data.items ?? [];
      setItems((previous) => (nextPage === 1 ? loaded : [...previous, ...loaded]));
      setPage(nextPage);
      setHasMore(Boolean(data.hasMore));
    } catch (err) {
      setError(err instanceof Error ? err.message : "讀取媒體庫失敗");
    } finally {
      setLoading(false);
    }
  }

  function open() {
    dialogRef.current?.showModal();
    void load(1, query);
  }

  function close() {
    dialogRef.current?.close();
  }

  function onSearchKey(event: KeyboardEvent<HTMLInputElement>) {
    // 在外層表單裡按 Enter 會送出整張表單，這裡攔下來改成搜尋
    if (event.key === "Enter") {
      event.preventDefault();
      void load(1, query);
    }
  }

  const dialog = (
    <dialog ref={dialogRef} className="adm-dialog" aria-label="從媒體庫選擇圖片">
      <div className="adm-dialog-header">
        <strong>從媒體庫選擇圖片</strong>
        <button type="button" className="adm-btn adm-btn-sm" onClick={close}>
          關閉
        </button>
      </div>
      <div className="adm-dialog-body">
        <div className="adm-actions">
          <input
            type="search"
            className="adm-input max-w-xs"
            placeholder="搜尋替代文字或檔名"
            aria-label="搜尋圖片"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onSearchKey}
          />
          <button type="button" className="adm-btn" onClick={() => void load(1, query)}>
            搜尋
          </button>
        </div>
        {error && <p className="adm-msg adm-msg-err">{error}</p>}
        {!loading && items.length === 0 && !error && <p className="adm-empty">媒體庫沒有圖片</p>}
        <div className="adm-pick-grid">
          {items.map((media) => (
            <button
              key={media.id}
              type="button"
              className="adm-pick-item"
              onClick={() => {
                onSelect(media);
                close();
              }}
            >
              <Thumb media={media} />
              <span>{media.alt || media.originalName || `#${media.id}`}</span>
            </button>
          ))}
        </div>
        {loading && <p className="adm-hint">讀取中…</p>}
        {hasMore && !loading && (
          <button type="button" className="adm-btn self-start" onClick={() => void load(page + 1, query)}>
            載入更多
          </button>
        )}
      </div>
    </dialog>
  );

  return { open, dialog };
}

// 單張圖片欄位（封面、照片）
export function ImagePicker({
  name,
  label,
  initial,
  hint,
}: {
  name: string;
  label: string;
  initial: MediaDTO | null;
  hint?: string;
}) {
  const [selected, setSelected] = useState<MediaDTO | null>(initial);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const fieldError = useFieldError(name);
  const browser = useMediaBrowser((media) => {
    setSelected(media);
    setError("");
  });

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      setSelected(await uploadImage(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "上傳失敗");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="adm-field adm-span-2">
      <span className="adm-label">{label}</span>
      <div className="adm-picker">
        <div className="adm-picker-preview">
          {selected ? <Thumb media={selected} /> : <div className="adm-picker-empty">尚未選擇圖片</div>}
        </div>
        <div className="flex flex-col gap-2">
          <div className="adm-actions">
            <button type="button" className="adm-btn adm-btn-sm" onClick={browser.open}>
              從媒體庫選擇
            </button>
            <button
              type="button"
              className="adm-btn adm-btn-sm"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? "上傳中…" : "上傳新圖片"}
            </button>
            {selected && (
              <button type="button" className="adm-btn adm-btn-sm adm-btn-danger" onClick={() => setSelected(null)}>
                移除
              </button>
            )}
          </div>
          {selected && (
            <p className="adm-hint">
              {selected.alt ? `替代文字：${selected.alt}` : "這張圖還沒有替代文字，可以到媒體庫補上"}
            </p>
          )}
          {hint && <p className="adm-hint">{hint}</p>}
          {error && <p className="adm-error" role="alert">{error}</p>}
          {fieldError && <p className="adm-error">{fieldError}</p>}
        </div>
      </div>
      <input type="hidden" name={name} value={selected?.id ?? ""} />
      <input ref={fileRef} type="file" accept={UPLOAD_ACCEPT} hidden onChange={onFile} />
      {browser.dialog}
    </div>
  );
}

// 多張圖片欄位（工程實績圖庫），可調整順序
export function GalleryPicker({ name, label, initial }: { name: string; label: string; initial: MediaDTO[] }) {
  const [items, setItems] = useState<MediaDTO[]>(initial);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const browser = useMediaBrowser((media) => {
    setItems((previous) => (previous.some((m) => m.id === media.id) ? previous : [...previous, media]));
  });

  function move(index: number, delta: number) {
    setItems((previous) => {
      const next = [...previous];
      const target = index + delta;
      if (target < 0 || target >= next.length) return previous;
      [next[index], next[target]] = [next[target]!, next[index]!];
      return next;
    });
  }

  async function onFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;
    setUploading(true);
    setError("");
    const errors: string[] = [];
    for (const file of files) {
      try {
        const media = await uploadImage(file);
        setItems((previous) => [...previous, media]);
      } catch (err) {
        errors.push(err instanceof Error ? err.message : `「${file.name}」上傳失敗`);
      }
    }
    setError(errors.join("；"));
    setUploading(false);
  }

  return (
    <div className="adm-field adm-span-2">
      <span className="adm-label">{label}</span>
      {items.length === 0 ? (
        <p className="adm-hint">尚未加入圖片</p>
      ) : (
        <ol className="adm-gallery">
          {items.map((media, index) => (
            <li key={media.id} className="adm-gallery-item">
              <Thumb media={media} />
              <input type="hidden" name={name} value={media.id} />
              <div className="adm-actions">
                <button
                  type="button"
                  className="adm-btn adm-btn-sm"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label="往前移"
                >
                  ←
                </button>
                <button
                  type="button"
                  className="adm-btn adm-btn-sm"
                  onClick={() => move(index, 1)}
                  disabled={index === items.length - 1}
                  aria-label="往後移"
                >
                  →
                </button>
                <button
                  type="button"
                  className="adm-btn adm-btn-sm adm-btn-danger"
                  onClick={() => setItems((previous) => previous.filter((m) => m.id !== media.id))}
                >
                  移除
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}
      <div className="adm-actions">
        <button type="button" className="adm-btn adm-btn-sm" onClick={browser.open}>
          從媒體庫加入
        </button>
        <button
          type="button"
          className="adm-btn adm-btn-sm"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? "上傳中…" : "上傳新圖片（可多選）"}
        </button>
      </div>
      {error && <p className="adm-error" role="alert">{error}</p>}
      <input ref={fileRef} type="file" accept={UPLOAD_ACCEPT} multiple hidden onChange={onFiles} />
      {browser.dialog}
    </div>
  );
}

// 媒體庫頁面的上傳區
export function MediaUploader() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<{ name: string; ok: boolean; message: string }[]>([]);

  async function onFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;
    setBusy(true);
    const output: { name: string; ok: boolean; message: string }[] = [];
    for (const file of files) {
      try {
        await uploadImage(file);
        output.push({ name: file.name, ok: true, message: "已上傳" });
      } catch (err) {
        output.push({ name: file.name, ok: false, message: err instanceof Error ? err.message : "上傳失敗" });
      }
      setResults([...output]);
    }
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="adm-card flex flex-col gap-3">
      <div className="adm-actions">
        <button
          type="button"
          className="adm-btn adm-btn-primary"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
        >
          {busy ? "上傳中…" : "選擇圖片上傳"}
        </button>
        <span className="adm-hint">JPG、PNG、WebP，單檔 10MB 以內，可一次選多張。上傳後記得補上替代文字。</span>
      </div>
      <input ref={fileRef} type="file" accept={UPLOAD_ACCEPT} multiple hidden onChange={onFiles} />
      <div role="status" aria-live="polite">
        {results.length > 0 && (
          <ul className="flex flex-col gap-1">
            {results.map((result, index) => (
              <li key={`${result.name}-${index}`} className={`adm-msg ${result.ok ? "adm-msg-ok" : "adm-msg-err"}`}>
                {result.name}：{result.message}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
