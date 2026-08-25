"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminTable from "@/components/admin/ui/AdminTable";
import CompanyActionButtons from "@/components/admin/ui/CompanyActionButtons";
import { useCompanies } from "./contexts/CompanyContext";

// ── Constants ──────────────────────────────────────────────────────────────────

const INDUSTRIES = [
  "ยานยนต์", "อิเล็กทรอนิกส์", "เทคโนโลยีสารสนเทศ", "เคมีและวัสดุ",
  "ก่อสร้างและโยธา", "พลังงานและสาธารณูปโภค", "อุตสาหกรรมการผลิต", "นิคมอุตสาหกรรม",
];
const STATUSES      = ["ร่วมมือ", "รอดำเนินการ", "ระงับ"];
const MOU_STATUSES  = ["มี MOU", "ไม่มี MOU"];
const TYPES         = ["บริษัทจำกัด", "บริษัทมหาชนจำกัด", "รัฐวิสาหกิจ", "หน่วยงานวิจัย"];
const PAGE_SIZE_OPTIONS = [10, 20, 30, 50];

const STATUS_CONFIG = {
  ร่วมมือ:     { color: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  รอดำเนินการ: { color: "bg-amber-100 text-amber-700 border-amber-200",       dot: "bg-amber-500"   },
  ระงับ:       { color: "bg-red-100 text-red-700 border-red-200",             dot: "bg-red-500"     },
};
const MOU_CONFIG = {
  "มี MOU":    "bg-blue-100 text-blue-700 border-blue-200",
  "ไม่มี MOU": "bg-gray-100 text-gray-500 border-gray-200",
};

const selectCls = "rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-accent-soft";
const labelCls  = "text-xs font-medium text-foreground";
const chipBase  = "inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-accent-soft px-2.5 py-1 text-xs font-semibold text-primary hover:border-red-400 hover:bg-red-50 hover:text-red-500 transition-colors";

// ── CSV helpers ────────────────────────────────────────────────────────────────

const CSV_HEADERS = [
  "id", "name", "nameEn", "industry", "type", "country", "province", "address",
  "website", "linkedin", "contactName", "contactEmail", "contactTel",
  "status", "mouStatus", "mouExpiry", "openPositions", "description", "note",
];

function toCSVField(val) {
  const s = String(val ?? "");
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"` : s;
}
function exportCSV(companies, filename = `companies_${new Date().toISOString().slice(0,10)}.csv`) {
  const rows = [CSV_HEADERS.join(",")];
  for (const c of companies) rows.push(CSV_HEADERS.map((k) => toCSVField(c[k])).join(","));
  const blob = new Blob(["﻿" + rows.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function parseCSVLine(line) {
  const result = []; let cur = "", inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { if (inQ && line[i+1] === '"') { cur += '"'; i++; } else inQ = !inQ; }
    else if (ch === "," && !inQ) { result.push(cur); cur = ""; }
    else cur += ch;
  }
  result.push(cur); return result;
}
function parseCSV(text) {
  const lines = text.replace(/\r\n/g,"\n").replace(/\r/g,"\n").split("\n").filter(Boolean);
  if (lines.length < 2) return { error: "ไฟล์ว่างหรือไม่มีข้อมูล" };
  const headers = parseCSVLine(lines[0]).map(h => h.trim());
  const missing = ["id", "name"].filter(r => !headers.includes(r));
  if (missing.length) return { error: `ไม่พบคอลัมน์ที่จำเป็น: ${missing.join(", ")}` };
  const rows = lines.slice(1).map((line) => {
    const vals = parseCSVLine(line); const obj = {};
    headers.forEach((h, i) => { obj[h] = (vals[i] ?? "").trim(); });
    if (obj.openPositions) obj.openPositions = parseInt(obj.openPositions, 10) || 0;
    return obj;
  }).filter(r => r.id?.trim() && r.name?.trim());
  if (!rows.length) return { error: "ไม่พบข้อมูลบริษัทที่ถูกต้อง (ต้องมีทั้ง id และ name)" };
  return { rows };
}

// ── Filter persistence ─────────────────────────────────────────────────────────

const FILTER_KEY = "company-list-filters";
function loadFilters() {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(sessionStorage.getItem(FILTER_KEY)) ?? {}; } catch { return {}; }
}
function saveFilters(data) {
  try { sessionStorage.setItem(FILTER_KEY, JSON.stringify(data)); } catch { /* ignore */ }
}

// ── Shared icons ───────────────────────────────────────────────────────────────

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);

// ── CopyButton ─────────────────────────────────────────────────────────────────

function CopyButton({ value }) {
  const [copied, setCopied] = useState(false);
  const copy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={copy} title="คัดลอก"
      className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-border text-muted hover:border-primary hover:text-primary transition-colors">
      {copied
        ? <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-emerald-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
        : <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"/><path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"/></svg>
      }
    </button>
  );
}

