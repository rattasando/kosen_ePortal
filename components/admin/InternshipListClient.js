"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useInternships } from "./contexts/InternshipContext";
import { useStudents } from "./contexts/StudentContext";
import { useJobs } from "./contexts/JobContext";
import { useMappings } from "./contexts/MappingContext";
import ConfirmDeleteModal from "@/components/admin/ui/ConfirmDeleteModal";

// ── Constants ─────────────────────────────────────────────────
const INTERNSHIP_STATUSES = ["อยู่ในระหว่างฝึกงาน", "เสร็จสิ้น", "ยกเลิก"];
const GRADES              = ["A", "B+", "B", "C+", "C", "D+", "D", "F", "ยังไม่ประเมิน"];
const JOB_FIELDS          = [
  "วิศวกรรมคอมพิวเตอร์", "วิศวกรรมเครื่องกล", "วิศวกรรมไฟฟ้า",
  "วิศวกรรมอุตสาหการ", "วิศวกรรมเมคคาทรอนิกส์", "วิศวกรรมโยธา",
  "วิศวกรรมเคมี", "การออกแบบอุตสาหกรรม",
];
const UNIVERSITIES      = ["KOSEN-KMUTT", "KOSEN-KMITL", "KOSEN-Chulabhorn"];
const PAGE_SIZE_OPTIONS = [10, 20, 30, 50];

