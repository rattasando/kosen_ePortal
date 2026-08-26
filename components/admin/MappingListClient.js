"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminTable from "@/components/admin/ui/AdminTable";
import { useMappings } from "./contexts/MappingContext";
import { useStudents } from "./contexts/StudentContext";
import { useJobs } from "./contexts/JobContext";
import { useInternships } from "./contexts/InternshipContext";
import { useLanguage } from "./contexts/LanguageContext";
import ConfirmDeleteModal from "@/components/admin/ui/ConfirmDeleteModal";

// ── Constants ─────────────────────────────────────────────────
const MAPPING_STATUSES = ["สมัครแล้ว", "ผ่านการคัดเลือก", "ไม่ผ่านการคัดเลือก"];
const JOB_TYPES  = ["ฝึกงาน", "งานประจำ"];
const JOB_FIELDS = [
  "วิศวกรรมคอมพิวเตอร์", "วิศวกรรมเครื่องกล", "วิศวกรรมไฟฟ้า",
  "วิศวกรรมอุตสาหการ", "วิศวกรรมเมคคาทรอนิกส์", "วิศวกรรมโยธา",
  "วิศวกรรมเคมี", "การออกแบบอุตสาหกรรม",
];
const UNIVERSITIES      = ["KOSEN-KMUTT", "KOSEN-KMITL", "KOSEN-Chulabhorn"];
const PAGE_SIZE_OPTIONS = [10, 20, 30, 50];