// ── Pagination ─────────────────────────────────────────────────────────────────

function Pagination({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null;
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) pages.push(i);
    else if (pages[pages.length - 1] !== "…") pages.push("…");
  }
  return (
    <div className="flex items-center gap-1">
      <button disabled={page === 1} onClick={() => onPage(page - 1)}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-sm text-muted disabled:opacity-40 hover:bg-surface-muted enabled:cursor-pointer transition-colors">‹</button>
      {pages.map((p, i) => (
        <button key={i} disabled={p === "…" || p === page} onClick={() => typeof p === "number" && onPage(p)}
          className={`flex h-8 min-w-[2rem] items-center justify-center rounded-lg border text-sm transition-colors px-2 ${
            p === page ? "border-primary bg-accent-soft font-bold text-primary"
            : p === "…" ? "border-transparent cursor-default text-muted"
            : "border-border text-muted hover:bg-surface-muted cursor-pointer"}`}>
          {p}
        </button>
      ))}
      <button disabled={page === totalPages} onClick={() => onPage(page + 1)}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-sm text-muted disabled:opacity-40 hover:bg-surface-muted enabled:cursor-pointer transition-colors">›</button>
    </div>
  );
}

// ── Import Modal ───────────────────────────────────────────────────────────────

function ImportModal({ onClose, onImport }) {
  const [rows, setRows] = useState(null);
  const [mode, setMode] = useState("replace");
  const [error, setError] = useState("");
  const dropRef = useRef(null);

  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  const handleFile = (file) => {
    if (!file) return;
    if (!file.name.endsWith(".csv")) { setError("กรุณาเลือกไฟล์ .csv เท่านั้น"); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = parseCSV(e.target.result);
        if (result.error) { setError(result.error); return; }
        setRows(result.rows); setError("");
      } catch { setError("ไม่สามารถอ่านไฟล์ได้"); }
    };
    reader.readAsText(file, "UTF-8");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="font-bold text-foreground">นำเข้าข้อมูลบริษัท (CSV)</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted hover:bg-surface-muted hover:text-foreground transition-colors">✕</button>
        </div>
        <div className="space-y-4 p-6">
          {!rows ? (
            <div ref={dropRef} onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
              className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border py-12 text-center hover:border-primary hover:bg-accent-soft/10 transition-colors cursor-pointer"
              onClick={() => dropRef.current?.querySelector("input")?.click()}>
              <span className="text-3xl">📂</span>
              <p className="text-sm font-medium text-foreground">ลากไฟล์ CSV มาวาง หรือคลิกเพื่อเลือก</p>
              <p className="text-xs text-muted">รองรับไฟล์ .csv เท่านั้น (UTF-8 หรือ UTF-8 BOM)</p>
              <input type="file" accept=".csv" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
              <div className="mt-1 rounded-lg bg-surface-muted px-4 py-2 text-left text-xs text-muted">
                <p className="font-semibold text-foreground mb-0.5">คอลัมน์บังคับ: <span className="text-red-500">id, name</span></p>
                <p className="font-mono">{CSV_HEADERS.join(", ")}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">พบข้อมูล <span className="text-primary font-bold">{rows.length}</span> บริษัท — ตัวอย่าง 3 แถวแรก</p>
              <div className="overflow-x-auto rounded-xl border border-border text-xs">
                <table className="w-full">
                  <thead className="bg-surface-muted">
                    <tr>{["id","name","industry","status","openPositions"].map((h) => (
                      <th key={h} className="px-3 py-2 text-left text-muted font-semibold">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {rows.slice(0,3).map((r,i) => (
                      <tr key={i} className="border-t border-border">
                        {["id","name","industry","status","openPositions"].map((h) => (
                          <td key={h} className="px-3 py-2 truncate max-w-[120px]">{String(r[h]??"")}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-4 text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="mode" value="replace" checked={mode==="replace"} onChange={() => setMode("replace")} className="accent-primary" />
                  <span><span className="font-semibold">แทนที่ทั้งหมด</span> — ลบข้อมูลเดิมแล้วใช้ข้อมูลใหม่</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="mode" value="merge" checked={mode==="merge"} onChange={() => setMode("merge")} className="accent-primary" />
                  <span><span className="font-semibold">รวม/อัปเดต</span> — เพิ่มหรืออัปเดตตาม ID</span>
                </label>
              </div>
            </div>
          )}
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
          <button onClick={onClose} className="btn-secondary">ยกเลิก</button>
          {rows && <button onClick={() => onImport(rows, mode)} className="btn-primary">นำเข้า {rows.length} บริษัท</button>}
        </div>
      </div>
    </div>
  );
}

// ── Add Modal ──────────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  name: "", nameEn: "", industry: INDUSTRIES[0], type: TYPES[0],
  country: "ไทย", province: "กรุงเทพมหานคร", address: "",
  website: "", linkedin: "",
  contactName: "", contactEmail: "", contactTel: "",
  status: "รอดำเนินการ", mouStatus: "ไม่มี MOU", mouExpiry: "",
  openPositions: 0, description: "", note: "",
};

function FormSection({ icon, title, children }) {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="flex items-center gap-2 bg-surface-muted px-4 py-2.5 border-b border-border">
        <span className="text-base leading-none">{icon}</span>
        <p className="text-xs font-bold uppercase tracking-wider text-muted">{title}</p>
      </div>
      <div className="p-4 grid gap-3 sm:grid-cols-2">{children}</div>
    </div>
  );
}
function Field({ label, required, span2, children }) {
  return (
    <div className={span2 ? "sm:col-span-2" : ""}>
      <label className="block text-xs font-semibold text-foreground mb-1.5">
        {label}{required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function AddModal({ onClose, onAdd, nextId }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const iCls = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted outline-none focus:border-primary focus:ring-2 focus:ring-accent-soft transition-colors";
  const sCls = iCls + " cursor-pointer";

  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onAdd({ ...form, id: nextId, openPositions: parseInt(form.openPositions, 10) || 0 });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="w-full max-w-2xl rounded-2xl bg-surface shadow-2xl flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between border-b border-border px-6 py-4 shrink-0">
          <div>
            <h2 className="font-bold text-foreground">เพิ่มบริษัทใหม่</h2>
            <p className="text-xs text-muted mt-0.5">รหัสที่จะได้รับ: <span className="font-mono font-semibold text-primary">{nextId}</span></p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-muted hover:bg-surface-muted hover:text-foreground transition-colors">
            <XIcon />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          <FormSection icon="🏢" title="ข้อมูลทั่วไป">
            <Field label="ชื่อบริษัท (ภาษาไทย)" required span2>
              <input required value={form.name} onChange={set("name")} placeholder="บริษัท ..." className={iCls} />
            </Field>
            <Field label="ชื่อบริษัท (ภาษาอังกฤษ)" span2>
              <input value={form.nameEn} onChange={set("nameEn")} placeholder="Company Name Co., Ltd." className={iCls} />
            </Field>
            <Field label="อุตสาหกรรม">
              <select value={form.industry} onChange={set("industry")} className={sCls}>
                {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
              </select>
            </Field>
            <Field label="ประเภทนิติบุคคล">
              <select value={form.type} onChange={set("type")} className={sCls}>
                {TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
          </FormSection>
          <FormSection icon="📍" title="ที่ตั้ง">
            <Field label="ประเทศ">
              <input value={form.country} onChange={set("country")} placeholder="เช่น ไทย, ญี่ปุ่น" className={iCls} />
            </Field>
            <Field label="จังหวัด / เมือง">
              <input value={form.province} onChange={set("province")} placeholder="กรุงเทพมหานคร" className={iCls} />
            </Field>
            <Field label="ที่อยู่เต็ม" span2>
              <input value={form.address} onChange={set("address")} placeholder="เลขที่ ถนน แขวง/ตำบล เขต/อำเภอ รหัสไปรษณีย์" className={iCls} />
            </Field>
          </FormSection>
          <FormSection icon="🌐" title="ช่องทางออนไลน์">
            <Field label="เว็บไซต์">
              <input value={form.website} onChange={set("website")} placeholder="https://www.company.com" className={iCls} />
            </Field>
            <Field label="LinkedIn">
              <input value={form.linkedin} onChange={set("linkedin")} placeholder="https://linkedin.com/company/..." className={iCls} />
            </Field>
          </FormSection>
          <FormSection icon="👤" title="ผู้ประสานงาน">
            <Field label="ชื่อผู้ประสานงาน">
              <input value={form.contactName} onChange={set("contactName")} placeholder="คุณ..." className={iCls} />
            </Field>
            <Field label="โทรศัพท์">
              <input value={form.contactTel} onChange={set("contactTel")} placeholder="0x-xxxx-xxxx" className={iCls} />
            </Field>
            <Field label="อีเมลติดต่อ" span2>
              <input type="email" value={form.contactEmail} onChange={set("contactEmail")} placeholder="hr@company.com" className={iCls} />
            </Field>
          </FormSection>
          <FormSection icon="📋" title="สถานะและ MOU">
            <Field label="สถานะความร่วมมือ">
              <select value={form.status} onChange={set("status")} className={sCls}>
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="ตำแหน่งฝึกงานที่เปิดรับ (คน)">
              <input type="number" min="0" value={form.openPositions} onChange={set("openPositions")} className={iCls} />
            </Field>
            <Field label="สถานะ MOU">
              <select value={form.mouStatus} onChange={set("mouStatus")} className={sCls}>
                {MOU_STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="วันหมดอายุ MOU">
              <input type="date" value={form.mouExpiry} onChange={set("mouExpiry")}
                className={iCls + (form.mouStatus !== "มี MOU" ? " opacity-40 cursor-not-allowed" : "")}
                disabled={form.mouStatus !== "มี MOU"} />
            </Field>
          </FormSection>
          <FormSection icon="📝" title="รายละเอียดเพิ่มเติม">
            <Field label="คำอธิบายบริษัท" span2>
              <textarea value={form.description} onChange={set("description")} rows={3}
                placeholder="สรุปย่อเกี่ยวกับบริษัท ธุรกิจหลัก และสาขาที่รับนักศึกษา..."
                className={iCls + " resize-none"} />
            </Field>
            <Field label="หมายเหตุ" span2>
              <input value={form.note} onChange={set("note")} placeholder="บันทึกเพิ่มเติมสำหรับ admin..." className={iCls} />
            </Field>
          </FormSection>
        </div>
        <div className="flex items-center justify-between border-t border-border px-6 py-4 shrink-0 bg-surface-muted/40">
          <p className="text-xs text-muted">* จำเป็นต้องกรอก</p>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn-secondary">ยกเลิก</button>
            <button type="submit" className="btn-primary">💾 บันทึกบริษัท</button>
          </div>
        </div>
      </form>
    </div>
  );
}

// ── Multi-delete Confirm ───────────────────────────────────────────────────────

function BulkDeleteConfirm({ count, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-surface shadow-2xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-red-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h2 className="font-bold text-foreground">ยืนยันการลบ</h2>
            <p className="text-sm text-muted mt-1">ต้องการลบ <span className="font-semibold text-foreground">{count} บริษัท</span> ที่เลือกออกจากระบบ?</p>
          </div>
          <div className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-600">⚠️ ไม่สามารถย้อนกลับได้</div>
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 btn-secondary">ยกเลิก</button>
          <button onClick={onConfirm} className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 transition-colors">ลบ {count} บริษัท</button>
        </div>
      </div>
    </div>
  );
}

// ── Empty State ────────────────────────────────────────────────────────────────

function EmptyState({ hasFilter, onClear, onAdd }) {
  return (
    <div className="card flex flex-col items-center justify-center py-20 text-center">
      <p className="text-4xl mb-3">{hasFilter ? "🔍" : "🏢"}</p>
      <p className="text-sm font-semibold text-foreground mb-1">
        {hasFilter ? "ไม่พบบริษัทที่ตรงเงื่อนไข" : "ยังไม่มีข้อมูลบริษัท"}
      </p>
      <p className="text-xs text-muted mb-4">
        {hasFilter ? "ลองเปลี่ยนคำค้นหาหรือตัวกรอง" : "เพิ่มบริษัทแรกเพื่อเริ่มต้น"}
      </p>
      {hasFilter
        ? <button onClick={onClear} className="text-sm font-medium text-primary hover:underline">ล้างตัวกรองทั้งหมด</button>
        : <button onClick={onAdd} className="btn-primary">+ เพิ่มบริษัท</button>
      }
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function CompanyListClient() {
  const router  = useRouter();
  const { companies, ready, addCompany, deleteCompany, replaceAll, updateCompany } = useCompanies();

  // ── Filters ──
  const [searchInput,    setSearchInput]    = useState("");
  const [keywords,       setKeywords]       = useState(() => loadFilters().keywords       ?? []);
  const [filterStatus,   setFilterStatus]   = useState(() => loadFilters().filterStatus   ?? "ทั้งหมด");
  const [filterIndustry, setFilterIndustry] = useState(() => loadFilters().filterIndustry ?? "ทั้งหมด");
  const [filterMOU,      setFilterMOU]      = useState(() => loadFilters().filterMOU      ?? "ทั้งหมด");

  // ── Pagination ──
  const [page,     setPage]     = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // ── Selection ──
  const [selectedIds, setSelectedIds] = useState(new Set());

  // ── Modals ──
  const [showAdd,     setShowAdd]     = useState(false);
  const [showImport,  setShowImport]  = useState(false);
  const [showBulkDel, setShowBulkDel] = useState(false);
  const [importDone,   setImportDone]   = useState(null);

  const resetPage = useCallback(() => setPage(1), []);

  useEffect(() => {
    saveFilters({ keywords, filterStatus, filterIndustry, filterMOU });
  }, [keywords, filterStatus, filterIndustry, filterMOU]);

  // ── Keyword search ──
  const addKeyword = (kw) => {
    const t = kw.trim(); if (!t) return;
    setKeywords((prev) => prev.includes(t) ? prev : [...prev, t]);
    setSearchInput(""); resetPage();
  };
  const removeKeyword = (kw) => { setKeywords((prev) => prev.filter((k) => k !== kw)); resetPage(); };

  const matchField = (c, q) => {
    const s = (v) => (v || "").toLowerCase();
    return s(c.name).includes(q) || s(c.nameEn).includes(q) ||
      s(c.industry).includes(q) || s(c.province).includes(q) ||
      s(c.contactName).includes(q) || s(c.contactEmail).includes(q) ||
      s(c.contactTel).replace(/-/g,"").includes(q.replace(/-/g,"")) ||
      s(c.status).includes(q) || s(c.mouStatus).includes(q) ||
      s(c.type).includes(q) || s(c.country).includes(q) || s(c.id).includes(q);
  };

  const filtered = companies.filter((c) => {
    const matchKw   = keywords.length === 0 || keywords.every((kw) => matchField(c, kw.toLowerCase()));
    const matchLive = !searchInput.trim() || matchField(c, searchInput.trim().toLowerCase());
    const matchSt   = filterStatus   === "ทั้งหมด" || c.status   === filterStatus;
    const matchInd  = filterIndustry === "ทั้งหมด" || c.industry === filterIndustry;
    const matchMou  = filterMOU      === "ทั้งหมด" || c.mouStatus=== filterMOU;
    return matchKw && matchLive && matchSt && matchInd && matchMou;
  });

  const hasFilter = keywords.length > 0 || filterStatus !== "ทั้งหมด" || filterIndustry !== "ทั้งหมด" || filterMOU !== "ทั้งหมด";

  const clearFilters = () => {
    setKeywords([]); setSearchInput("");
    setFilterStatus("ทั้งหมด"); setFilterIndustry("ทั้งหมด"); setFilterMOU("ทั้งหมด");
    resetPage();
  };

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd   = Math.min(safePage * pageSize, filtered.length);

  // ── Multi-select ──
  const toggleSelect = (id) => setSelectedIds((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const toggleSelectPage = () => {
    const ids = paginated.map((c) => c.id);
    const allSel = ids.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      allSel ? ids.forEach((id) => next.delete(id)) : ids.forEach((id) => next.add(id));
      return next;
    });
  };
  const clearSelection  = () => setSelectedIds(new Set());
  const allPageSelected = paginated.length > 0 && paginated.every((c) => selectedIds.has(c.id));
  const somePageSelected = paginated.some((c) => selectedIds.has(c.id)) && !allPageSelected;

  // ── Import ──
  const handleImport = (rows, mode) => {
    if (mode === "replace") {
      replaceAll(rows);
      setImportDone({ count: rows.length, mode: "replace" });
    } else {
      let added = 0, updated = 0;
      rows.forEach((r) => {
        const existing = companies.find((c) => c.id === r.id);
        if (existing) { updateCompany(r.id, r); updated++; }
        else { addCompany(r); added++; }
      });
      setImportDone({ added, updated, mode: "merge" });
    }
    setShowImport(false); resetPage();
    setTimeout(() => setImportDone(null), 4000);
  };

  // ── Bulk delete ──
  const handleBulkDelete = async () => {
    for (const id of selectedIds) await deleteCompany(id);
    clearSelection();
    setShowBulkDel(false);
  };

  const nextId = `COM-${String(
    Math.max(0, ...companies.map((c) => parseInt(c.id.replace("COM-",""), 10))) + 1
  ).padStart(3, "0")}`;

  if (!ready) return <div className="flex items-center justify-center py-24 text-muted text-sm">กำลังโหลดข้อมูล...</div>;

  return (
    <div className="space-y-5">

      {/* ── Import success banner ── */}
      {importDone && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span>
            {importDone.mode === "replace"
              ? `นำเข้าสำเร็จ — แทนที่ด้วยข้อมูลใหม่ทั้งหมด ${importDone.count} บริษัท`
              : `รวมข้อมูลสำเร็จ — เพิ่มใหม่ ${importDone.added} บริษัท, อัปเดต ${importDone.updated} บริษัท`}
          </span>
        </div>
      )}

      {/* ── Status pills ── */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: "ทั้งหมด", label: "ทั้งหมด", count: companies.length, color: "bg-surface-muted border-border text-foreground", dot: "bg-gray-400" },
          ...STATUSES.map((s) => ({ key: s, label: s, count: companies.filter((c) => c.status === s).length, ...STATUS_CONFIG[s] })),
        ].map(({ key, label, count, color, dot }) => (
          <button key={key}
            onClick={() => { setFilterStatus(filterStatus === key ? "ทั้งหมด" : key); resetPage(); }}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold transition-all ${
              filterStatus === key
                ? `${color} ring-2 ring-offset-1 ring-current`
                : "border-border bg-surface text-muted hover:border-primary hover:text-primary"
            }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
            {label}
            <span className="rounded-full bg-black/10 px-1.5 py-0.5 text-[10px] font-bold">{count}</span>
          </button>
        ))}
      </div>

      {/* ── Search + Action buttons ── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none"
              xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
            <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addKeyword(searchInput); } }}
              placeholder="ชื่อบริษัท อุตสาหกรรม จังหวัด (Enter เพื่อค้นหา)"
              className="w-full rounded-lg border border-border bg-surface pl-9 pr-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-accent-soft placeholder:text-muted" />
          </div>
          <button onClick={() => addKeyword(searchInput)} disabled={!searchInput.trim()}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            ค้นหา
          </button>
          {/* Action buttons */}
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <button onClick={() => exportCSV(filtered)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:border-primary hover:text-primary transition-colors whitespace-nowrap">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              ส่งออก CSV
            </button>
            <button onClick={() => setShowImport(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:border-primary hover:text-primary transition-colors whitespace-nowrap">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              นำเข้า CSV
            </button>
            <button onClick={() => setShowAdd(true)} className="btn-primary inline-flex items-center gap-1.5 whitespace-nowrap">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              เพิ่มบริษัท
            </button>
          </div>
        </div>

        {/* Filter dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col gap-0.5">
            <label className={labelCls}>สถานะ</label>
            <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); resetPage(); }} className={selectCls}>
              <option value="ทั้งหมด">📋 สถานะทั้งหมด</option>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-0.5">
            <label className={labelCls}>อุตสาหกรรม</label>
            <select value={filterIndustry} onChange={(e) => { setFilterIndustry(e.target.value); resetPage(); }} className={selectCls}>
              <option value="ทั้งหมด">🏭 อุตสาหกรรมทั้งหมด</option>
              {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-0.5">
            <label className={labelCls}>MOU</label>
            <select value={filterMOU} onChange={(e) => { setFilterMOU(e.target.value); resetPage(); }} className={selectCls}>
              <option value="ทั้งหมด">📄 MOU ทั้งหมด</option>
              {MOU_STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ── Active filter chips ── */}
      {hasFilter && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted">กรองด้วย:</span>
          {filterStatus !== "ทั้งหมด" && (
            <button onClick={() => { setFilterStatus("ทั้งหมด"); resetPage(); }} className={chipBase}>
              📋 {filterStatus} <XIcon />
            </button>
          )}
          {filterIndustry !== "ทั้งหมด" && (
            <button onClick={() => { setFilterIndustry("ทั้งหมด"); resetPage(); }} className={chipBase}>
              🏭 {filterIndustry} <XIcon />
            </button>
          )}
          {filterMOU !== "ทั้งหมด" && (
            <button onClick={() => { setFilterMOU("ทั้งหมด"); resetPage(); }} className={chipBase}>
              📄 {filterMOU} <XIcon />
            </button>
          )}
          {keywords.map((kw) => (
            <button key={kw} onClick={() => removeKeyword(kw)} className={chipBase}>
              🔍 &ldquo;{kw}&rdquo; <XIcon />
            </button>
          ))}
          <button onClick={clearFilters} className="text-xs font-medium text-muted hover:text-red-500 transition-colors underline underline-offset-2 ml-1">ล้างทั้งหมด</button>
        </div>
      )}

      {/* ── Selection bar ── */}
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/30 bg-accent-soft px-4 py-2.5">
          <span className="text-sm font-semibold text-primary">
            เลือกแล้ว {selectedIds.size} บริษัท
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportCSV(companies.filter((c) => selectedIds.has(c.id)), `companies_selected_${new Date().toISOString().slice(0,10)}.csv`)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground hover:border-primary hover:text-primary transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              ส่งออก CSV
            </button>
            <button
              onClick={() => setShowBulkDel(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              ลบที่เลือก
            </button>
            <button onClick={clearSelection}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted hover:text-foreground transition-colors">
              <XIcon /> ยกเลิก
            </button>
          </div>
        </div>
      )}

      {/* ── Table ── */}
      {paginated.length === 0 ? (
        <EmptyState hasFilter={hasFilter} onClear={clearFilters} onAdd={() => setShowAdd(true)} />
      ) : (
        <AdminTable
          onRowClick={(i) => router.push(`/admin/companies/${paginated[i].id}`)}
          onCellClick={(e, i, j) => {
            if (j === 0) { e.stopPropagation(); toggleSelect(paginated[i].id); }
            if (j === 9) { e.stopPropagation(); } // Actions column
          }}
          columns={[
            {
              label: (
                <input type="checkbox" checked={allPageSelected}
                  ref={(el) => { if (el) el.indeterminate = somePageSelected; }}
                  onChange={toggleSelectPage}
                  onClick={(e) => e.stopPropagation()}
                  className="h-4 w-4 cursor-pointer rounded accent-primary" />
              ),
              align: "center", width: "44px",
            },
            { label: "บริษัท",           width: "22%" },
            { label: "อุตสาหกรรม",       width: "12%" },
            { label: "ที่ตั้ง",           width: "10%" },
            { label: "ผู้ประสานงาน",     width: "13%" },
            { label: "ข้อมูลติดต่อ",     width: "16%" },
            { label: "เปิดรับ",          align: "center", width: "60px", noWrap: true },
            { label: "MOU",              width: "90px"  },
            { label: "สถานะ",            width: "100px" },
            { label: "จัดการ",           align: "center", width: "115px" },
          ]}
          rows={paginated.map((c) => {
            const stCfg = STATUS_CONFIG[c.status];
            const mouCls = MOU_CONFIG[c.mouStatus] ?? "bg-gray-100 text-gray-500 border-gray-200";
            return [
              // ── Checkbox ──
              <input key="cb" type="checkbox" checked={selectedIds.has(c.id)}
                onChange={() => toggleSelect(c.id)}
                onClick={(e) => e.stopPropagation()}
                className="h-4 w-4 cursor-pointer rounded accent-primary" />,

              // ── บริษัท ──
              <div key="name" className="min-w-0">
                <p className="font-semibold text-sm text-foreground truncate" title={c.name}>{c.name}</p>
                {c.nameEn && <p className="text-xs text-muted truncate">{c.nameEn}</p>}
                <p className="text-[10px] text-muted font-mono mt-0.5">{c.id}</p>
              </div>,

              // ── อุตสาหกรรม ──
              <div key="industry" className="min-w-0">
                <p className="text-xs text-muted truncate">{c.industry}</p>
                {c.type && <p className="text-[10px] text-muted/70 truncate mt-0.5">{c.type}</p>}
              </div>,

              // ── ที่ตั้ง ──
              <div key="loc" className="min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{c.province || "—"}</p>
                <p className="text-[10px] text-muted mt-0.5">🌏 {c.country || "ไทย"}</p>
              </div>,

              // ── ผู้ประสานงาน ──
              <p key="contact" className="text-xs text-foreground truncate">{c.contactName || "—"}</p>,

              // ── ข้อมูลติดต่อ ── (stopPropagation handled inside CopyButton)
              <div key="info" className="space-y-1" onClick={(e) => e.stopPropagation()}>
                {c.contactTel && (
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-mono text-foreground whitespace-nowrap">{c.contactTel}</span>
                    <CopyButton value={c.contactTel} />
                  </div>
                )}
                {c.contactEmail && (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted truncate max-w-[120px]">{c.contactEmail}</span>
                    <CopyButton value={c.contactEmail} />
                  </div>
                )}
                {!c.contactTel && !c.contactEmail && <span className="text-xs text-muted">—</span>}
              </div>,

              // ── เปิดรับ ──
              <span key="pos" className={`text-sm font-bold tabular-nums ${c.openPositions > 0 ? "text-primary" : "text-muted"}`}>
                {c.openPositions}
              </span>,

              // ── MOU ──
              <span key="mou" className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${mouCls}`}>
                {c.mouStatus}
              </span>,

              // ── สถานะ ──
              stCfg ? (
                <span key="status" className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${stCfg.color}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${stCfg.dot}`} />
                  {c.status}
                </span>
              ) : (
                <span key="status" className="text-xs text-muted">{c.status}</span>
              ),

              // ── Actions — CompanyActionButtons (View + Edit + Delete) ──
              <div key="actions" onClick={(e) => e.stopPropagation()}>
                <CompanyActionButtons id={c.id} name={c.name} />
              </div>,
            ];
          })}
        />
      )}

      {/* ── Footer ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-xs text-muted">
          {filtered.length === 0 ? "ไม่พบรายการ" : (
            <>
              แสดง <span className="font-semibold text-foreground">{rangeStart}–{rangeEnd}</span>{" "}
              จาก <span className="font-semibold text-foreground">{filtered.length}</span> บริษัท
              {filtered.length < companies.length && (
                <> (กรองจากทั้งหมด <span className="font-semibold text-foreground">{companies.length}</span> บริษัท)</>
              )}
            </>
          )}
        </p>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-muted">
            <span>แสดง</span>
            <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="rounded-lg border border-border bg-surface px-2 py-1.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-accent-soft">
              {PAGE_SIZE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <span>รายการต่อหน้า</span>
          </div>
          <Pagination page={safePage} totalPages={totalPages} onPage={setPage} />
        </div>
      </div>

      {/* ── Modals ── */}
      {showImport  && <ImportModal onClose={() => setShowImport(false)} onImport={handleImport} />}
      {showAdd     && <AddModal onClose={() => setShowAdd(false)} onAdd={addCompany} nextId={nextId} />}
      {showBulkDel && (
        <BulkDeleteConfirm
          count={selectedIds.size}
          onClose={() => setShowBulkDel(false)}
          onConfirm={handleBulkDelete}
        />
      )}
    </div>
  );
}
