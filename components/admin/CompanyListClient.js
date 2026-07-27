"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { useCompanies } from "./contexts/CompanyContext";

// ── Constants ──────────────────────────────────────────────────────────────────

const INDUSTRIES = [
  "ยานยนต์", "อิเล็กทรอนิกส์", "เทคโนโลยีสารสนเทศ", "เคมีและวัสดุ",
  "ก่อสร้างและโยธา", "พลังงานและสาธารณูปโภค", "อุตสาหกรรมการผลิต", "นิคมอุตสาหกรรม",
];
const STATUSES = ["ร่วมมือ", "รอดำเนินการ", "ระงับ"];
const MOU_STATUSES = ["มี MOU", "ไม่มี MOU"];
const TYPES = ["บริษัทจำกัด", "บริษัทมหาชนจำกัด", "รัฐวิสาหกิจ", "หน่วยงานวิจัย"];
const PAGE_SIZE_OPTIONS = [10, 20, 30, 50];

const STATUS_BADGE = {
  ร่วมมือ:      "bg-emerald-100 text-emerald-700",
  รอดำเนินการ:  "bg-amber-100 text-amber-700",
  ระงับ:        "bg-red-100 text-red-700",
};
const MOU_BADGE = {
  "มี MOU":    "bg-blue-100 text-blue-700",
  "ไม่มี MOU": "bg-gray-100 text-gray-500",
};

// ── CSV helpers ────────────────────────────────────────────────────────────────

const CSV_HEADERS = [
  "id", "name", "nameEn", "industry", "type", "country", "province", "address",
  "website", "linkedin", "contactName", "contactEmail", "contactTel",
  "status", "mouStatus", "mouExpiry", "openPositions", "description", "note",
];

