"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { PlaceholderText } from "@/components/placeholder-text";
import { company } from "@/lib/placeholder-company";

export function InquiryForm({ kind }: { kind: "engineering" | "partner" }) {
  const partner = kind === "partner";
  const prefix = partner ? "partner" : "engineering";
  const form = useRef<HTMLFormElement>(null);
  const [checked, setChecked] = useState(false);

  return <form ref={form} className="inquiry-form" aria-label={partner ? "協力廠商登記表單" : "工程洽詢表單"}
    onSubmit={(event) => event.preventDefault()} onChange={() => setChecked(false)}>
    <p id={`${prefix}-notice`} className="content-notice">目前為表單預覽，尚未開放送出。可檢查填寫內容，資料不會儲存或寄出。</p>
    <p className="form-required-note">標示「必填」的欄位請務必填寫。</p>

    {!partner && <fieldset className="identity-fieldset"><legend>您的身分</legend><div className="radio-options">
      {["建設公司／起造人", "政府機關", "地主／自地自建", "其他"].map((identity, index) => <label key={identity}><input type="radio" name="identity" value={identity} defaultChecked={index === 0} />{identity}</label>)}
    </div></fieldset>}

    <div className="form-grid">
      {partner ? <>
        <label htmlFor={`${prefix}-company`}>廠商名稱 <span className="required-label">必填</span><input id={`${prefix}-company`} name="company" autoComplete="organization" required maxLength={120} pattern={".*\\S.*"} title="請填寫廠商名稱" /></label>
        <label htmlFor={`${prefix}-tax`}>統一編號 <span className="required-label">必填</span><input id={`${prefix}-tax`} name="taxId" inputMode="numeric" required pattern="[0-9]{8}" maxLength={8} title="請填寫 8 碼數字統一編號" /></label>
        <label htmlFor={`${prefix}-trade`}>工種 <span className="required-label">必填</span><input id={`${prefix}-trade`} name="trade" required maxLength={120} pattern={".*\\S.*"} title="請填寫工種" /></label>
        <label htmlFor={`${prefix}-area`}>服務區域<input id={`${prefix}-area`} name="area" maxLength={120} /></label>
      </> : null}

      <label htmlFor={`${prefix}-name`}>聯絡人{!partner && "姓名"} {!partner && <span className="required-label">必填</span>}<input id={`${prefix}-name`} name="contactName" autoComplete="name" required={!partner} pattern={".*\\S.*"} maxLength={80} title="請填寫聯絡人姓名" /></label>
      {!partner && <label htmlFor={`${prefix}-company`}>公司或單位<input id={`${prefix}-company`} name="company" autoComplete="organization" maxLength={120} /></label>}
      <label htmlFor={`${prefix}-phone`}>電話 <span className="required-label">必填</span><input id={`${prefix}-phone`} name="phone" type="tel" autoComplete="tel" required minLength={6} maxLength={40} pattern=".*[0-9].*" title="請填寫包含數字的聯絡電話，至少 6 個字元" /></label>
      {!partner && <>
        <label htmlFor={`${prefix}-email`}>Email<input id={`${prefix}-email`} name="email" type="email" autoComplete="email" maxLength={254} /></label>
        <label htmlFor={`${prefix}-location`}>工程地點（縣市區） <span className="required-label">必填</span><input id={`${prefix}-location`} name="location" required maxLength={120} pattern={".*\\S.*"} title="請填寫工程所在縣市區" /></label>
        <label htmlFor={`${prefix}-type`}>工程類型<select id={`${prefix}-type`} name="projectType" defaultValue=""><option value="" disabled>請選擇工程類型</option>{["民間建築", "公共工程", "危老重建", "其他"].map((value) => <option key={value}>{value}</option>)}</select></label>
        <label htmlFor={`${prefix}-scale`}>預估規模<input id={`${prefix}-scale`} name="scale" maxLength={200} aria-describedby={`${prefix}-scale-help`} /><span id={`${prefix}-scale-help`} className="field-help">例如：樓層、樓地板面積</span></label>
        <label htmlFor={`${prefix}-start`}>預定開工時間<select id={`${prefix}-start`} name="start" defaultValue="尚未確定">{["三個月內", "半年內", "一年內", "尚未確定"].map((value) => <option key={value}>{value}</option>)}</select></label>
        <label htmlFor={`${prefix}-notes`} className="form-full">補充說明<textarea id={`${prefix}-notes`} name="notes" rows={5} maxLength={3000} /></label>
      </>}
      {partner && <div className="form-full file-preview">
        <label htmlFor={`${prefix}-profile`}>公司簡介或實績（選填）</label>
        <input id={`${prefix}-profile`} type="file" disabled aria-describedby={`${prefix}-file-help`} />
        <p id={`${prefix}-file-help`} className="field-help"><PlaceholderText text="【待填：上傳公司簡介或實績，選填】" />；尚未開放上傳。</p>
      </div>}
    </div>

    {!partner && <div className="privacy-consent"><input id={`${prefix}-privacy`} name="privacy" type="checkbox" required /><label htmlFor={`${prefix}-privacy`}>我已閱讀並同意<Link href="/privacy" target="_blank" rel="noopener noreferrer">隱私權政策<span className="sr-only">（另開分頁）</span></Link> <span className="required-label">必填</span></label></div>}
    <div className="form-actions">
      <button type="button" className="text-link" onClick={() => {
        if (form.current?.reportValidity()) setChecked(true);
      }}>檢查填寫內容</button>
      <button type="submit" className="button-primary" disabled data-cta={partner ? "partner-submit" : "contact-submit"} aria-describedby={`${prefix}-notice`}>送出</button>
    </div>
    <p className="form-status" role="status">{checked ? "欄位檢查完成。尚未開放送出，資料未儲存或寄出。" : ""}</p>
    {!partner && <details className="submission-preview"><summary>送出完成訊息（僅供預覽）</summary><p><PlaceholderText text={`已收到您的洽詢，我們會在${company.responseTime}內與您聯絡。`} /></p><p className="field-help">以上為完成畫面的文案預覽，並未送出任何資料。</p></details>}
  </form>;
}