const STATUS_CONFIG = {
  อยู่ในระหว่างฝึกงาน: { color: "bg-sky-100 text-sky-700 border-sky-200",           dot: "bg-sky-500" },
  เสร็จสิ้น:           { color: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  ยกเลิก:              { color: "bg-red-100 text-red-700 border-red-200",             dot: "bg-red-500" },
};

const TYPE_BADGE = {
  ฝึกงาน:       "bg-sky-50 text-sky-700 border-sky-200",
  พนักงานประจำ: "bg-violet-50 text-violet-700 border-violet-200",
  "Part-time":  "bg-orange-50 text-orange-700 border-orange-200",
};

const inputCls  = "w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-accent-soft placeholder:text-muted";
const selectCls = "w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-accent-soft";

// ── CSV helpers ───────────────────────────────────────────────
const CSV_HEADERS = ["id", "applicationId", "studentId", "jobId", "startDate", "endDate",
  "hoursCompleted", "hoursRequired", "supervisorName", "advisorName", "status", "grade", "note"];

function toCSVField(val) {
  const s = String(val ?? "");
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

function exportCSV(items, students, jobs) {
  const rows = [
    [...CSV_HEADERS, "studentName", "jobTitle", "companyName"].join(","),
    ...items.map(m => {
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
  a.href = url; a.download = `internship-tracking_${new Date().toISOString().slice(0, 10)}.csv`;
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
  if (!rows.length) return { error: "ไม่พบข้อมูลที่ถูกต้องในไฟล์" };
  return { rows };
}

// ── Filter persistence ────────────────────────────────────────
const FILTER_KEY = "internship-list-filters";
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

function nextId(items) {
  const nums = items.map(m => parseInt(m.id.replace("INT-", ""), 10)).filter(Boolean);
  return `INT-${String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3, "0")}`;
}

function calcProgress(completed, required) {
  if (!required || required === 0) return 0;
  return Math.min(100, Math.round((completed / required) * 100));
}

// ── HighlightText ─────────────────────────────────────────────
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

// ── SearchPicker ──────────────────────────────────────────────
function SearchPicker({ label, required, placeholder, items, renderItem, renderSelected,
  value, onChange, filterFn }) {
  const [query, setQuery] = useState("");
  const [open, setOpen]   = useState(false);
  const ref               = useRef(null);
  const selected          = value ? items.find(i => i.id === value) : null;

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
              <p className="text-sm font-semibold text-foreground">นำเข้าข้อมูลการฝึกงาน</p>
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
                <p className="font-mono">id, applicationId, studentId, jobId, startDate, endDate, hoursCompleted, hoursRequired, supervisorName, advisorName, status, grade, note</p>
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
                        {["รหัส", "นักเรียน", "ตำแหน่งงาน", "ระยะเวลา", "สถานะ"].map(h => (
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
                          <td className="px-3 py-2 text-muted">{row.startDate || "—"} → {row.endDate || "—"}</td>
                          <td className="px-3 py-2 text-muted">{row.status || "อยู่ในระหว่างฝึกงาน"}</td>
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

// ── Add Internship Modal ──────────────────────────────────────
function AddInternshipModal({ students, jobs, mappings, internships, onClose, onConfirm }) {
  const [applicationId, setApplicationId] = useState("");
  const [studentId, setStudentId]         = useState("");
  const [jobId, setJobId]                 = useState("");
  const [startDate, setStartDate]         = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate]             = useState("");
  const [hoursRequired, setHoursRequired] = useState(160);
  const [hoursCompleted, setHoursCompleted] = useState(0);
  const [supervisorName, setSupervisorName] = useState("");
  const [advisorName, setAdvisorName]     = useState("");
  const [status, setStatus]               = useState("อยู่ในระหว่างฝึกงาน");
  const [grade, setGrade]                 = useState("");
  const [note, setNote]                   = useState("");

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Applications that passed selection — eligible for internship
  const eligibleApps = useMemo(() =>
    mappings.filter(m => m.status === "ผ่านการคัดเลือก"),
    [mappings]
  );

  const handleSelectApp = (appId) => {
    setApplicationId(appId);
    const app = mappings.find(m => m.id === appId);
    if (app) {
      setStudentId(app.studentId);
      setJobId(app.jobId);
    }
  };

  const duplicate = studentId && jobId &&
    internships.some(m => m.studentId === studentId && m.jobId === jobId);

  const isValid = studentId && jobId && startDate && !duplicate;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-surface shadow-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-lg">🎓</div>
            <div>
              <p className="text-sm font-semibold text-foreground">เพิ่มรายการฝึกงาน</p>
              <p className="text-xs text-muted">สร้างรายการติดตามการฝึกงานใหม่</p>
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

          {/* ── Application reference ── */}
          <div className="rounded-xl border border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">🔗 อ้างอิงใบสมัคร</p>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                ผ่านการคัดเลือก {eligibleApps.length} รายการ
              </span>
            </div>
            <SearchPicker
              label="เลือกจากใบสมัครที่ผ่านการคัดเลือก"
              placeholder="พิมพ์รหัสใบสมัคร, ชื่อนักเรียน, หรือตำแหน่งงาน..."
              items={eligibleApps}
              value={applicationId}
              onChange={handleSelectApp}
              filterFn={(app, q) => {
                const s = students.find(x => x.id === app.studentId);
                const j = jobs.find(x => x.id === app.jobId);
                return [app.id, s?.name, s?.lastname, j?.title, j?.companyName]
                  .some(v => String(v ?? "").toLowerCase().includes(q));
              }}
              renderItem={(app) => {
                const s = students.find(x => x.id === app.studentId);
                const j = jobs.find(x => x.id === app.jobId);
                return (
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {s ? `${s.prefix}${s.name} ${s.lastname}` : app.studentId}
                      </p>
                      <p className="text-xs text-muted">{j?.title ?? app.jobId} · {j?.companyName}</p>
                    </div>
                    <span className="shrink-0 font-mono text-[10px] text-muted">{app.id}</span>
                  </div>
                );
              }}
              renderSelected={(app) => {
                const s = students.find(x => x.id === app.studentId);
                const j = jobs.find(x => x.id === app.jobId);
                return (
                  <div>
                    <p className="text-xs font-semibold text-foreground">
                      {s ? `${s.prefix}${s.name} ${s.lastname}` : app.studentId}
                    </p>
                    <p className="text-xs text-muted">{j?.title} · {j?.companyName}</p>
                    <p className="text-[10px] text-muted font-mono mt-0.5">{app.id}</p>
                  </div>
                );
              }}
            />
            <p className="text-[11px] text-muted">หากยังไม่มีใบสมัคร สามารถกรอกข้อมูลนักเรียนและตำแหน่งงานด้านล่างแทนได้</p>
          </div>

          {/* ── Student + Job (manual or auto-filled) ── */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">รหัสนักเรียน <span className="text-red-500">*</span></label>
              <input value={studentId} onChange={e => setStudentId(e.target.value)}
                placeholder="เช่น STU-001"
                className={inputCls + (applicationId ? " bg-surface-muted text-muted" : "")} />
              {studentId && (() => { const s = students.find(x => x.id === studentId); return s ? (
                <p className="text-[11px] text-emerald-600">✓ {s.prefix}{s.name} {s.lastname} · {s.university}</p>
              ) : (
                <p className="text-[11px] text-amber-600">⚠️ ไม่พบนักเรียนในระบบ</p>
              ); })()}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">รหัสตำแหน่งงาน <span className="text-red-500">*</span></label>
              <input value={jobId} onChange={e => setJobId(e.target.value)}
                placeholder="เช่น JOB-001"
                className={inputCls + (applicationId ? " bg-surface-muted text-muted" : "")} />
              {jobId && (() => { const j = jobs.find(x => x.id === jobId); return j ? (
                <p className="text-[11px] text-emerald-600">✓ {j.title} · {j.companyName}</p>
              ) : (
                <p className="text-[11px] text-amber-600">⚠️ ไม่พบตำแหน่งงานในระบบ</p>
              ); })()}
            </div>
          </div>

          {duplicate && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-600">
              ⚠️ นักเรียนคนนี้มีรายการฝึกงานกับตำแหน่งนี้อยู่แล้ว
            </div>
          )}

          {/* ── Period ── */}
          <div className="rounded-xl border border-border p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">📅 ระยะเวลาและชั่วโมง</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">วันเริ่มต้น <span className="text-red-500">*</span></label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">วันสิ้นสุด</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">ชั่วโมงที่ต้องทำทั้งหมด</label>
                <input type="number" min={0} value={hoursRequired}
                  onChange={e => setHoursRequired(Number(e.target.value))} className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">ชั่วโมงที่ทำแล้ว</label>
                <input type="number" min={0} value={hoursCompleted}
                  onChange={e => setHoursCompleted(Number(e.target.value))} className={inputCls} />
              </div>
            </div>
          </div>

          {/* ── Personnel ── */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">ผู้ดูแล (บริษัท)</label>
              <input value={supervisorName} onChange={e => setSupervisorName(e.target.value)}
                placeholder="ชื่อ Supervisor ของบริษัท" className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">อาจารย์ที่ปรึกษา</label>
              <input value={advisorName} onChange={e => setAdvisorName(e.target.value)}
                placeholder="ชื่ออาจารย์ที่ปรึกษา" className={inputCls} />
            </div>
          </div>

          {/* ── Status grid ── */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-foreground">
              สถานะ <span className="text-muted font-normal">(default: อยู่ในระหว่างฝึกงาน)</span>
            </p>
            <div className="grid grid-cols-2 gap-2">
              {INTERNSHIP_STATUSES.map(s => {
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

          {/* ── Grade + Note ── */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">เกรด</label>
              <select value={grade} onChange={e => setGrade(e.target.value)} className={selectCls}>
                <option value="">— ยังไม่ประเมิน —</option>
                {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">หมายเหตุ</label>
              <textarea value={note} onChange={e => setNote(e.target.value)} rows={1}
                placeholder="บันทึกเพิ่มเติม..." className={inputCls + " resize-none"} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4 shrink-0">
          <button type="button" onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors">
            ยกเลิก
          </button>
          <button type="button" disabled={!isValid}
            onClick={() => {
              onConfirm({ applicationId, studentId, jobId, startDate, endDate,
                hoursCompleted, hoursRequired, supervisorName, advisorName, status, grade, note });
              onClose();
            }}
            className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed">
            เพิ่มรายการฝึกงาน
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Edit Internship Modal ─────────────────────────────────────
function EditInternshipModal({ item, students, jobs, mappings, internships, onClose, onConfirm }) {
  // studentId / jobId มาจากใบสมัคร (Applications) — แก้ไขไม่ได้
  const studentId = item.studentId;
  const jobId     = item.jobId;

  const [startDate, setStartDate]           = useState(item.startDate ?? "");
  const [endDate, setEndDate]               = useState(item.endDate ?? "");
  const [hoursRequired, setHoursRequired]   = useState(item.hoursRequired ?? 160);
  const [hoursCompleted, setHoursCompleted] = useState(item.hoursCompleted ?? 0);
  const [supervisorName, setSupervisorName] = useState(item.supervisorName ?? "");
  const [advisorName, setAdvisorName]       = useState(item.advisorName ?? "");
  const [status, setStatus]                 = useState(item.status ?? "อยู่ในระหว่างฝึกงาน");
  const [grade, setGrade]                   = useState(item.grade ?? "");
  const [note, setNote]                     = useState(item.note ?? "");

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const isValid = !!startDate;

  const origStudent = students.find(s => s.id === item.studentId);
  const origJob     = jobs.find(j => j.id === item.jobId);
  const origCfg     = STATUS_CONFIG[item.status] ?? STATUS_CONFIG["อยู่ในระหว่างฝึกงาน"];

  const restore = () => {
    setStartDate(item.startDate ?? ""); setEndDate(item.endDate ?? "");
    setHoursRequired(item.hoursRequired ?? 160); setHoursCompleted(item.hoursCompleted ?? 0);
    setSupervisorName(item.supervisorName ?? ""); setAdvisorName(item.advisorName ?? "");
    setStatus(item.status ?? "อยู่ในระหว่างฝึกงาน"); setGrade(item.grade ?? ""); setNote(item.note ?? "");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-surface shadow-2xl max-h-[90vh] flex flex-col">

        <div className="flex items-center justify-between border-b border-border px-5 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-lg">✏️</div>
            <div>
              <p className="text-sm font-semibold text-foreground">แก้ไขรายการฝึกงาน</p>
              <p className="text-xs text-muted font-mono">{item.id}</p>
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

          {/* Original data reference */}
          <div className="flex items-start justify-between gap-3 rounded-xl border border-border bg-surface-muted px-4 py-3">
            <div className="space-y-0.5 min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">ข้อมูลเดิม</p>
              <p className="text-sm font-semibold text-foreground truncate">
                {origStudent ? `${origStudent.prefix}${origStudent.name} ${origStudent.lastname}` : item.studentId}
              </p>
              <p className="text-xs text-muted truncate">{origJob?.title ?? item.jobId} · {origJob?.companyName}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${origCfg.color}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${origCfg.dot}`} />{item.status}
                </span>
                {item.grade && <span className="text-[10px] text-muted">เกรด {item.grade}</span>}
                <span className="text-[10px] text-muted">{item.hoursCompleted}/{item.hoursRequired} ชม.</span>
              </div>
            </div>
            <button type="button" onClick={restore}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted hover:border-primary hover:text-primary transition-colors">
              ↺ คืนค่าเดิม
            </button>
          </div>

          {/* Student + Job — read-only (from Application) */}
          <div className="rounded-xl border border-border bg-surface-muted p-4 space-y-3">
            <div className="flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-muted" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">ข้อมูลจากใบสมัคร — แก้ไขไม่ได้</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-[10px] font-medium text-muted">นักเรียน</p>
                <p className="text-sm font-semibold text-foreground">
                  {origStudent ? `${origStudent.prefix}${origStudent.name} ${origStudent.lastname}` : studentId}
                </p>
                {origStudent && <p className="text-xs text-muted">{origStudent.university} · {origStudent.major}</p>}
                <p className="font-mono text-[10px] text-muted">{studentId}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-medium text-muted">ตำแหน่งงาน</p>
                <p className="text-sm font-semibold text-foreground">{origJob?.title ?? jobId}</p>
                {origJob && <p className="text-xs text-muted">{origJob.companyName}</p>}
                <p className="font-mono text-[10px] text-muted">{jobId}</p>
              </div>
            </div>
            {item.applicationId && (
              <p className="text-[10px] text-muted">
                อ้างอิงใบสมัคร: <span className="font-mono font-semibold">{item.applicationId}</span>
              </p>
            )}
          </div>

          {/* Period */}
          <div className="rounded-xl border border-border p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">📅 ระยะเวลาและชั่วโมง</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">วันเริ่มต้น <span className="text-red-500">*</span></label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">วันสิ้นสุด</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">ชั่วโมงที่ต้องทำทั้งหมด</label>
                <input type="number" min={0} value={hoursRequired}
                  onChange={e => setHoursRequired(Number(e.target.value))} className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">ชั่วโมงที่ทำแล้ว</label>
                <input type="number" min={0} value={hoursCompleted}
                  onChange={e => setHoursCompleted(Number(e.target.value))} className={inputCls} />
              </div>
            </div>
            {hoursRequired > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted">
                  <span>ความคืบหน้า</span>
                  <span className="font-semibold text-foreground">{calcProgress(hoursCompleted, hoursRequired)}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-border overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${calcProgress(hoursCompleted, hoursRequired)}%` }} />
                </div>
              </div>
            )}
          </div>

          {/* Personnel */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">ผู้ดูแล (บริษัท)</label>
              <input value={supervisorName} onChange={e => setSupervisorName(e.target.value)} className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">อาจารย์ที่ปรึกษา</label>
              <input value={advisorName} onChange={e => setAdvisorName(e.target.value)} className={inputCls} />
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-foreground">สถานะ</p>
            <div className="grid grid-cols-2 gap-2">
              {INTERNSHIP_STATUSES.map(s => {
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

          {/* Grade + Note */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">เกรด</label>
              <select value={grade} onChange={e => setGrade(e.target.value)} className={selectCls}>
                <option value="">— ยังไม่ประเมิน —</option>
                {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">หมายเหตุ</label>
              <textarea value={note} onChange={e => setNote(e.target.value)} rows={1}
                className={inputCls + " resize-none"} />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4 shrink-0">
          <button type="button" onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors">
            ยกเลิก
          </button>
          <button type="button" disabled={!isValid}
            onClick={() => {
              onConfirm({ studentId, jobId, startDate, endDate, hoursCompleted, hoursRequired,
                supervisorName, advisorName, status, grade, note });
              onClose();
            }}
            className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed">
            บันทึกการแก้ไข
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

// ── Main Component ────────────────────────────────────────────
export default function InternshipListClient() {
  const { internships, ready, addInternship, updateInternship, deleteInternship, replaceAll } = useInternships();
  const { students } = useStudents();
  const { jobs }     = useJobs();
  const { mappings } = useMappings();

  const [searchInput, setSearchInput]   = useState("");
  const [keywords, setKeywords]         = useState(() => loadFilters().keywords ?? []);
  const [filterStatus, setFilterStatus] = useState(() => loadFilters().filterStatus ?? "ทั้งหมด");
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

  useEffect(() => {
    saveFilters({ keywords, filterStatus, filterField, filterUniv, sortBy });
  }, [keywords, filterStatus, filterField, filterUniv, sortBy]);

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
    setFilterField("ทั้งหมด"); setFilterUniv("ทั้งหมด");
    setSortBy("default"); setPage(1);
  };

  const handleImport = (rows, mode) => {
    if (mode === "replace") {
      const list = rows.map((r, i) => ({
        id: r.id?.trim() || `INT-IMP-${i + 1}`,
        applicationId: r.applicationId ?? "",
        studentId: r.studentId?.trim(),
        jobId: r.jobId?.trim(),
        startDate: r.startDate || new Date().toISOString().slice(0, 10),
        endDate: r.endDate ?? "",
        hoursCompleted: Number(r.hoursCompleted) || 0,
        hoursRequired: Number(r.hoursRequired) || 160,
        supervisorName: r.supervisorName ?? "",
        advisorName: r.advisorName ?? "",
        status: INTERNSHIP_STATUSES.includes(r.status) ? r.status : "อยู่ในระหว่างฝึกงาน",
        grade: r.grade ?? "",
        note: r.note ?? "",
        createdAt: r.createdAt || new Date().toISOString().slice(0, 10),
      }));
      replaceAll(list);
      setImportDone({ count: list.length, mode: "replace" });
    } else {
      const existingKeys = new Set(internships.map(m => `${m.studentId}|${m.jobId}`));
      let added = 0;
      rows.forEach((r, i) => {
        const key = `${r.studentId?.trim()}|${r.jobId?.trim()}`;
        if (!existingKeys.has(key)) {
          addInternship({
            id: r.id?.trim() || nextId([...internships]),
            applicationId: r.applicationId ?? "",
            studentId: r.studentId?.trim(),
            jobId: r.jobId?.trim(),
            startDate: r.startDate || new Date().toISOString().slice(0, 10),
            endDate: r.endDate ?? "",
            hoursCompleted: Number(r.hoursCompleted) || 0,
            hoursRequired: Number(r.hoursRequired) || 160,
            supervisorName: r.supervisorName ?? "",
            advisorName: r.advisorName ?? "",
            status: INTERNSHIP_STATUSES.includes(r.status) ? r.status : "อยู่ในระหว่างฝึกงาน",
            grade: r.grade ?? "",
            note: r.note ?? "",
            createdAt: r.createdAt || new Date().toISOString().slice(0, 10),
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
  const joined = useMemo(() => internships.map(m => ({
    ...m,
    student: students.find(s => s.id === m.studentId),
    job:     jobs.find(j => j.id === m.jobId),
  })), [internships, students, jobs]);

  const filtered = useMemo(() => {
    let list = joined.filter(m => m.job?.type === "ฝึกงาน" || !m.job);
    if (keywords.length > 0) {
      list = list.filter(m => keywords.every(kw => {
        const q = kw.toLowerCase();
        const s = m.student; const j = m.job;
        return [m.id, m.applicationId, m.studentId, m.jobId, m.status, m.supervisorName, m.advisorName, m.grade,
          s?.name, s?.lastname, s?.nameEn, s?.lastnameEn, s?.nickname, s?.university, s?.major,
          j?.title, j?.titleEn, j?.companyName, j?.field,
        ].some(v => String(v ?? "").toLowerCase().includes(q));
      }));
    }
    if (searchInput.trim()) {
      const q = searchInput.trim().toLowerCase();
      list = list.filter(m => {
        const s = m.student; const j = m.job;
        return [m.id, m.applicationId, m.studentId, m.jobId, m.status, m.supervisorName, m.advisorName, m.grade,
          s?.name, s?.lastname, s?.nameEn, s?.lastnameEn, s?.nickname, s?.university, s?.major,
          j?.title, j?.titleEn, j?.companyName, j?.field,
        ].some(v => String(v ?? "").toLowerCase().includes(q));
      });
    }
    if (filterStatus !== "ทั้งหมด") list = list.filter(m => m.status === filterStatus);
    if (filterField  !== "ทั้งหมด") list = list.filter(m => m.job?.field === filterField);
    if (filterUniv   !== "ทั้งหมด") list = list.filter(m => m.student?.university === filterUniv);
    switch (sortBy) {
      case "start-desc": list.sort((a, b) => (b.startDate ?? "").localeCompare(a.startDate ?? "")); break;
      case "start-asc":  list.sort((a, b) => (a.startDate ?? "").localeCompare(b.startDate ?? "")); break;
      case "student":    list.sort((a, b) => ((a.student?.name ?? "") + (a.student?.lastname ?? "")).localeCompare((b.student?.name ?? "") + (b.student?.lastname ?? ""), "th")); break;
      case "progress":   list.sort((a, b) => calcProgress(b.hoursCompleted, b.hoursRequired) - calcProgress(a.hoursCompleted, a.hoursRequired)); break;
      case "id-asc":     list.sort((a, b) => a.id.localeCompare(b.id)); break;
      default: break;
    }
    return list;
  }, [joined, keywords, filterStatus, filterField, filterUniv, sortBy, searchInput]);

  const activeTerms = [...keywords, searchInput.trim()].filter(Boolean);

  const hasActiveFilter = keywords.length > 0 || filterStatus !== "ทั้งหมด" ||
    filterField !== "ทั้งหมด" || filterUniv !== "ทั้งหมด" || sortBy !== "default";

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd   = Math.min(safePage * pageSize, filtered.length);

  const statusSummary = useMemo(() =>
    INTERNSHIP_STATUSES.map(s => ({ label: s, count: internships.filter(m => m.status === s).length, cfg: STATUS_CONFIG[s] })),
    [internships]
  );

  const handleAdd = (data) => {
    addInternship({
      id: nextId(internships),
      createdAt: new Date().toISOString().slice(0, 10),
      ...data,
    });
    setPage(1);
  };

  if (!ready) return <div className="flex items-center justify-center py-24 text-sm text-muted">กำลังโหลดข้อมูล...</div>;

  return (
    <div className="space-y-6 p-6">

      {/* Modals */}
      {showAdd && (
        <AddInternshipModal students={students} jobs={jobs} mappings={mappings} internships={internships}
          onClose={() => setShowAdd(false)} onConfirm={handleAdd} />
      )}
      {showImport && <ImportModal onClose={() => setShowImport(false)} onConfirm={handleImport} />}
      {editTarget && (
        <EditInternshipModal item={editTarget} students={students} jobs={jobs} mappings={mappings} internships={internships}
          onClose={() => setEditTarget(null)}
          onConfirm={(data) => { updateInternship(editTarget.id, data); setEditTarget(null); }} />
      )}
      {deleteTarget && (() => {
        const s = students.find(x => x.id === deleteTarget.studentId);
        const studentName = s ? `${s.prefix}${s.name} ${s.lastname}` : deleteTarget.studentId;
        const jobTitle = jobs.find(j => j.id === deleteTarget.jobId)?.title ?? deleteTarget.jobId;
        return (
          <ConfirmDeleteModal
            heading="ยืนยันการลบรายการฝึกงาน"
            confirmLabel="ลบรายการ"
            onConfirm={() => { deleteInternship(deleteTarget.id); setDeleteTarget(null); }}
            onCancel={() => setDeleteTarget(null)}
          >
            <p className="mt-2 text-sm text-muted font-mono">{deleteTarget.id}</p>
            <p className="mt-1 text-sm text-foreground">
              ลบรายการฝึกงานของ <span className="font-semibold">{studentName}</span>
            </p>
            <p className="text-xs text-muted">ที่ {jobTitle}</p>
          </ConfirmDeleteModal>
        );
      })()}

      {/* Import success */}
      {importDone && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span>
            {importDone.mode === "replace"
              ? `นำเข้าสำเร็จ — แทนที่ด้วยข้อมูลใหม่ทั้งหมด ${importDone.count} รายการ`
              : `รวมข้อมูลสำเร็จ — เพิ่มใหม่ ${importDone.added} รายการ`}
          </span>
        </div>
      )}

      {/* ── Status pills ── */}
      <div className="flex flex-wrap gap-2">
        {statusSummary.map(({ label, count, cfg }) => (
          <button key={label}
            onClick={() => { setFilterStatus(filterStatus === label ? "ทั้งหมด" : label); setPage(1); }}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold transition-all ${
              filterStatus === label
                ? cfg.color + " ring-2 ring-offset-1 ring-current"
                : "border-border bg-surface text-muted hover:border-primary hover:text-primary"
            }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
            {label}
            <span className="rounded-full bg-black/10 px-1.5 py-0.5 text-[10px] font-bold">{count}</span>
          </button>
        ))}
      </div>

      {/* ── Filter bar ── */}
      <div className="flex flex-col gap-3">
        {/* Row 1: search + action buttons */}
        <div className="flex items-center gap-2">
          <div className="relative w-80 shrink-0">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none"
              xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
            <input type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addKeyword(searchInput); } }}
              placeholder="ชื่อนักเรียน / ตำแหน่ง / บริษัท แล้วกด Enter"
              className="w-full rounded-lg border border-border bg-surface pl-9 pr-4 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-accent-soft" />
          </div>
          <button onClick={() => addKeyword(searchInput)} disabled={!searchInput.trim()}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
            ค้นหา
          </button>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <button onClick={() => exportCSV(filtered, students, jobs)}
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
            <button onClick={() => setShowAdd(true)}
              className="btn-primary inline-flex items-center gap-1.5 whitespace-nowrap">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              เพิ่มรายการฝึกงาน
            </button>
          </div>
        </div>

        {/* Row 2: dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-accent-soft">
            <option value="ทั้งหมด">📋 สถานะทั้งหมด</option>
            {INTERNSHIP_STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
          <select value={filterUniv} onChange={e => { setFilterUniv(e.target.value); setPage(1); }}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-accent-soft">
            <option value="ทั้งหมด">🏫 มหาวิทยาลัยทั้งหมด</option>
            {UNIVERSITIES.map(u => <option key={u}>{u}</option>)}
          </select>
          <select value={filterField} onChange={e => { setFilterField(e.target.value); setPage(1); }}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-accent-soft">
            <option value="ทั้งหมด">🔬 สาขาทั้งหมด</option>
            {JOB_FIELDS.map(f => <option key={f}>{f}</option>)}
          </select>
          <select value={sortBy} onChange={e => { setSortBy(e.target.value); setPage(1); }}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-accent-soft">
            <option value="default">⇅ ค่าเริ่มต้น</option>
            <option value="id-asc">🔢 เรียงตามรหัส</option>
            <option value="start-desc">📅 วันเริ่มล่าสุดก่อน</option>
            <option value="start-asc">📅 วันเริ่มเก่าสุดก่อน</option>
            <option value="student">👤 เรียงตามชื่อนักเรียน</option>
            <option value="progress">📊 ความคืบหน้ามากสุดก่อน</option>
          </select>
        </div>
      </div>

      {/* ── Active filter chips ── */}
      {hasActiveFilter && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted">กรองด้วย:</span>
          {filterStatus !== "ทั้งหมด" && (
            <button onClick={() => { setFilterStatus("ทั้งหมด"); setPage(1); }}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-accent-soft px-2.5 py-1 text-xs font-semibold text-primary hover:border-red-400 hover:bg-red-50 hover:text-red-500 transition-colors">
              📋 {filterStatus}<XIcon />
            </button>
          )}
          {filterUniv !== "ทั้งหมด" && (
            <button onClick={() => { setFilterUniv("ทั้งหมด"); setPage(1); }}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-accent-soft px-2.5 py-1 text-xs font-semibold text-primary hover:border-red-400 hover:bg-red-50 hover:text-red-500 transition-colors">
              🏫 {filterUniv}<XIcon />
            </button>
          )}
          {filterField !== "ทั้งหมด" && (
            <button onClick={() => { setFilterField("ทั้งหมด"); setPage(1); }}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-accent-soft px-2.5 py-1 text-xs font-semibold text-primary hover:border-red-400 hover:bg-red-50 hover:text-red-500 transition-colors">
              🔬 {filterField}<XIcon />
            </button>
          )}
          {sortBy !== "default" && (
            <button onClick={() => { setSortBy("default"); setPage(1); }}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-accent-soft px-2.5 py-1 text-xs font-semibold text-primary hover:border-red-400 hover:bg-red-50 hover:text-red-500 transition-colors">
              ⇅ {{"id-asc":"เรียงตามรหัส","start-desc":"วันเริ่มล่าสุด","start-asc":"วันเริ่มเก่าสุด","student":"ชื่อนักเรียน","progress":"ความคืบหน้า"}[sortBy]}<XIcon />
            </button>
          )}
          {keywords.map(kw => (
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
                <th className="px-3 py-3 text-left text-xs font-semibold text-muted whitespace-nowrap">รหัส</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-muted whitespace-nowrap">นักเรียน</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-muted whitespace-nowrap">บริษัท / ตำแหน่งงาน</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-muted whitespace-nowrap">ระยะเวลา</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-muted whitespace-nowrap w-36">ความคืบหน้า</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-muted whitespace-nowrap">สถานะ</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-muted whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <p className="text-2xl mb-2">🎓</p>
                    <p className="text-sm font-medium text-foreground">ไม่พบรายการฝึกงาน</p>
                    <p className="text-xs text-muted mt-1">ลองเปลี่ยนคำค้นหาหรือตัวกรอง</p>
                    {hasActiveFilter && (
                      <button onClick={clearFilters} className="mt-4 text-sm font-medium text-primary hover:underline">ล้างตัวกรองทั้งหมด</button>
                    )}
                  </td>
                </tr>
              ) : paginated.map((m, i) => {
                const s    = m.student;
                const j    = m.job;
                const sCfg = STATUS_CONFIG[m.status] ?? STATUS_CONFIG["อยู่ในระหว่างฝึกงาน"];
                const pct  = calcProgress(m.hoursCompleted, m.hoursRequired);
                return (
                  <tr key={m.id} className={`border-b border-border last:border-0 hover:bg-surface-muted/40 transition-colors ${i % 2 !== 0 ? "bg-surface-muted/20" : ""}`}>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <Link href={`/admin/marketplace/internship-tracking/${m.id}`}
                        className="font-mono text-xs text-muted hover:text-primary hover:underline transition-colors">
                        {m.id}
                      </Link>
                      {m.applicationId && (
                        <p className="text-[10px] text-muted/60 font-mono">↳ {m.applicationId}</p>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {s ? (
                        <>
                          <Link href={`/admin/students/${s.id}`}
                            className="text-xs font-semibold text-foreground hover:text-primary hover:underline transition-colors">
                            <HighlightText text={`${s.prefix}${s.name} ${s.lastname}`} terms={activeTerms} />
                          </Link>
                          <p className="text-[11px] text-muted"><HighlightText text={s.university} terms={activeTerms} /></p>
                          {s.major && <p className="text-[10px] text-muted/70">{s.major}</p>}
                        </>
                      ) : (
                        <span className="text-xs text-muted font-mono">{m.studentId}</span>
                      )}
                    </td>
                    <td className="px-3 py-3 max-w-[200px]">
                      {j ? (
                        <>
                          <Link href={`/admin/marketplace/job-positions/${j.id}`}
                            className="text-xs font-semibold text-foreground hover:text-primary hover:underline transition-colors line-clamp-1">
                            <HighlightText text={j.title} terms={activeTerms} />
                          </Link>
                          <p className="text-[11px] text-muted line-clamp-1"><HighlightText text={j.companyName} terms={activeTerms} /></p>
                          {j.type && (
                            <span className={`mt-0.5 inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${TYPE_BADGE[j.type] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>{j.type}</span>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-muted font-mono">{m.jobId}</span>
                      )}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-xs text-foreground">
                      <p>{formatDate(m.startDate)}</p>
                      {m.endDate && <p className="text-[10px] text-muted">→ {formatDate(m.endDate)}</p>}
                    </td>
                    <td className="px-3 py-3 w-36">
                      {m.hoursRequired > 0 ? (
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-muted">
                            <span>{m.hoursCompleted}/{m.hoursRequired} ชม.</span>
                            <span className="font-semibold text-foreground">{pct}%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${pct >= 100 ? "bg-emerald-500" : pct >= 50 ? "bg-primary" : "bg-amber-400"}`}
                              style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${sCfg.color}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${sCfg.dot}`} />
                        {m.status}
                      </span>
                      {m.grade && <p className="mt-0.5 text-[10px] font-semibold text-foreground">เกรด {m.grade}</p>}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <Link href={`/admin/marketplace/internship-tracking/${m.id}`} title="ดูข้อมูล"
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted hover:border-primary hover:text-primary transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                          </svg>
                        </Link>
                        <button onClick={() => setEditTarget(m)} title="แก้ไข"
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted hover:border-amber-500 hover:text-amber-500 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        <button onClick={() => setDeleteTarget(m)} title="ลบ"
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted hover:border-red-500 hover:text-red-500 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-xs text-muted">
          {filtered.length === 0 ? "ไม่พบรายการ" : (
            <>แสดง <span className="font-semibold text-foreground">{rangeStart}–{rangeEnd}</span> จาก <span className="font-semibold text-foreground">{filtered.length}</span> รายการ
              {filtered.length < internships.length && <> (กรองจากทั้งหมด <span className="font-semibold text-foreground">{internships.length}</span> รายการ)</>}
            </>
          )}
        </p>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-muted">
            <span>แสดง</span>
            <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="rounded-lg border border-border bg-surface px-2 py-1.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-accent-soft">
              {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <span>รายการต่อหน้า</span>
          </div>
          <Pagination page={safePage} totalPages={totalPages} onPage={setPage} />
        </div>
      </div>
    </div>
  );
}
