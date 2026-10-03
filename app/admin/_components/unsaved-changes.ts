"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId } from "react";

// 未存檔離開提醒（docs/ux-review-admin.md #2）：表單有未儲存的變更時，下列情況都會先跳確認框。
// - 關分頁、重新整理、在網址列換網址、點站外連結：beforeunload（瀏覽器內建的提示，文字無法自訂）
// - 點側邊選單或其他站內連結：在 document 的 capture 階段攔下點擊（比 next/link 的 onClick 早），取消時 preventDefault
// - 瀏覽器上一頁：表單第一次變成未存檔時，多推一筆「同網址」的歷史紀錄。按上一頁時先回到這筆同頁的紀錄，
//   攔下 popstate（不讓 Next.js 處理）並詢問；取消就再推一筆、留在原頁，確定就真的再退一頁。
//   一次跳好幾頁（長按上一頁選單）的情況攔不到，交給 Next.js 照常處理。
//
// 同一頁可能有多張表單（帳號管理、媒體庫），所以狀態放在模組層級、整頁共用；最後一張表單卸載（換頁）時重設。
// 用法：在表單元件裡呼叫 useUnsavedChanges(dirty)。AdminForm 已內建，一般不需要自己呼叫。

export const UNSAVED_MESSAGE = "這個頁面有還沒儲存的變更，離開後會遺失。確定要離開嗎？";

const dirtyForms = new Set<string>();
const mountedForms = new Set<string>();
let guardUrl: string | null = null; // 多推的那筆歷史紀錄的網址；null 表示沒有推
let passThrough = false; // 使用者已確認離開：下一次 popstate 交給 Next.js
let allowUnload = false; // 使用者已確認離開：不要再跳 beforeunload
let replaceNavigate: ((href: string) => void) | null = null;

function isDirty(): boolean {
  return dirtyForms.size > 0;
}

function pushGuardEntry() {
  // history.state 帶有 Next.js 的 __NA 標記，Next.js 修補過的 pushState 會原樣放行、不觸發換頁
  window.history.pushState(window.history.state, "", window.location.href);
  guardUrl = window.location.href;
}

// 確定離開後的短暫放行；如果其實沒有離開（例如沒有上一頁可回），1 秒後恢復保護
function allowLeaving() {
  passThrough = true;
  allowUnload = true;
  window.setTimeout(() => {
    passThrough = false;
    allowUnload = false;
  }, 1000);
}

function onBeforeUnload(event: BeforeUnloadEvent) {
  if (!isDirty() || allowUnload) return;
  event.preventDefault();
  // 舊版瀏覽器要設 returnValue 才會跳提示
  event.returnValue = "";
}

function onPopState(event: PopStateEvent) {
  if (passThrough) {
    passThrough = false;
    return;
  }
  // 只處理「從多推的那筆回到同網址的原本那筆」
  if (guardUrl === null || window.location.href !== guardUrl) return;
  // 還在同一頁，不讓 Next.js 重新處理這次換頁（capture 階段註冊，會比 Next.js 的監聽先執行）
  event.stopImmediatePropagation();
  guardUrl = null;
  if (isDirty() && !window.confirm(UNSAVED_MESSAGE)) {
    pushGuardEntry();
    return;
  }
  allowLeaving();
  window.history.back();
}

function onDocumentClick(event: MouseEvent) {
  if (event.defaultPrevented || event.button !== 0) return;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; // 開新分頁／新視窗
  const anchor = event.target instanceof Element ? event.target.closest("a[href]") : null;
  if (!(anchor instanceof HTMLAnchorElement)) return;
  if ((anchor.target && anchor.target !== "_self") || anchor.hasAttribute("download")) return;

  const url = new URL(anchor.href, window.location.href);
  const here = new URL(window.location.href);
  // 同頁的錨點（例如錯誤摘要裡跳到欄位的連結）不算離開
  if (url.origin === here.origin && url.pathname === here.pathname && url.search === here.search) return;

  if (isDirty() && !window.confirm(UNSAVED_MESSAGE)) {
    event.preventDefault();
    return;
  }
  if (url.origin !== here.origin) {
    // 站外連結會整頁離開，已經確認過就不要再跳 beforeunload
    if (isDirty()) allowLeaving();
    return;
  }
  if (guardUrl !== null && replaceNavigate) {
    // 有多推一筆同網址的紀錄時，改用 replace 換頁，免得之後按上一頁要在同一頁停兩次。
    // preventDefault 會讓 next/link 不換頁（它看到 defaultPrevented 就跳過），但連結自己的 onClick 照常執行（例如收合手機選單）
    event.preventDefault();
    guardUrl = null;
    replaceNavigate(`${url.pathname}${url.search}${url.hash}`);
    return;
  }
  if (isDirty()) allowLeaving();
}

function install() {
  window.addEventListener("beforeunload", onBeforeUnload);
  window.addEventListener("popstate", onPopState, { capture: true });
  document.addEventListener("click", onDocumentClick, { capture: true });
}

function uninstall() {
  window.removeEventListener("beforeunload", onBeforeUnload);
  window.removeEventListener("popstate", onPopState, { capture: true });
  document.removeEventListener("click", onDocumentClick, { capture: true });
  dirtyForms.clear();
  guardUrl = null;
  passThrough = false;
  allowUnload = false;
  replaceNavigate = null;
}

export function useUnsavedChanges(dirty: boolean): void {
  const id = useId();
  const router = useRouter();

  useEffect(() => {
    replaceNavigate = (href) => router.replace(href);
  }, [router]);

  useEffect(() => {
    if (mountedForms.size === 0) install();
    mountedForms.add(id);
    return () => {
      mountedForms.delete(id);
      dirtyForms.delete(id);
      if (mountedForms.size === 0) uninstall();
    };
  }, [id]);

  useEffect(() => {
    if (!dirty) {
      dirtyForms.delete(id);
      return;
    }
    dirtyForms.add(id);
    if (guardUrl !== window.location.href) pushGuardEntry();
  }, [id, dirty]);
}