function toCSVField(val) {
  const s = String(val ?? "");
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

function exportCSV(companies) {
  const rows = [CSV_HEADERS.join(",")];
  for (const c of companies) rows.push(CSV_HEADERS.map((k) => toCSVField(c[k])).join(","));
  const blob = new Blob(["﻿" + rows.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `companies_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function parseCSVLine(line) {
  const result = [];
  let cur = "", inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (ch === "," && !inQ) { result.push(cur); cur = ""; }
    else cur += ch;
  }
  result.push(cur);
  return result;
}

function parseCSV(text) {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter(Boolean);
  if (lines.length < 2) return [];
  const headers = parseCSVLine(lines[0]);
  return lines.slice(1).map((line) => {
    const vals = parseCSVLine(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h.trim()] = (vals[i] ?? "").trim(); });
    if (obj.openPositions) obj.openPositions = parseInt(obj.openPositions, 10) || 0;
    return obj;
  });
}

// ── Import Modal ───────────────────────────────────────────────────────────────

function ImportModal({ onClose, onImport }) {
  const [rows, setRows] = useState(null);
  const [mode, setMode] = useState("replace");
  const [error, setError] = useState("");
  const dropRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = parseCSV(e.target.result);
        if (!parsed.length) { setError("ไม่พบข้อมูลในไฟล์"); return; }
        setRows(parsed);
        setError("");
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
            <div
              ref={dropRef}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
              className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border py-12 text-center hover:border-primary hover:bg-accent-soft/10 transition-colors cursor-pointer"
              onClick={() => dropRef.current?.querySelector("input")?.click()}
            >
              <span className="text-3xl">📂</span>
              <p className="text-sm font-medium text-foreground">ลากไฟล์ CSV มาวาง หรือคลิกเพื่อเลือก</p>
              <p className="text-xs text-muted">รองรับไฟล์ .csv เท่านั้น (UTF-8 หรือ UTF-8 BOM)</p>
              <input type="file" accept=".csv" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">พบข้อมูล <span className="text-primary font-bold">{rows.length}</span> บริษัท — ตัวอย่าง 3 แถวแรก</p>
              <div className="overflow-x-auto rounded-xl border border-border text-xs">
                <table className="w-full">
                  <thead className="bg-surface-muted">
                    <tr>{["id", "name", "industry", "status", "openPositions"].map((h) => (
                      <th key={h} className="px-3 py-2 text-left text-muted font-semibold">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 3).map((r, i) => (
                      <tr key={i} className="border-t border-border">
                        {["id", "name", "industry", "status", "openPositions"].map((h) => (
                          <td key={h} className="px-3 py-2 truncate max-w-[120px]">{String(r[h] ?? "")}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-4 text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="mode" value="replace" checked={mode === "replace"} onChange={() => setMode("replace")} className="accent-primary" />
                  <span><span className="font-semibold">แทนที่ทั้งหมด</span> — ลบข้อมูลเดิมแล้วใช้ข้อมูลใหม่</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="mode" value="merge" checked={mode === "merge"} onChange={() => setMode("merge")} className="accent-primary" />
                  <span><span className="font-semibold">รวม/อัปเดต</span> — เพิ่มหรืออัปเดตตาม ID</span>
                </label>
              </div>
            </div>
          )}
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
          <button onClick={onClose} className="btn-secondary">ยกเลิก</button>
          {rows && (
            <button onClick={() => onImport(rows, mode)} className="btn-primary">
              นำเข้า {rows.length} บริษัท
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Add Company Modal ──────────────────────────────────────────────────────────

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
      <div className="p-4 grid gap-3 sm:grid-cols-2">
        {children}
      </div>
    </div>
  );
}

function Field({ label, required, span2, children }) {
  return (
    <div className={span2 ? "sm:col-span-2" : ""}>
      <label className="block text-xs font-semibold text-foreground mb-1.5">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function AddModal({ onClose, onAdd, nextId }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onAdd({ ...form, id: nextId, openPositions: parseInt(form.openPositions, 10) || 0 });
    onClose();
  };

  const inputCls = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted outline-none focus:border-primary focus:ring-2 focus:ring-accent-soft transition-colors";
  const selectCls = inputCls + " cursor-pointer";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="w-full max-w-2xl rounded-2xl bg-surface shadow-2xl flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 shrink-0">
          <div>
            <h2 className="font-bold text-foreground">เพิ่มบริษัทใหม่</h2>
            <p className="text-xs text-muted mt-0.5">รหัสที่จะได้รับ: <span className="font-mono font-semibold text-primary">{nextId}</span></p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-muted hover:bg-surface-muted hover:text-foreground transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">

          {/* ── ข้อมูลทั่วไป ── */}
          <FormSection icon="🏢" title="ข้อมูลทั่วไป">
            <Field label="ชื่อบริษัท (ภาษาไทย)" required span2>
              <input required value={form.name} onChange={set("name")} placeholder="บริษัท ..." className={inputCls} />
            </Field>
            <Field label="ชื่อบริษัท (ภาษาอังกฤษ)" span2>
              <input value={form.nameEn} onChange={set("nameEn")} placeholder="Company Name Co., Ltd." className={inputCls} />
            </Field>
            <Field label="อุตสาหกรรม">
              <select value={form.industry} onChange={set("industry")} className={selectCls}>
                {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
              </select>
            </Field>
            <Field label="ประเภทนิติบุคคล">
              <select value={form.type} onChange={set("type")} className={selectCls}>
                {TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
          </FormSection>

          {/* ── ที่ตั้ง ── */}
          <FormSection icon="📍" title="ที่ตั้ง">
            <Field label="ประเทศ">
              <input value={form.country} onChange={set("country")} placeholder="เช่น ไทย, ญี่ปุ่น, สหรัฐอเมริกา" className={inputCls} />
            </Field>
            <Field label="จังหวัด / เมือง">
              <input value={form.province} onChange={set("province")} placeholder="กรุงเทพมหานคร" className={inputCls} />
            </Field>
            <Field label="ที่อยู่เต็ม" span2>
              <input value={form.address} onChange={set("address")} placeholder="เลขที่ ถนน แขวง/ตำบล เขต/อำเภอ รหัสไปรษณีย์" className={inputCls} />
            </Field>
          </FormSection>

          {/* ── ช่องทางออนไลน์ ── */}
          <FormSection icon="🌐" title="ช่องทางออนไลน์">
            <Field label="เว็บไซต์">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-xs select-none">🔗</span>
                <input value={form.website} onChange={set("website")} placeholder="https://www.company.com" className={inputCls + " pl-8"} />
              </div>
            </Field>
            <Field label="LinkedIn">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-xs select-none">in</span>
                <input value={form.linkedin} onChange={set("linkedin")} placeholder="https://linkedin.com/company/..." className={inputCls + " pl-8"} />
              </div>
            </Field>
          </FormSection>

          {/* ── ผู้ประสานงาน ── */}
          <FormSection icon="👤" title="ผู้ประสานงาน">
            <Field label="ชื่อผู้ประสานงาน">
              <input value={form.contactName} onChange={set("contactName")} placeholder="คุณ..." className={inputCls} />
            </Field>
            <Field label="โทรศัพท์">
              <input value={form.contactTel} onChange={set("contactTel")} placeholder="0x-xxxx-xxxx" className={inputCls} />
            </Field>
            <Field label="อีเมลติดต่อ" span2>
              <input type="email" value={form.contactEmail} onChange={set("contactEmail")} placeholder="hr@company.com" className={inputCls} />
            </Field>
          </FormSection>

          {/* ── สถานะและ MOU ── */}
          <FormSection icon="📋" title="สถานะและ MOU">
            <Field label="สถานะความร่วมมือ">
              <select value={form.status} onChange={set("status")} className={selectCls}>
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="ตำแหน่งฝึกงานที่เปิดรับ (คน)">
              <input type="number" min="0" value={form.openPositions} onChange={set("openPositions")} className={inputCls} />
            </Field>
            <Field label="สถานะ MOU">
              <select value={form.mouStatus} onChange={set("mouStatus")} className={selectCls}>
                {MOU_STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="วันหมดอายุ MOU">
              <input type="date" value={form.mouExpiry} onChange={set("mouExpiry")}
                className={inputCls + (form.mouStatus !== "มี MOU" ? " opacity-40 cursor-not-allowed" : "")}
                disabled={form.mouStatus !== "มี MOU"} />
            </Field>
          </FormSection>

          {/* ── รายละเอียดเพิ่มเติม ── */}
          <FormSection icon="📝" title="รายละเอียดเพิ่มเติม">
            <Field label="คำอธิบายบริษัท" span2>
              <textarea value={form.description} onChange={set("description")} rows={3}
                placeholder="สรุปย่อเกี่ยวกับบริษัท ธุรกิจหลัก และสาขาที่รับนักศึกษา..."
                className={inputCls + " resize-none"} />
            </Field>
            <Field label="หมายเหตุ" span2>
              <input value={form.note} onChange={set("note")} placeholder="บันทึกเพิ่มเติมสำหรับ admin..." className={inputCls} />
            </Field>
          </FormSection>

        </div>

        {/* Footer */}
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

// ── Delete Confirm ─────────────────────────────────────────────────────────────

function DeleteConfirm({ company, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-surface shadow-2xl p-6 space-y-4">
        <h2 className="font-bold text-foreground">ยืนยันการลบ</h2>
        <p className="text-sm text-muted">ต้องการลบ <span className="font-semibold text-foreground">{company.name}</span> ออกจากระบบ?</p>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary">ยกเลิก</button>
          <button onClick={onConfirm} className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 transition-colors">ลบ</button>
        </div>
      </div>
    </div>
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
      <button disabled={page === 1} onClick={() => onPage(page - 1)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-sm text-muted disabled:opacity-40 hover:bg-surface-muted enabled:cursor-pointer transition-colors">‹</button>
      {pages.map((p, i) => (
        <button key={i} disabled={p === "…" || p === page} onClick={() => typeof p === "number" && onPage(p)}
          className={`flex h-8 min-w-[2rem] items-center justify-center rounded-lg border text-sm transition-colors px-2 ${p === page ? "border-primary bg-accent-soft font-bold text-primary" : p === "…" ? "border-transparent cursor-default text-muted" : "border-border text-muted hover:bg-surface-muted cursor-pointer"}`}>
          {p}
        </button>
      ))}
      <button disabled={page === totalPages} onClick={() => onPage(page + 1)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-sm text-muted disabled:opacity-40 hover:bg-surface-muted enabled:cursor-pointer transition-colors">›</button>
    </div>
  );
}

// ── Status config ──────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  ร่วมมือ:     { color: "bg-emerald-100 text-emerald-700 border-emerald-300", dot: "bg-emerald-500" },
  รอดำเนินการ: { color: "bg-amber-100 text-amber-700 border-amber-300",   dot: "bg-amber-500"   },
  ระงับ:       { color: "bg-red-100 text-red-700 border-red-300",         dot: "bg-red-500"     },
};

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);

// ── Filter persistence ─────────────────────────────────────────────────────────

const FILTER_KEY = "company-list-filters";

function loadFilters() {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(sessionStorage.getItem(FILTER_KEY)) ?? {}; }
  catch { return {}; }
}
function saveFilters(data) {
  try { sessionStorage.setItem(FILTER_KEY, JSON.stringify(data)); }
  catch { /* ignore */ }
}

// ── Copy Button ────────────────────────────────────────────────────────────────

function CopyButton({ value }) {
  const [copied, setCopied] = useState(false);
  const copy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={copy}
      title="คัดลอก"
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-border text-muted hover:border-primary hover:text-primary transition-colors"
    >
      {copied
        ? <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-emerald-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
        : <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" /><path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" /></svg>
      }
    </button>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function CompanyListClient() {
  const { companies, ready, addCompany, deleteCompany, replaceAll, updateCompany } = useCompanies();

  const [searchInput, setSearchInput] = useState("");
  const [keywords, setKeywords] = useState(() => loadFilters().keywords ?? []);
  const [filterStatus, setFilterStatus] = useState(() => loadFilters().filterStatus ?? "ทั้งหมด");
  const [filterIndustry, setFilterIndustry] = useState(() => loadFilters().filterIndustry ?? "ทั้งหมด");
  const [filterMOU, setFilterMOU] = useState(() => loadFilters().filterMOU ?? "ทั้งหมด");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [importDone, setImportDone] = useState(null);

  const resetPage = useCallback(() => setPage(1), []);

  useEffect(() => {
    saveFilters({ keywords, filterStatus, filterIndustry, filterMOU });
  }, [keywords, filterStatus, filterIndustry, filterMOU]);

  const addKeyword = (kw) => {
    const trimmed = kw.trim();
    if (!trimmed) return;
    setKeywords((prev) => prev.includes(trimmed) ? prev : [...prev, trimmed]);
    setSearchInput("");
    resetPage();
  };

  const removeKeyword = (kw) => {
    setKeywords((prev) => prev.filter((k) => k !== kw));
    resetPage();
  };

  const matchField = (c, q) => {
    const s = (v) => (v || "").toLowerCase();
    return (
      s(c.name).includes(q) || s(c.nameEn).includes(q) ||
      s(c.industry).includes(q) || s(c.province).includes(q) ||
      s(c.contactName).includes(q) || s(c.contactEmail).includes(q) ||
      s(c.contactTel).replace(/-/g, "").includes(q.replace(/-/g, "")) ||
      s(c.status).includes(q) || s(c.mouStatus).includes(q) ||
      s(c.type).includes(q) || s(c.country).includes(q)
    );
  };

  const filtered = companies.filter((c) => {
    const matchKeywords = keywords.length === 0 || keywords.every((kw) => matchField(c, kw.toLowerCase()));
    const matchLive = !searchInput.trim() || matchField(c, searchInput.trim().toLowerCase());
    const matchStatus = filterStatus === "ทั้งหมด" || c.status === filterStatus;
    const matchIndustry = filterIndustry === "ทั้งหมด" || c.industry === filterIndustry;
    const matchMOU = filterMOU === "ทั้งหมด" || c.mouStatus === filterMOU;
    return matchKeywords && matchLive && matchStatus && matchIndustry && matchMOU;
  });

  const hasActiveFilter = keywords.length > 0 || filterStatus !== "ทั้งหมด" || filterIndustry !== "ทั้งหมด" || filterMOU !== "ทั้งหมด";

  const clearFilters = () => {
    setKeywords([]); setSearchInput("");
    setFilterStatus("ทั้งหมด"); setFilterIndustry("ทั้งหมด"); setFilterMOU("ทั้งหมด");
    resetPage();
  };

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd = Math.min(safePage * pageSize, filtered.length);

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
    setShowImport(false);
    resetPage();
    setTimeout(() => setImportDone(null), 4000);
  };

  const nextId = `COM-${String(
    Math.max(0, ...companies.map((c) => parseInt(c.id.replace("COM-", ""), 10))) + 1
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
        {STATUSES.map((s) => {
          const count = companies.filter((c) => c.status === s).length;
          const cfg = STATUS_CONFIG[s];
          return (
            <button key={s}
              onClick={() => { setFilterStatus(filterStatus === s ? "ทั้งหมด" : s); resetPage(); }}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${filterStatus === s
                ? cfg.color + " ring-2 ring-offset-1 ring-current"
                : "border-border bg-surface text-muted hover:border-primary hover:text-primary"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
              {s}
              <span className="rounded-full bg-black/10 px-1.5 py-0.5 text-[10px] font-bold">{count}</span>
            </button>
          );
        })}
      </div>

      {/* ── Search + Filters ── */}
      <div className="flex flex-col gap-3">

        {/* Row 1: Search input + ค้นหา + action buttons */}
        <div className="flex items-center gap-2">
          <div className="relative w-80 shrink-0">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none"
              xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addKeyword(searchInput); } }}
              placeholder="ชื่อบริษัท / จังหวัด / คีย์เวิร์ด แล้วกด Enter"
              className="w-full rounded-lg border border-border bg-surface pl-9 pr-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-accent-soft placeholder:text-muted"
            />
          </div>
          <button
            onClick={() => addKeyword(searchInput)}
            disabled={!searchInput.trim()}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
            ค้นหา
          </button>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <button onClick={() => exportCSV(filtered)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:border-primary hover:text-primary transition-colors whitespace-nowrap">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
              ส่งออก CSV
            </button>
            <button onClick={() => setShowImport(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:border-primary hover:text-primary transition-colors whitespace-nowrap">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
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

        {/* Row 2: filter dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); resetPage(); }}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-accent-soft">
            <option value="ทั้งหมด">📋 สถานะทั้งหมด</option>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <select value={filterIndustry} onChange={(e) => { setFilterIndustry(e.target.value); resetPage(); }}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-accent-soft">
            <option value="ทั้งหมด">🏭 อุตสาหกรรมทั้งหมด</option>
            {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
          </select>
          <select value={filterMOU} onChange={(e) => { setFilterMOU(e.target.value); resetPage(); }}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-accent-soft">
            <option value="ทั้งหมด">📄 MOU ทั้งหมด</option>
            {MOU_STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* ── Active filter chips ── */}
      {hasActiveFilter && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted">กรองด้วย:</span>
          {filterStatus !== "ทั้งหมด" && (
            <button onClick={() => { setFilterStatus("ทั้งหมด"); resetPage(); }}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-accent-soft px-2.5 py-1 text-xs font-semibold text-primary hover:border-red-400 hover:bg-red-50 hover:text-red-500 transition-colors">
              📋 {filterStatus}<XIcon />
            </button>
          )}
          {filterIndustry !== "ทั้งหมด" && (
            <button onClick={() => { setFilterIndustry("ทั้งหมด"); resetPage(); }}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-accent-soft px-2.5 py-1 text-xs font-semibold text-primary hover:border-red-400 hover:bg-red-50 hover:text-red-500 transition-colors">
              🏭 {filterIndustry}<XIcon />
            </button>
          )}
          {filterMOU !== "ทั้งหมด" && (
            <button onClick={() => { setFilterMOU("ทั้งหมด"); resetPage(); }}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-accent-soft px-2.5 py-1 text-xs font-semibold text-primary hover:border-red-400 hover:bg-red-50 hover:text-red-500 transition-colors">
              📄 {filterMOU}<XIcon />
            </button>
          )}
          {keywords.map((kw) => (
            <button key={kw} onClick={() => removeKeyword(kw)}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-accent-soft px-2.5 py-1 text-xs font-semibold text-primary hover:border-red-400 hover:bg-red-50 hover:text-red-500 transition-colors">
              🔍 &ldquo;{kw}&rdquo;<XIcon />
            </button>
          ))}
          <button onClick={clearFilters} className="text-xs font-medium text-muted hover:text-red-500 transition-colors underline underline-offset-2 ml-1">ล้างทั้งหมด</button>
        </div>
      )}

      {/* ── Table ── */}
      <div className="overflow-hidden rounded-xl border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-muted">
                <th className="px-3 py-3 text-left text-xs font-semibold text-muted whitespace-nowrap">บริษัท</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-muted whitespace-nowrap">อุตสาหกรรม</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-muted whitespace-nowrap">ที่ตั้ง</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-muted whitespace-nowrap">ผู้ประสานงาน</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-muted whitespace-nowrap">ข้อมูลติดต่อ</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-muted whitespace-nowrap">เปิดรับ</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-muted whitespace-nowrap">MOU</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-muted whitespace-nowrap">สถานะ</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-muted whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center">
                    <p className="text-2xl mb-2">🔍</p>
                    <p className="text-sm font-medium text-foreground">ไม่พบข้อมูลบริษัท</p>
                    <p className="text-xs text-muted mt-1">ลองเปลี่ยนคำค้นหาหรือตัวกรอง</p>
                    {hasActiveFilter && (
                      <button onClick={clearFilters} className="mt-4 text-sm font-medium text-primary hover:underline">
                        ล้างตัวกรองทั้งหมด
                      </button>
                    )}
                  </td>
                </tr>
              ) : paginated.map((c, i) => (
                <tr key={c.id} className={`border-b border-border last:border-0 hover:bg-surface-muted/40 transition-colors ${i % 2 !== 0 ? "bg-surface-muted/20" : ""}`}>
                  <td className="px-3 py-3 max-w-[180px]">
                    <Link href={`/admin/companies/${c.id}`} className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-1 text-sm">
                      {c.name}
                    </Link>
                    {c.nameEn && <p className="text-xs text-muted truncate">{c.nameEn}</p>}
                  </td>
                  <td className="px-3 py-3 max-w-[120px]">
                    <p className="truncate text-xs text-muted">{c.industry}</p>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <p className="text-xs text-foreground">{c.province}</p>
                    <p className="text-xs font-medium text-primary/70 mt-0.5">
                      🌏 {c.country || "ไทย"}
                    </p>
                  </td>
                  <td className="px-3 py-3 max-w-[120px]">
                    <p className="truncate text-xs text-foreground">{c.contactName || "—"}</p>
                  </td>
                  <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="space-y-1">
                      {c.contactTel && (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-foreground font-mono whitespace-nowrap">{c.contactTel}</span>
                          <CopyButton value={c.contactTel} />
                        </div>
                      )}
                      {c.contactEmail && (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted truncate max-w-[130px]">{c.contactEmail}</span>
                          <CopyButton value={c.contactEmail} />
                        </div>
                      )}
                      {!c.contactTel && !c.contactEmail && <span className="text-xs text-muted">—</span>}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={`text-sm font-bold ${c.openPositions > 0 ? "text-primary" : "text-muted"}`}>{c.openPositions}</span>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${MOU_BADGE[c.mouStatus] ?? "bg-gray-100 text-gray-500"}`}>
                      {c.mouStatus}
                    </span>
                    {c.mouStatus === "มี MOU" && c.mouExpiry && (
                      <p className="text-[10px] text-muted mt-0.5 whitespace-nowrap">ถึง {c.mouExpiry}</p>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${STATUS_BADGE[c.status] ?? "bg-gray-100 text-gray-500"}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <Link href={`/admin/companies/${c.id}`}
                        title="ดูรายละเอียด"
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted hover:border-primary hover:text-primary transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                      </Link>
                      <Link href={`/admin/companies/${c.id}/edit`}
                        title="แก้ไข"
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted hover:border-amber-500 hover:text-amber-500 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </Link>
                      <button onClick={() => setDeleteTarget(c)}
                        title="ลบ"
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted hover:border-red-500 hover:text-red-500 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
      {showImport && <ImportModal onClose={() => setShowImport(false)} onImport={handleImport} />}
      {showAdd && <AddModal onClose={() => setShowAdd(false)} onAdd={addCompany} nextId={nextId} />}
      {deleteTarget && (
        <DeleteConfirm
          company={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => { deleteCompany(deleteTarget.id); setDeleteTarget(null); }}
        />
      )}
    </div>
  );
}