const STATUS_CONFIG = {
  สมัครแล้ว:          { color: "bg-blue-100 text-blue-700 border-blue-200",          dot: "bg-blue-500" },
  ผ่านการคัดเลือก:    { color: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  ไม่ผ่านการคัดเลือก: { color: "bg-red-100 text-red-700 border-red-200",             dot: "bg-red-500" },
};

const UNIV_BADGE = {
  "KOSEN-KMUTT":       "bg-blue-50 text-blue-700 border-blue-200",
  "KOSEN-KMITL":       "bg-violet-50 text-violet-700 border-violet-200",
  "KOSEN-Chulabhorn":  "bg-rose-50 text-rose-700 border-rose-200",
};

const INTERNSHIP_STATUSES = ["อยู่ในระหว่างฝึกงาน", "เสร็จสิ้น", "ยกเลิก"];
const INTERNSHIP_BADGE_CONFIG = {
  "อยู่ในระหว่างฝึกงาน": { color: "bg-sky-100 text-sky-700 border-sky-200",              dot: "bg-sky-500",     label: "กำลังฝึกงาน" },
  "เสร็จสิ้น":           { color: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", label: "ฝึกงานเสร็จสิ้น" },
  "ยกเลิก":              { color: "bg-red-100 text-red-700 border-red-200",             dot: "bg-red-500",     label: "ยกเลิกการฝึกงาน" },
};

const TYPE_BADGE = {
  ฝึกงาน:   "bg-sky-50 text-sky-700 border-sky-200",
  งานประจำ: "bg-violet-50 text-violet-700 border-violet-200",
};

const inputCls  = "w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-accent-soft placeholder:text-muted";
const selectCls = "rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-accent-soft";
const labelCls  = "text-xs font-medium text-foreground";
const chipBase  = "inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-accent-soft px-2.5 py-1 text-xs font-semibold text-primary hover:border-red-400 hover:bg-red-50 hover:text-red-500 transition-colors";

// ── CSV helpers ───────────────────────────────────────────────
const CSV_HEADERS = ["id", "studentId", "jobId", "status", "appliedDate", "note"];

function toCSVField(val) {
  const s = String(val ?? "");
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

function exportCSV(mappings, students, jobs) {
  const rows = [
    [...CSV_HEADERS, "studentName", "jobTitle", "companyName"].join(","),
    ...mappings.map(m => {
      const s = students.find(x => x.id === m.studentId);
      const j = jobs.find(x => x.id === m.jobId);
      return [
        ...CSV_HEADERS.map(h => toCSVField(m[h])),
        toCSVField(s ? `${s.prefix}${s.name} ${s.lastname}` : ""),
        toCSVField(j?.title ?? ""),
        toCSVField(j?.companyName ?? ""),
      ].join(",");
    }),
  ];
  const blob = new Blob(["﻿" + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = `applications_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

function parseCSVLine(line) {
  const values = []; let cur = "", inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { if (inQ && line[i+1] === '"') { cur += '"'; i++; } else inQ = !inQ; }
    else if (ch === "," && !inQ) { values.push(cur); cur = ""; }
    else cur += ch;
  }
  values.push(cur); return values;
}

function parseCSV(text) {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter(l => l.trim());
  if (lines.length < 2) return { error: "ไฟล์ว่างหรือไม่มีข้อมูล" };
  const headers = parseCSVLine(lines[0]).map(h => h.trim());
  const missing = ["studentId", "jobId"].filter(r => !headers.includes(r));
  if (missing.length) return { error: `ไม่พบคอลัมน์ที่จำเป็น: ${missing.join(", ")}` };
  const rows = lines.slice(1).map(line => {
    const vals = parseCSVLine(line);
    const obj  = {};
    headers.forEach((h, i) => { obj[h] = vals[i] ?? ""; });
    return obj;
  }).filter(r => r.studentId?.trim() && r.jobId?.trim());
  if (!rows.length) return { error: "ไม่พบข้อมูล Mapping ที่ถูกต้องในไฟล์" };
  return { rows };
}

// ── Filter persistence ────────────────────────────────────────
const FILTER_KEY = "mapping-list-filters";
function loadFilters() {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(sessionStorage.getItem(FILTER_KEY)) ?? {}; }
  catch { return {}; }
}
function saveFilters(data) {
  try { sessionStorage.setItem(FILTER_KEY, JSON.stringify(data)); }
  catch { /* ignore */ }
}

// ── Helpers ───────────────────────────────────────────────────
function formatDate(str) {
  if (!str) return "—";
  const d = new Date(str);
  if (isNaN(d)) return str;
  return d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}
function nextId(mappings) {
  const nums = mappings.map(m => parseInt(m.id.replace("MAP-", ""), 10)).filter(Boolean);
  return `MAP-${String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3, "0")}`;
}

// ── Highlight matching text ───────────────────────────────────
function HighlightText({ text, terms }) {
  if (!text || !terms.length) return <>{text}</>;
  const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const parts = text.split(new RegExp(`(${escaped.join("|")})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="rounded bg-amber-100 text-amber-800 px-0.5 not-italic">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

// ── Searchable picker ─────────────────────────────────────────
function SearchPicker({ label, required, placeholder, items, renderItem, renderSelected,
  value, onChange, filterFn }) {
  const [query, setQuery]   = useState("");
  const [open, setOpen]     = useState(false);
  const ref                 = useRef(null);
  const selected            = value ? items.find(i => i.id === value) : null;

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return items.slice(0, 50);
    return items.filter(item => filterFn(item, query.toLowerCase())).slice(0, 50);
  }, [items, query, filterFn]);

  return (
    <div className="space-y-1.5" ref={ref}>
      <label className="flex items-center gap-1 text-xs font-medium text-foreground">
        {label}{required && <span className="text-red-500">*</span>}
      </label>
      {selected ? (
        <div className="flex items-start gap-2 rounded-xl border border-primary bg-accent-soft/40 px-3 py-2">
          <div className="flex-1 min-w-0">{renderSelected(selected)}</div>
          <button type="button" onClick={() => { onChange(""); setQuery(""); }}
            className="mt-0.5 shrink-0 flex h-5 w-5 items-center justify-center rounded-full hover:bg-primary/20 text-primary/60 hover:text-primary transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      ) : (
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none"
            xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
          <input type="text" value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            className="w-full rounded-xl border border-border bg-surface pl-9 pr-4 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-accent-soft placeholder:text-muted" />
          {open && (
            <div className="absolute z-20 mt-1 w-full rounded-xl border border-border bg-surface shadow-lg overflow-hidden">
              {filtered.length === 0 ? (
                <div className="px-4 py-3 text-xs text-muted text-center">ไม่พบรายการ</div>
              ) : (
                <div className="max-h-52 overflow-y-auto divide-y divide-border">
                  {filtered.map(item => (
                    <button key={item.id} type="button"
                      className="w-full px-3 py-2.5 text-left hover:bg-accent-soft/50 transition-colors"
                      onMouseDown={e => { e.preventDefault(); onChange(item.id); setOpen(false); setQuery(""); }}>
                      {renderItem(item)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Import Modal ──────────────────────────────────────────────
function ImportModal({ onClose, onConfirm }) {
  const [step, setStep]     = useState("upload");
  const [parsed, setParsed] = useState(null);
  const [mode, setMode]     = useState("merge");
  const [error, setError]   = useState("");
  const fileRef             = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    if (!file.name.endsWith(".csv")) { setError("กรุณาเลือกไฟล์ .csv เท่านั้น"); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = parseCSV(e.target.result);
      if (result.error) { setError(result.error); return; }
      setParsed(result); setError(""); setStep("preview");
    };
    reader.readAsText(file, "UTF-8");
  };

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">นำเข้าข้อมูล Mapping</p>
              <p className="text-xs text-muted">{step === "upload" ? "เลือกไฟล์ CSV" : `พบข้อมูล ${parsed?.rows.length} รายการ`}</p>
            </div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-surface-muted hover:text-foreground transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        <div className="p-5">
          {step === "upload" ? (
            <div className="space-y-4">
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => handleFile(e.target.files[0])} />
              <div className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border py-10 hover:border-primary hover:bg-accent-soft/30 transition-colors"
                onClick={() => fileRef.current?.click()}
                onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
                onDragOver={e => e.preventDefault()}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">ลากไฟล์มาวางที่นี่ หรือ <span className="text-primary underline">คลิกเพื่อเลือกไฟล์</span></p>
                  <p className="mt-1 text-xs text-muted">รองรับเฉพาะไฟล์ .csv (UTF-8)</p>
                </div>
              </div>
              {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>}
              <div className="rounded-lg bg-surface-muted px-4 py-3 text-xs text-muted">
                <p className="font-semibold text-foreground mb-1">คอลัมน์ที่รองรับ</p>
                <p className="font-mono">id, studentId, jobId, status, appliedDate, note</p>
                <p className="mt-1">คอลัมน์บังคับ: <span className="font-semibold text-foreground">studentId, jobId</span></p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "merge",   label: "รวมข้อมูล",    desc: "เพิ่มรายการใหม่ / อัปเดตรายการที่มี ID ซ้ำ" },
                  { value: "replace", label: "แทนที่ทั้งหมด", desc: "ลบข้อมูลเดิมทั้งหมดแล้วใช้ข้อมูลใหม่" },
                ].map(opt => (
                  <button key={opt.value} type="button" onClick={() => setMode(opt.value)}
                    className={`rounded-xl border p-3 text-left transition-all ${mode === opt.value ? "border-primary bg-accent-soft ring-2 ring-primary/20" : "border-border hover:border-primary"}`}>
                    <p className="text-sm font-semibold text-foreground">{opt.label}</p>
                    <p className="text-xs text-muted mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>
              <div className="overflow-hidden rounded-xl border border-border">
                <div className="border-b border-border bg-surface-muted px-4 py-2 text-xs font-semibold text-muted">ตัวอย่างข้อมูล (5 รายการแรก)</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border">
                        {["รหัส", "นักเรียน", "ตำแหน่งงาน", "สถานะ", "วันที่สมัคร"].map(h => (
                          <th key={h} className="px-3 py-2 text-left font-semibold text-muted">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {parsed.rows.slice(0, 5).map((row, i) => (
                        <tr key={i} className="border-b border-border last:border-0">
                          <td className="px-3 py-2 font-mono text-muted">{row.id || "—"}</td>
                          <td className="px-3 py-2 text-foreground">{row.studentId}</td>
                          <td className="px-3 py-2 text-muted">{row.jobId}</td>
                          <td className="px-3 py-2 text-muted">{row.status || "สมัครแล้ว"}</td>
                          <td className="px-3 py-2 text-muted">{row.appliedDate || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parsed.rows.length > 5 && (
                  <div className="border-t border-border bg-surface-muted px-4 py-2 text-xs text-muted">และอีก {parsed.rows.length - 5} รายการ</div>
                )}
              </div>
              <div className="flex items-center justify-between pt-1">
                <button type="button" onClick={() => { setStep("upload"); setParsed(null); }}
                  className="text-sm text-muted hover:text-foreground transition-colors">← เลือกไฟล์ใหม่</button>
                <div className="flex gap-2">
                  <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors">ยกเลิก</button>
                  <button type="button" onClick={() => { onConfirm(parsed.rows, mode); onClose(); }} className="btn-primary">
                    {mode === "replace" ? `แทนที่ด้วย ${parsed.rows.length} รายการ` : `รวม ${parsed.rows.length} รายการ`}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Add Mapping Modal (improved) ──────────────────────────────
function AddMappingModal({ students, jobs, mappings, activeTab, onClose, onConfirm }) {
  const { t } = useLanguage();
  const tabJobTypes = activeTab === "ฝึกงาน"
    ? ["ฝึกงาน"]
    : activeTab === "งานประจำ"
      ? ["งานประจำ"]
      : JOB_TYPES;

  const [studentId, setStudentId]     = useState("");
  const [jobId, setJobId]             = useState("");
  const [jobTypeFilter, setJobTypeFilter] = useState(tabJobTypes.length === 1 ? tabJobTypes[0] : "ทั้งหมด");
  const [status, setStatus]           = useState("สมัครแล้ว");
  const [appliedDate, setAppliedDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote]               = useState("");

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const duplicate = studentId && jobId &&
    mappings.some(m => m.studentId === studentId && m.jobId === jobId);
  const isValid = studentId && jobId && !duplicate;

  // student mappings summary
  const studentMappings = useMemo(() =>
    studentId ? mappings.filter(m => m.studentId === studentId) : [],
    [studentId, mappings]
  );

  // selected objects
  const selectedStudent = students.find(s => s.id === studentId);
  const selectedJob     = jobs.find(j => j.id === jobId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-surface shadow-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-lg">🔗</div>
            <div>
              <p className="text-sm font-semibold text-foreground">{t("modal.add.title")}</p>
              <p className="text-xs text-muted">{t("mapping.desc")}</p>
            </div>
          </div>
          <button type="button" onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-surface-muted hover:text-foreground transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-5">

          {/* ── Student picker ── */}
          <div className="rounded-xl border border-border p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("modal.section.student")}</p>
            <SearchPicker
              label="เลือกนักเรียน" required
              placeholder="พิมพ์ชื่อ, รหัส, หรือมหาวิทยาลัย..."
              items={students}
              value={studentId}
              onChange={setStudentId}
              filterFn={(s, q) => [s.id, s.name, s.lastname, s.nameEn, s.lastnameEn, s.nickname, s.university, s.major]
                .some(v => String(v ?? "").toLowerCase().includes(q))}
              renderItem={(s) => {
                const stuMaps  = mappings.filter(m => m.studentId === s.id);
                const hasActive = stuMaps.some(m => ["สมัครแล้ว", "ผ่านการคัดเลือก"].includes(m.status));
                return (
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{s.prefix}{s.name} {s.lastname}</p>
                      <p className="text-xs text-muted">{s.id} · {s.university}</p>
                      {s.major && <p className="text-[10px] text-muted/70">{s.major} ปี {s.year}</p>}
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1">
                      {stuMaps.length > 0 ? (
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${hasActive ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-gray-100 text-gray-500 border-gray-200"}`}>
                          {stuMaps.length} mapping
                        </span>
                      ) : (
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">ยังไม่มี</span>
                      )}
                    </div>
                  </div>
                );
              }}
              renderSelected={(s) => (
                <div>
                  <p className="text-sm font-semibold text-foreground">{s.prefix}{s.name} {s.lastname}</p>
                  <p className="text-xs text-muted">{s.id} · {s.university} · {s.major}</p>
                </div>
              )}
            />

            {/* Student's existing mappings summary */}
            {selectedStudent && studentMappings.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                <p className="text-xs font-semibold text-amber-700 mb-1.5">⚠️ นักเรียนคนนี้มี Mapping อยู่แล้ว {studentMappings.length} รายการ</p>
                <div className="space-y-1">
                  {studentMappings.map(m => {
                    const j   = jobs.find(x => x.id === m.jobId);
                    const cfg = STATUS_CONFIG[m.status] ?? STATUS_CONFIG["สมัครแล้ว"];
                    return (
                      <div key={m.id} className="flex items-center justify-between gap-2">
                        <p className="text-[11px] text-amber-800 truncate">{j?.title ?? m.jobId} — {j?.companyName}</p>
                        <span className={`shrink-0 inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${cfg.color}`}>
                          <span className={`h-1 w-1 rounded-full ${cfg.dot}`} />{m.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ── Job picker ── */}
          <div className="rounded-xl border border-border p-4 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">💼 ตำแหน่งงาน</p>
              {tabJobTypes.length > 1 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {["ทั้งหมด", ...tabJobTypes].map(t => (
                    <button key={t} type="button" onClick={() => { setJobTypeFilter(t); setJobId(""); }}
                      className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition-all ${
                        jobTypeFilter === t
                          ? t === "ทั้งหมด"
                            ? "border-primary bg-primary text-white"
                            : `${TYPE_BADGE[t] ?? ""} border-current ring-1 ring-offset-1 ring-current`
                          : "border-border text-muted hover:border-primary hover:text-primary bg-surface"
                      }`}>
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <SearchPicker
              label="เลือกตำแหน่งงาน" required
              placeholder="พิมพ์ชื่อตำแหน่ง, บริษัท, หรือสาขา..."
              items={jobTypeFilter === "ทั้งหมด" ? jobs.filter(j => tabJobTypes.includes(j.type)) : jobs.filter(j => j.type === jobTypeFilter)}
              value={jobId}
              onChange={setJobId}
              filterFn={(j, q) => [j.id, j.title, j.titleEn, j.companyName, j.field, j.type, j.location]
                .some(v => String(v ?? "").toLowerCase().includes(q))}
              renderItem={(j) => {
                const slotsFull = j.slots > 0 && j.applications >= j.slots;
                return (
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{j.title}</p>
                      <p className="text-xs text-muted truncate">{j.companyName}</p>
                      <p className="text-[10px] text-muted/70">{j.field} · {j.location}</p>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1">
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${TYPE_BADGE[j.type] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>{j.type}</span>
                      {j.slots > 0 && (
                        <span className={`text-[10px] font-medium ${slotsFull ? "text-red-500" : "text-emerald-600"}`}>
                          {j.applications}/{j.slots} คน
                        </span>
                      )}
                    </div>
                  </div>
                );
              }}
              renderSelected={(j) => (
                <div>
                  <p className="text-sm font-semibold text-foreground">{j.title}</p>
                  <p className="text-xs text-muted">{j.companyName} · {j.field}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${TYPE_BADGE[j.type] ?? ""}`}>{j.type}</span>
                    {j.slots > 0 && <span className="text-[10px] text-muted">รับ {j.slots} คน (สมัคร {j.applications} คน)</span>}
                  </div>
                </div>
              )}
            />

            {/* Duplicate warning */}
            {duplicate && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-600">
                ⚠️ นักเรียนคนนี้มี Mapping กับตำแหน่งนี้อยู่แล้ว
              </div>
            )}
          </div>

          {/* ── Status grid ── */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-foreground">
              สถานะ <span className="text-muted font-normal">(default: สมัครแล้ว)</span>
            </p>
            <div className="grid grid-cols-3 gap-2">
              {MAPPING_STATUSES.map(s => {
                const cfg = STATUS_CONFIG[s];
                return (
                  <button key={s} type="button" onClick={() => setStatus(s)}
                    className={`rounded-xl border p-2.5 text-left transition-all ${status === s ? `${cfg.color} border-current ring-2 ring-offset-1 ring-current` : "border-border hover:border-primary"}`}>
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 shrink-0 rounded-full ${cfg.dot}`} />
                      <span className="text-xs font-medium leading-tight">{s}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Date + Note ── */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">วันที่สมัคร</label>
              <input type="date" value={appliedDate} onChange={e => setAppliedDate(e.target.value)} className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">หมายเหตุ</label>
              <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
                placeholder="บันทึกเพิ่มเติม..." className={inputCls + " resize-none"} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4 shrink-0">
          <button type="button" onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors">
            {t("common.cancel")}
          </button>
          <button type="button" disabled={!isValid}
            onClick={() => { onConfirm({ studentId, jobId, status, appliedDate, note }); onClose(); }}
            className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed">
            {t("modal.confirmAdd")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Edit Mapping Modal ────────────────────────────────────────
function EditMappingModal({ mapping, students, jobs, mappings, activeTab, onClose, onConfirm }) {
  const { t } = useLanguage();
  const { internships, addInternship, updateInternship } = useInternships();

  const tabJobTypes = activeTab === "ฝึกงาน"
    ? ["ฝึกงาน"]
    : activeTab === "งานประจำ"
      ? ["งานประจำ"]
      : JOB_TYPES;

  const [studentId, setStudentId]         = useState(mapping.studentId);
  const [jobId, setJobId]                 = useState(mapping.jobId);
  const [jobTypeFilter, setJobTypeFilter] = useState(tabJobTypes.length === 1 ? tabJobTypes[0] : "ทั้งหมด");
  const [status, setStatus]               = useState(mapping.status ?? "สมัครแล้ว");
  const [appliedDate, setAppliedDate]     = useState(mapping.appliedDate ?? new Date().toISOString().slice(0, 10));
  const [note, setNote]                   = useState(mapping.note ?? "");

  const linkedInternship = internships.find(i => i.applicationId === mapping.id) ?? null;
  const emptyIntern = { startDate: "", endDate: "", supervisorName: "", advisorName: "", status: "อยู่ในระหว่างฝึกงาน", grade: "", note: "" };
  const [internForm, setInternForm]   = useState(() => linkedInternship ? {
    startDate:      linkedInternship.startDate      ?? "",
    endDate:        linkedInternship.endDate        ?? "",
    supervisorName: linkedInternship.supervisorName ?? "",
    advisorName:    linkedInternship.advisorName    ?? "",
    status:         linkedInternship.status         ?? "อยู่ในระหว่างฝึกงาน",
    grade:          linkedInternship.grade          ?? "",
    note:           linkedInternship.note           ?? "",
  } : emptyIntern);
  const [showInternSection, setShowInternSection] = useState(!!linkedInternship);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // exclude self from duplicate check
  const duplicate = studentId && jobId &&
    mappings.some(m => m.id !== mapping.id && m.studentId === studentId && m.jobId === jobId);
  const isValid = studentId && jobId && !duplicate;

  const studentMappings = useMemo(() =>
    studentId ? mappings.filter(m => m.studentId === studentId && m.id !== mapping.id) : [],
    [studentId, mappings, mapping.id]
  );

  // original references (frozen at open time)
  const origStudent = students.find(s => s.id === mapping.studentId);
  const origJob     = jobs.find(j => j.id === mapping.jobId);
  const origStatus  = mapping.status ?? "สมัครแล้ว";
  const origCfg     = STATUS_CONFIG[origStatus] ?? STATUS_CONFIG["สมัครแล้ว"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-surface shadow-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-lg">✏️</div>
            <div>
              <p className="text-sm font-semibold text-foreground">{t("modal.edit.title")}</p>
              <p className="text-xs text-muted font-mono">{mapping.id}</p>
            </div>
          </div>
          <button type="button" onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-surface-muted hover:text-foreground transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Original data reference bar */}
        <div className="border-b border-border bg-surface-muted px-5 py-3 shrink-0">
          <div className="flex items-center justify-between gap-2 mb-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">ข้อมูลเดิม (อ้างอิง)</p>
            <button type="button"
              onClick={() => {
                setStudentId(mapping.studentId);
                setJobId(mapping.jobId);
                setStatus(mapping.status ?? "สมัครแล้ว");
                setAppliedDate(mapping.appliedDate ?? new Date().toISOString().slice(0, 10));
                setNote(mapping.note ?? "");
                setJobTypeFilter("ทั้งหมด");
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1 text-[11px] font-medium text-muted hover:border-primary hover:text-primary transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              คืนค่าเดิม
            </button>
          </div>
          <div className="flex items-start gap-4 flex-wrap">
            <div className="flex items-start gap-2 min-w-0">
              <span className="mt-0.5 text-xs text-muted shrink-0">👤</span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground">
                  {origStudent ? `${origStudent.prefix}${origStudent.name} ${origStudent.lastname}` : mapping.studentId}
                </p>
                {origStudent && <p className="text-[10px] text-muted">{origStudent.id} · {origStudent.university}</p>}
              </div>
            </div>
            <div className="text-muted self-center text-sm shrink-0">→</div>
            <div className="flex items-start gap-2 min-w-0 flex-1">
              <span className="mt-0.5 text-xs text-muted shrink-0">💼</span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">
                  {origJob ? origJob.title : mapping.jobId}
                </p>
                {origJob && <p className="text-[10px] text-muted truncate">{origJob.companyName} · {origJob.type}</p>}
              </div>
            </div>
            <span className={`shrink-0 self-center inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${origCfg.color}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${origCfg.dot}`} />{origStatus}
            </span>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-5">

          {/* ── Student picker ── */}
          <div className="rounded-xl border border-border p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("modal.section.student")}</p>
            <SearchPicker
              label="เลือกนักเรียน" required
              placeholder="พิมพ์ชื่อ, รหัส, หรือมหาวิทยาลัย..."
              items={students}
              value={studentId}
              onChange={setStudentId}
              filterFn={(s, q) => [s.id, s.name, s.lastname, s.nameEn, s.lastnameEn, s.nickname, s.university, s.major]
                .some(v => String(v ?? "").toLowerCase().includes(q))}
              renderItem={(s) => {
                const stuMaps   = mappings.filter(m => m.studentId === s.id && m.id !== mapping.id);
                const hasActive = stuMaps.some(m => ["สมัครแล้ว", "ผ่านการคัดเลือก"].includes(m.status));
                return (
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{s.prefix}{s.name} {s.lastname}</p>
                      <p className="text-xs text-muted">{s.id} · {s.university}</p>
                      {s.major && <p className="text-[10px] text-muted/70">{s.major} ปี {s.year}</p>}
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1">
                      {stuMaps.length > 0 ? (
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${hasActive ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-gray-100 text-gray-500 border-gray-200"}`}>
                          {stuMaps.length} mapping
                        </span>
                      ) : (
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">ยังไม่มี</span>
                      )}
                    </div>
                  </div>
                );
              }}
              renderSelected={(s) => (
                <div>
                  <p className="text-sm font-semibold text-foreground">{s.prefix}{s.name} {s.lastname}</p>
                  <p className="text-xs text-muted">{s.id} · {s.university} · {s.major}</p>
                </div>
              )}
            />
            {studentMappings.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                <p className="text-xs font-semibold text-amber-700 mb-1.5">⚠️ นักเรียนคนนี้มี Mapping อื่นอยู่ {studentMappings.length} รายการ</p>
                <div className="space-y-1">
                  {studentMappings.map(m => {
                    const j   = jobs.find(x => x.id === m.jobId);
                    const cfg = STATUS_CONFIG[m.status] ?? STATUS_CONFIG["สมัครแล้ว"];
                    return (
                      <div key={m.id} className="flex items-center justify-between gap-2">
                        <p className="text-[11px] text-amber-800 truncate">{j?.title ?? m.jobId} — {j?.companyName}</p>
                        <span className={`shrink-0 inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${cfg.color}`}>
                          <span className={`h-1 w-1 rounded-full ${cfg.dot}`} />{m.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ── Job / Status / Detail ── */}
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="border-b border-border bg-surface-muted px-4 py-2.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("modal.section.job")}</p>
            </div>
            <div className="p-4 space-y-4">
              {/* Job picker */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <label className="text-xs font-medium text-foreground">ตำแหน่งงาน <span className="text-red-500">*</span></label>
                  {tabJobTypes.length > 1 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {["ทั้งหมด", ...tabJobTypes].map(t => (
                        <button key={t} type="button" onClick={() => { setJobTypeFilter(t); setJobId(""); }}
                          className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition-all ${
                            jobTypeFilter === t
                              ? t === "ทั้งหมด"
                                ? "border-primary bg-primary text-white"
                                : `${TYPE_BADGE[t] ?? ""} border-current ring-1 ring-offset-1 ring-current`
                              : "border-border text-muted hover:border-primary hover:text-primary bg-surface"
                          }`}>
                          {t}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <SearchPicker
                  label="เลือกตำแหน่งงาน" required
                  placeholder="พิมพ์ชื่อตำแหน่ง, บริษัท, หรือสาขา..."
                  items={jobTypeFilter === "ทั้งหมด" ? jobs.filter(j => tabJobTypes.includes(j.type)) : jobs.filter(j => j.type === jobTypeFilter)}
                  value={jobId}
                  onChange={setJobId}
                  filterFn={(j, q) => [j.id, j.title, j.titleEn, j.companyName, j.field, j.type, j.location]
                    .some(v => String(v ?? "").toLowerCase().includes(q))}
                  renderItem={(j) => {
                    const slotsFull = j.slots > 0 && j.applications >= j.slots;
                    return (
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{j.title}</p>
                          <p className="text-xs text-muted truncate">{j.companyName}</p>
                          <p className="text-[10px] text-muted/70">{j.field} · {j.location}</p>
                        </div>
                        <div className="shrink-0 flex flex-col items-end gap-1">
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${TYPE_BADGE[j.type] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>{j.type}</span>
                          {j.slots > 0 && (
                            <span className={`text-[10px] font-medium ${slotsFull ? "text-red-500" : "text-emerald-600"}`}>
                              {j.applications}/{j.slots} คน
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  }}
                  renderSelected={(j) => (
                    <div>
                      <p className="text-sm font-semibold text-foreground">{j.title}</p>
                      <p className="text-xs text-muted">{j.companyName} · {j.field}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${TYPE_BADGE[j.type] ?? ""}`}>{j.type}</span>
                        {j.slots > 0 && <span className="text-[10px] text-muted">รับ {j.slots} คน (สมัคร {j.applications} คน)</span>}
                      </div>
                    </div>
                  )}
                />
                {duplicate && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-600">
                    ⚠️ นักเรียนคนนี้มี Mapping กับตำแหน่งนี้อยู่แล้ว
                  </div>
                )}
              </div>

              <div className="border-t border-border" />

              {/* Status */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground">สถานะ <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-3 gap-2">
                  {MAPPING_STATUSES.map(s => {
                    const cfg = STATUS_CONFIG[s];
                    return (
                      <button key={s} type="button" onClick={() => setStatus(s)}
                        className={`rounded-xl border p-2.5 text-left transition-all ${status === s ? `${cfg.color} border-current ring-2 ring-offset-1 ring-current` : "border-border hover:border-primary"}`}>
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 shrink-0 rounded-full ${cfg.dot}`} />
                          <span className="text-xs font-medium leading-tight">{s}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-border" />

              {/* Date + Note */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">วันที่สมัคร</label>
                  <input type="date" value={appliedDate} onChange={e => setAppliedDate(e.target.value)} className={inputCls} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">หมายเหตุ</label>
                  <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
                    placeholder="บันทึกเพิ่มเติม..." className={inputCls + " resize-none"} />
                </div>
              </div>
            </div>
          </div>

          {/* ── Internship section (ฝึกงาน + ผ่านการคัดเลือก only) ── */}
          {status === "ผ่านการคัดเลือก" && (jobs.find(j => j.id === jobId)?.type === "ฝึกงาน") && (
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 bg-surface-muted">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🎓</span>
                  <p className="text-xs font-semibold text-foreground">{t("modal.section.intern")}</p>
                  {linkedInternship && <span className="text-[10px] text-muted font-mono">{linkedInternship.id}</span>}
                </div>
                {!showInternSection && (
                  <button type="button" onClick={() => setShowInternSection(true)}
                    className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                    {t("modal.intern.addBtn")}
                  </button>
                )}
                {showInternSection && !linkedInternship && (
                  <button type="button" onClick={() => setShowInternSection(false)}
                    className="text-[11px] text-muted hover:text-foreground transition-colors">ยกเลิก</button>
                )}
              </div>
              {showInternSection && (
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: t("modal.intern.startDate"),    key: "startDate",      type: "date" },
                      { label: t("modal.intern.endDate"),      key: "endDate",        type: "date" },
                      { label: t("modal.intern.supervisor"),   key: "supervisorName", type: "text", placeholder: t("modal.intern.supervisor") },
                      { label: t("modal.intern.advisor"),      key: "advisorName",    type: "text", placeholder: t("modal.intern.advisor") },
                    ].map(({ label, key, type, placeholder }) => (
                      <div key={key} className="space-y-1">
                        <label className="text-[11px] font-medium text-muted">{label}</label>
                        <input type={type} value={internForm[key]} placeholder={placeholder ?? ""}
                          onChange={e => setInternForm(p => ({ ...p, [key]: e.target.value }))}
                          className={inputCls} />
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-muted">เกรด</label>
                      <input type="text" value={internForm.grade} placeholder="A, B+, ..."
                        onChange={e => setInternForm(p => ({ ...p, grade: e.target.value }))}
                        className={inputCls} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-muted">{t("modal.intern.statusLabel")}</label>
                    <div className="flex flex-wrap gap-2">
                      {INTERNSHIP_STATUSES.map(s => {
                        const cfg = INTERNSHIP_BADGE_CONFIG[s];
                        const active = internForm.status === s;
                        return (
                          <button key={s} type="button" onClick={() => setInternForm(p => ({ ...p, status: s }))}
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium transition-all ${active ? `${cfg.color} border-current ring-2 ring-offset-1 ring-current` : "border-border text-muted hover:border-primary"}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />{cfg.label ?? s}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted">หมายเหตุ</label>
                    <textarea value={internForm.note} rows={2} placeholder="บันทึกเพิ่มเติม..."
                      onChange={e => setInternForm(p => ({ ...p, note: e.target.value }))}
                      className={inputCls + " resize-none"} />
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4 shrink-0">
          <button type="button" onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors">
            {t("common.cancel")}
          </button>
          <button type="button" disabled={!isValid}
            onClick={() => {
              onConfirm({ studentId, jobId, status, appliedDate, note });
              if (status === "ผ่านการคัดเลือก" && jobs.find(j => j.id === jobId)?.type === "ฝึกงาน" && showInternSection) {
                if (linkedInternship) {
                  updateInternship(linkedInternship.id, internForm);
                } else {
                  const nums = internships.map(i => parseInt(i.id.replace("INT-", ""), 10)).filter(Boolean);
                  const newId = `INT-${String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3, "0")}`;
                  addInternship({ id: newId, applicationId: mapping.id, studentId, jobId, ...internForm, createdAt: new Date().toISOString().slice(0, 10) });
                }
              }
              onClose();
            }}
            className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed">
            {t("modal.saveChanges")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Delete Modal ──────────────────────────────────────────────
// DeleteModal ถูกแทนที่ด้วย ConfirmDeleteModal (shared)

// ── Pagination ────────────────────────────────────────────────
function Pagination({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null;
  const pages = [];
  if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
  else {
    pages.push(1);
    if (page > 3) pages.push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push("…");
    pages.push(totalPages);
  }
  const base = "flex h-8 min-w-[2rem] items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors";
  return (
    <div className="flex items-center gap-1">
      <button disabled={page === 1} onClick={() => onPage(page - 1)}
        className={`${base} border border-border text-muted hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed`}>‹</button>
      {pages.map((p, i) => p === "…" ? (
        <span key={`e${i}`} className="px-1 text-sm text-muted select-none">…</span>
      ) : (
        <button key={p} onClick={() => onPage(p)}
          className={`${base} border ${p === page ? "border-primary bg-primary text-white" : "border-border text-muted hover:border-primary hover:text-primary"}`}>{p}</button>
      ))}
      <button disabled={page === totalPages} onClick={() => onPage(page + 1)}
        className={`${base} border border-border text-muted hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed`}>›</button>
    </div>
  );
}

function XIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  );
}

// ── Empty State ───────────────────────────────────────────────
function EmptyState({ hasFilter, onClear, t }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-3xl mb-3">🔗</p>
      <p className="text-sm font-semibold text-foreground">{t("mapping.empty")}</p>
      <p className="text-xs text-muted mt-1">{t("common.noResult")}</p>
      {hasFilter && (
        <button onClick={onClear} className="mt-4 text-sm font-medium text-primary hover:underline">
          {t("common.clearFilter")}
        </button>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function MappingListClient() {
  const { t } = useLanguage();
  const router = useRouter();
  const { mappings, ready, addMapping, updateMapping, deleteMapping, replaceAll } = useMappings();
  const { students }    = useStudents();
  const { jobs }        = useJobs();
  const { internships } = useInternships();

  const [activeTab, setActiveTab]       = useState(() => loadFilters().activeTab ?? "ทั้งหมด");
  const [searchInput, setSearchInput]   = useState("");
  const [keywords, setKeywords]         = useState(() => loadFilters().keywords ?? []);
  const [filterStatus, setFilterStatus] = useState(() => loadFilters().filterStatus ?? "ทั้งหมด");
  const [filterType, setFilterType]     = useState(() => loadFilters().filterType ?? "ทั้งหมด");
  const [filterField, setFilterField]   = useState(() => loadFilters().filterField ?? "ทั้งหมด");
  const [filterUniv, setFilterUniv]     = useState(() => loadFilters().filterUniv ?? "ทั้งหมด");
  const [sortBy, setSortBy]             = useState(() => loadFilters().sortBy ?? "default");
  const [pageSize, setPageSize]         = useState(20);
  const [page, setPage]                 = useState(1);
  const [showAdd, setShowAdd]           = useState(false);
  const [showImport, setShowImport]     = useState(false);
  const [importDone, setImportDone]     = useState(null);
  const [editTarget, setEditTarget]     = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedIds, setSelectedIds]   = useState(new Set());

  const toggleSelect = useCallback((id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const switchTab = (tab) => {
    setActiveTab(tab);
    setFilterType("ทั้งหมด");
    setFilterStatus("ทั้งหมด");
    setPage(1);
  };

  useEffect(() => {
    saveFilters({ activeTab, keywords, filterStatus, filterType, filterField, filterUniv, sortBy });
  }, [activeTab, keywords, filterStatus, filterType, filterField, filterUniv, sortBy]);

  const addKeyword = useCallback((raw) => {
    const kw = raw.trim();
    if (!kw || keywords.includes(kw)) return;
    setKeywords(prev => [...prev, kw]);
    setSearchInput(""); setPage(1);
  }, [keywords]);

  const removeKeyword = useCallback((kw) => {
    setKeywords(prev => prev.filter(k => k !== kw)); setPage(1);
  }, []);

  const clearFilters = () => {
    setKeywords([]); setSearchInput(""); setFilterStatus("ทั้งหมด");
    setFilterType("ทั้งหมด"); setFilterField("ทั้งหมด"); setFilterUniv("ทั้งหมด");
    setSortBy("default"); setPage(1);
  };

  const handleImport = (rows, mode) => {
    if (mode === "replace") {
      const list = rows.map((r, i) => ({
        id: r.id?.trim() || `MAP-IMP-${i + 1}`,
        studentId: r.studentId?.trim(),
        jobId: r.jobId?.trim(),
        status: MAPPING_STATUSES.includes(r.status) ? r.status : "สมัครแล้ว",
        appliedDate: r.appliedDate || new Date().toISOString().slice(0, 10),
        note: r.note ?? "",
      }));
      if (typeof replaceAll === "function") replaceAll(list);
      setImportDone({ count: list.length, mode: "replace" });
    } else {
      const existingKeys = new Set(mappings.map(m => `${m.studentId}|${m.jobId}`));
      let added = 0;
      rows.forEach((r, i) => {
        const key = `${r.studentId?.trim()}|${r.jobId?.trim()}`;
        if (!existingKeys.has(key)) {
          addMapping({
            id: r.id?.trim() || nextId([...mappings]),
            studentId: r.studentId?.trim(),
            jobId: r.jobId?.trim(),
            status: MAPPING_STATUSES.includes(r.status) ? r.status : "สมัครแล้ว",
            appliedDate: r.appliedDate || new Date().toISOString().slice(0, 10),
            note: r.note ?? "",
          });
          added++;
        }
      });
      setImportDone({ added, mode: "merge" });
    }
    setPage(1);
    setTimeout(() => setImportDone(null), 4000);
  };

  // join
  const joined = useMemo(() => mappings.map(m => ({
    ...m,
    student:    students.find(s => s.id === m.studentId),
    job:        jobs.find(j => j.id === m.jobId),
    internship: internships.find(i => i.applicationId === m.id),
  })), [mappings, students, jobs, internships]);

  const filtered = useMemo(() => {
    let list = [...joined];
    if (activeTab === "ฝึกงาน")    list = list.filter(m => m.job?.type === "ฝึกงาน");
    if (activeTab === "งานประจำ")   list = list.filter(m => m.job?.type === "งานประจำ");
    if (keywords.length > 0) {
      list = list.filter(m => keywords.every(kw => {
        const q = kw.toLowerCase();
        const s = m.student; const j = m.job;
        return [m.id, m.studentId, m.jobId, m.status,
          s?.name, s?.lastname, s?.nameEn, s?.lastnameEn, s?.nickname, s?.university, s?.major,
          j?.title, j?.titleEn, j?.companyName, j?.field, j?.type,
        ].some(v => String(v ?? "").toLowerCase().includes(q));
      }));
    }
    if (searchInput.trim()) {
      const q = searchInput.trim().toLowerCase();
      list = list.filter(m => {
        const s = m.student; const j = m.job;
        return [m.id, m.studentId, m.jobId, m.status,
          s?.name, s?.lastname, s?.nameEn, s?.lastnameEn, s?.nickname, s?.university, s?.major,
          j?.title, j?.titleEn, j?.companyName, j?.field, j?.type,
        ].some(v => String(v ?? "").toLowerCase().includes(q));
      });
    }
    if (filterStatus !== "ทั้งหมด") list = list.filter(m => m.status === filterStatus);
    if (filterType   !== "ทั้งหมด") list = list.filter(m => m.job?.type === filterType);
    if (filterField  !== "ทั้งหมด") list = list.filter(m => m.job?.field === filterField);
    if (filterUniv   !== "ทั้งหมด") list = list.filter(m => m.student?.university === filterUniv);
    switch (sortBy) {
      case "date-desc": list.sort((a, b) => (b.appliedDate ?? "").localeCompare(a.appliedDate ?? "")); break;
      case "date-asc":  list.sort((a, b) => (a.appliedDate ?? "").localeCompare(b.appliedDate ?? "")); break;
      case "student":   list.sort((a, b) => ((a.student?.name ?? "") + (a.student?.lastname ?? "")).localeCompare((b.student?.name ?? "") + (b.student?.lastname ?? ""), "th")); break;
      case "job-asc":   list.sort((a, b) => (a.job?.title ?? "").localeCompare(b.job?.title ?? "", "th")); break;
      default: break;
    }
    return list;
  }, [joined, activeTab, keywords, filterStatus, filterType, filterField, filterUniv, sortBy, searchInput]);

  const activeTerms = [...keywords, searchInput.trim()].filter(Boolean);

  const hasActiveFilter = keywords.length > 0 || filterStatus !== "ทั้งหมด" ||
    filterType !== "ทั้งหมด" || filterField !== "ทั้งหมด" || filterUniv !== "ทั้งหมด" || sortBy !== "default";

  const tabCounts = useMemo(() => ({
    ทั้งหมด:  joined.length,
    ฝึกงาน:   joined.filter(m => m.job?.type === "ฝึกงาน").length,
    งานประจำ: joined.filter(m => m.job?.type === "งานประจำ").length,
  }), [joined]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd   = Math.min(safePage * pageSize, filtered.length);

  const allPageSelected  = paginated.length > 0 && paginated.every(m => selectedIds.has(m.id));
  const somePageSelected = paginated.some(m => selectedIds.has(m.id));

  const toggleSelectPage = useCallback(() => {
    setSelectedIds(prev => {
      const allSelected = paginated.every(m => prev.has(m.id));
      const next = new Set(prev);
      if (allSelected) paginated.forEach(m => next.delete(m.id));
      else             paginated.forEach(m => next.add(m.id));
      return next;
    });
  }, [paginated]);

  const exportSelectedCSV = useCallback(() => {
    const selected = filtered.filter(m => selectedIds.has(m.id));
    exportCSV(selected, students, jobs);
  }, [filtered, selectedIds, students, jobs]);

  const bulkDelete = useCallback(() => {
    selectedIds.forEach(id => deleteMapping(id));
    setSelectedIds(new Set());
  }, [selectedIds, deleteMapping]);

  const tabScoped = useMemo(() => {
    if (activeTab === "ฝึกงาน")  return joined.filter(m => m.job?.type === "ฝึกงาน");
    if (activeTab === "งานประจำ") return joined.filter(m => m.job?.type === "งานประจำ");
    return joined;
  }, [joined, activeTab]);

  const statusSummary = useMemo(() => [
    { label: "ทั้งหมด", count: tabScoped.length, cfg: { color: "bg-surface-muted border-border text-foreground", dot: "bg-gray-400" } },
    ...MAPPING_STATUSES.map(s => ({ label: s, count: tabScoped.filter(m => m.status === s).length, cfg: STATUS_CONFIG[s] })),
  ], [tabScoped]);

  const handleAdd = ({ studentId, jobId, status, appliedDate, note }) => {
    addMapping({ id: nextId(mappings), studentId, jobId, status, appliedDate, note });
    setPage(1);
  };

  if (!ready) return <div className="flex items-center justify-center py-24 text-sm text-muted">{t("common.loading")}</div>;

  // ── Table columns ──────────────────────────────────────────
  const columns = [
    { label: (
        <input type="checkbox" checked={allPageSelected}
          ref={el => { if (el) el.indeterminate = somePageSelected && !allPageSelected; }}
          onChange={toggleSelectPage} onClick={e => e.stopPropagation()}
          className="h-4 w-4 rounded border-border accent-primary cursor-pointer" />
      ), width: "44px", align: "center" },
    { label: t("mapping.col.student"),    width: "180px" },
    { label: t("mapping.col.job"),        width: "200px" },
    { label: "ประเภท / สาขา",            width: "140px" },
    { label: t("mapping.col.appliedDate"), width: "110px" },
    { label: t("mapping.col.status"), align: "center", width: "170px" },
    { label: t("mapping.col.actions"), align: "center", width: "115px" },
  ];

  // ── Table rows ─────────────────────────────────────────────
  const tableRows = paginated.map((m) => {
    const s        = m.student;
    const j        = m.job;
    const sCfg     = STATUS_CONFIG[m.status] ?? STATUS_CONFIG["สมัครแล้ว"];
    const internCfg = (j?.type === "ฝึกงาน" && m.internship) ? INTERNSHIP_BADGE_CONFIG[m.internship.status] : null;
    const isSelected = selectedIds.has(m.id);

    return [
      // 0: Checkbox
      <input key="cb" type="checkbox" checked={isSelected} onChange={() => toggleSelect(m.id)}
        onClick={e => e.stopPropagation()}
        className="h-4 w-4 rounded border-border accent-primary cursor-pointer" />,

      // 1: นักเรียน
      <div key="student" className="min-w-0">
        {s ? (() => {
          const enroll = s.enrollments?.find(e => !e.endDate) ?? s.enrollments?.[s.enrollments.length - 1];
          return (
            <>
              <p className="text-[10px] font-mono text-muted/60 mb-0.5">{s.id}</p>
              <Link href={`/admin/students/${s.id}`} onClick={e => e.stopPropagation()}
                className="text-xs font-semibold text-foreground hover:text-primary hover:underline transition-colors line-clamp-1">
                <HighlightText text={`${s.prefix}${s.name} ${s.lastname}`} terms={activeTerms} />
              </Link>
              {enroll?.university && (
                <p className="mt-0.5">
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${UNIV_BADGE[enroll.university] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
                    <HighlightText text={enroll.university} terms={activeTerms} />
                  </span>
                </p>
              )}
              {(enroll?.major || enroll?.year) && (
                <p className="mt-0.5 text-[10px] text-muted/70 truncate">
                  {[enroll.major, enroll.year ? `ปี ${enroll.year}` : null].filter(Boolean).join(" · ")}
                </p>
              )}
            </>
          );
        })() : (
          <span className="text-xs text-muted font-mono">{m.studentId}</span>
        )}
      </div>,

      // 2: ตำแหน่งงาน
      <div key="job" className="min-w-0">
        {j ? (
          <>
            <p className="text-[10px] font-mono text-muted/60 mb-0.5">{j.id}</p>
            <Link href={`/admin/marketplace/job-positions/${j.id}`} onClick={e => e.stopPropagation()}
              className="text-xs font-semibold text-foreground hover:text-primary hover:underline transition-colors line-clamp-1">
              <HighlightText text={j.title} terms={activeTerms} />
            </Link>
            <p className="text-[11px] text-muted truncate">
              <HighlightText text={j.companyName} terms={activeTerms} />
            </p>
          </>
        ) : (
          <span className="text-xs text-muted font-mono">{m.jobId}</span>
        )}
      </div>,

      // 3: ประเภท / สาขา
      <div key="type" className="min-w-0">
        {j ? (
          <>
            <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${TYPE_BADGE[j.type] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
              {j.type}
            </span>
            {j.field && <p className="mt-0.5 text-[11px] text-muted line-clamp-2">{j.field}</p>}
          </>
        ) : <span className="text-xs text-muted/50">—</span>}
      </div>,

      // 4: วันที่สมัคร
      <p key="date" className="text-xs text-foreground whitespace-nowrap">{formatDate(m.appliedDate)}</p>,

      // 5: สถานะ + internship + note
      <div key="status">
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${sCfg.color}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${sCfg.dot}`} />
          {m.status}
        </span>
        {internCfg && (
          <p className="mt-1">
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${internCfg.color}`}>
              <span className={`h-1 w-1 rounded-full ${internCfg.dot}`} />{internCfg.label}
            </span>
          </p>
        )}
        {m.note && <p className="mt-0.5 text-[10px] text-muted line-clamp-1" title={m.note}>{m.note}</p>}
      </div>,

      // 6: Actions
      <div key="actions" className="flex items-center justify-center gap-1">
        <Link href={`/admin/marketplace/applications/${m.id}`} title="ดูข้อมูล"
          onClick={e => e.stopPropagation()}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted hover:border-primary hover:text-primary transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
          </svg>
        </Link>
        <button onClick={e => { e.stopPropagation(); setEditTarget(m); }} title="แก้ไขสถานะ"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted hover:border-amber-500 hover:text-amber-500 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
        </button>
        <button onClick={e => { e.stopPropagation(); setDeleteTarget(m); }} title="ลบ"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted hover:border-red-500 hover:text-red-500 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </button>
      </div>,
    ];
  });

  return (
    <div className="space-y-6">

      {/* Modals */}
      {showAdd    && <AddMappingModal students={students} jobs={jobs} mappings={mappings} activeTab={activeTab} onClose={() => setShowAdd(false)} onConfirm={handleAdd} />}
      {showImport && <ImportModal onClose={() => setShowImport(false)} onConfirm={handleImport} />}
      {editTarget && <EditMappingModal mapping={editTarget} students={students} jobs={jobs} mappings={mappings} activeTab={activeTab} onClose={() => setEditTarget(null)} onConfirm={(data) => { updateMapping(editTarget.id, data); setEditTarget(null); }} />}
      {deleteTarget && (() => {
        const s = students.find(x => x.id === deleteTarget.studentId);
        const studentName = s ? `${s.prefix}${s.name} ${s.lastname}` : deleteTarget.studentId;
        const jobTitle = jobs.find(j => j.id === deleteTarget.jobId)?.title ?? deleteTarget.jobId;
        return (
          <ConfirmDeleteModal
            heading="ยืนยันการลบการสมัคร"
            confirmLabel="ลบข้อมูล"
            onConfirm={() => { deleteMapping(deleteTarget.id); setDeleteTarget(null); }}
            onCancel={() => setDeleteTarget(null)}
          >
            <p className="mt-2 text-sm font-semibold text-foreground">{studentName}</p>
            <p className="text-xs text-muted">→ {jobTitle}</p>
          </ConfirmDeleteModal>
        );
      })()}

      {/* Import success banner */}
      {importDone && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span>
            {importDone.mode === "replace"
              ? t("mapping.importSuccess.replace", { count: importDone.count })
              : t("mapping.importSuccess.merge", { added: importDone.added })}
          </span>
        </div>
      )}

      {/* ── Category tabs ── */}
      <div className="flex items-center gap-1 border-b border-border">
        {[
          { key: "ทั้งหมด",  icon: "🗂️", label: t("mapping.tab.all") },
          { key: "ฝึกงาน",   icon: "🎓", label: t("mapping.tab.internship") },
          { key: "งานประจำ", icon: "💼",  label: t("mapping.tab.employment") },
        ].map(({ key, icon, label }) => (
          <button key={key} onClick={() => switchTab(key)}
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === key
                ? "border-primary text-primary"
                : "border-transparent text-muted hover:text-foreground hover:border-border"
            }`}>
            <span>{icon}</span>
            {label}
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
              activeTab === key ? "bg-primary/10 text-primary" : "bg-surface-muted text-muted"
            }`}>{tabCounts[key]}</span>
          </button>
        ))}
      </div>

      {/* ── Status pills ── */}
      <div className="flex flex-wrap gap-2">
        {statusSummary.map(({ label, count, cfg }) => {
          const statusLabelKey = { "ทั้งหมด": "common.all", "สมัครแล้ว": "status.applied", "ผ่านการคัดเลือก": "status.passed", "ไม่ผ่านการคัดเลือก": "status.failed" }[label];
          return (
            <button key={label}
              onClick={() => { setFilterStatus(filterStatus === label ? "ทั้งหมด" : label); setPage(1); }}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold transition-all ${
                filterStatus === label
                  ? cfg.color + " ring-2 ring-offset-1 ring-current"
                  : "border-border bg-surface text-muted hover:border-primary hover:text-primary"
              }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
              {statusLabelKey ? t(statusLabelKey) : label}
              <span className="rounded-full bg-black/10 px-1.5 py-0.5 text-[10px] font-bold">{count}</span>
            </button>
          );
        })}
      </div>

      {/* ── Filter ── */}
      <div className="flex flex-col gap-3">
        {/* Row 1 */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none"
              xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
            <input type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addKeyword(searchInput); } }}
              placeholder="ชื่อนักเรียน ตำแหน่งงาน บริษัท (Enter เพื่อค้นหา)"
              className="w-full rounded-lg border border-border bg-surface pl-9 pr-4 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-accent-soft" />
          </div>
          <button onClick={() => addKeyword(searchInput)} disabled={!searchInput.trim()}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
            {t("common.search")}
          </button>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <button onClick={() => exportCSV(filtered.map(m => m), students, jobs)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:border-primary hover:text-primary transition-colors whitespace-nowrap">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              {t("mapping.export")}
            </button>
            <button onClick={() => setShowImport(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:border-primary hover:text-primary transition-colors whitespace-nowrap">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              {t("mapping.import")}
            </button>
            <button onClick={() => setShowAdd(true)}
              className="btn-primary inline-flex items-center gap-1.5 whitespace-nowrap">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              {t("mapping.add")}
            </button>
          </div>
        </div>

        {/* Row 2: dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col gap-0.5">
            <label className={labelCls}>{t("common.status")}</label>
            <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }} className={selectCls}>
              <option value="ทั้งหมด">📋 {t("common.status")} — {t("common.all")}</option>
              {MAPPING_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-0.5">
            <label className={labelCls}>{t("common.university")}</label>
            <select value={filterUniv} onChange={e => { setFilterUniv(e.target.value); setPage(1); }} className={selectCls}>
              <option value="ทั้งหมด">{t("common.university")} — {t("common.all")}</option>
              {UNIVERSITIES.map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
          {activeTab === "ทั้งหมด" && (
            <div className="flex flex-col gap-0.5">
              <label className={labelCls}>{t("common.jobType")}</label>
              <select value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1); }} className={selectCls}>
                <option value="ทั้งหมด">{t("common.jobType")} — {t("common.all")}</option>
                {JOB_TYPES.map(jt => <option key={jt}>{jt}</option>)}
              </select>
            </div>
          )}
          <div className="flex flex-col gap-0.5">
            <label className={labelCls}>{t("common.field")}</label>
            <select value={filterField} onChange={e => { setFilterField(e.target.value); setPage(1); }} className={selectCls}>
              <option value="ทั้งหมด">{t("common.field")} — {t("common.all")}</option>
              {JOB_FIELDS.map(f => <option key={f}>{f}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-0.5">
            <label className={labelCls}>{t("common.sortBy")}</label>
            <select value={sortBy} onChange={e => { setSortBy(e.target.value); setPage(1); }} className={selectCls}>
              <option value="default">{t("common.sortBy")}</option>
              <option value="date-desc">{t("mapping.sort.dateDesc")}</option>
              <option value="date-asc">{t("mapping.sort.dateAsc")}</option>
              <option value="student">{t("mapping.sort.student")}</option>
              <option value="job-asc">{t("mapping.sort.jobAsc")}</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Active filter chips ── */}
      {hasActiveFilter && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted">{t("common.filter")}:</span>
          {filterStatus !== "ทั้งหมด" && (
            <button onClick={() => { setFilterStatus("ทั้งหมด"); setPage(1); }} className={chipBase}>
              📋 {filterStatus}<XIcon />
            </button>
          )}
          {filterUniv !== "ทั้งหมด" && (
            <button onClick={() => { setFilterUniv("ทั้งหมด"); setPage(1); }} className={chipBase}>
              🏫 {filterUniv}<XIcon />
            </button>
          )}
          {filterType !== "ทั้งหมด" && (
            <button onClick={() => { setFilterType("ทั้งหมด"); setPage(1); }} className={chipBase}>
              💼 {filterType}<XIcon />
            </button>
          )}
          {filterField !== "ทั้งหมด" && (
            <button onClick={() => { setFilterField("ทั้งหมด"); setPage(1); }} className={chipBase}>
              🔬 {filterField}<XIcon />
            </button>
          )}
          {sortBy !== "default" && (
            <button onClick={() => { setSortBy("default"); setPage(1); }} className={chipBase}>
              ⇅ {{"job-asc": t("mapping.sort.jobAsc"), "date-desc": t("mapping.sort.dateDesc"), "date-asc": t("mapping.sort.dateAsc"), "student": t("mapping.sort.student")}[sortBy]}<XIcon />
            </button>
          )}
          {keywords.map(kw => (
            <button key={kw} onClick={() => removeKeyword(kw)} className={chipBase}>
              🔍 &ldquo;{kw}&rdquo;<XIcon />
            </button>
          ))}
          <button onClick={clearFilters} className="text-xs font-medium text-muted hover:text-red-500 transition-colors underline underline-offset-2 ml-1">{t("common.clearFilter")}</button>
        </div>
      )}

      {/* ── Selection bar ── */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-primary/30 bg-accent-soft px-4 py-2.5">
          <span className="text-sm font-semibold text-primary">เลือกแล้ว {selectedIds.size} รายการ</span>
          <div className="flex items-center gap-2">
            <button onClick={exportSelectedCSV}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary hover:text-primary transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              ส่งออก CSV
            </button>
            <button onClick={() => {
              if (confirm(`ยืนยันการลบ ${selectedIds.size} รายการ?`)) bulkDelete();
            }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              ลบที่เลือก
            </button>
            <button onClick={() => setSelectedIds(new Set())}
              className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground transition-colors">
              ยกเลิก
            </button>
          </div>
        </div>
      )}

      {/* ── Table ── */}
      {paginated.length === 0 ? (
        <div className="card">
          <EmptyState hasFilter={hasActiveFilter} onClear={clearFilters} t={t} />
        </div>
      ) : (
        <AdminTable
          columns={columns}
          rows={tableRows}
          onRowClick={(i) => router.push(`/admin/marketplace/applications/${paginated[i].id}`)}
          onCellClick={(e, i, j) => {
            if (j === 0 || j === 6) e.stopPropagation();
          }}
        />
      )}

      {/* ── Footer ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-xs text-muted">
          {filtered.length === 0 ? t("common.noResult") : (
            <>{t("common.showing")} <span className="font-semibold text-foreground">{rangeStart}–{rangeEnd}</span> {t("common.of")} <span className="font-semibold text-foreground">{filtered.length}</span> {t("common.items")}
              {filtered.length < mappings.length && <> ({t("common.of")} <span className="font-semibold text-foreground">{mappings.length}</span>)</>}
            </>
          )}
        </p>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-muted">
            <span>{t("common.showing")}</span>
            <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="rounded-lg border border-border bg-surface px-2 py-1.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-accent-soft">
              {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <span>{t("common.items")}</span>
          </div>
          <Pagination page={safePage} totalPages={totalPages} onPage={setPage} />
        </div>
      </div>
    </div>
  );
}
