"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminTable from "@/components/admin/ui/AdminTable";
import { useJobs } from "@/components/admin/contexts/JobContext";

// ── Constants ─────────────────────────────────────────────────

const JOB_TYPES  = ["ฝึกงาน", "งานประจำ"];
const JOB_FIELDS = [
  "วิศวกรรมคอมพิวเตอร์", "วิศวกรรมเครื่องกล", "วิศวกรรมไฟฟ้า",
  "วิศวกรรมอุตสาหการ", "วิศวกรรมเมคคาทรอนิกส์", "วิศวกรรมโยธา",
  "วิศวกรรมเคมี", "การออกแบบอุตสาหกรรม",
];
const JOB_STATUSES = ["เปิดรับ", "เต็มแล้ว", "ปิดรับ"];
const PAGE_SIZE_OPTIONS = [10, 20, 30, 50];

const selectCls = "rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-accent-soft";
const labelCls  = "text-xs font-medium text-foreground";
const chipBase  = "inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-accent-soft px-2.5 py-1 text-xs font-semibold text-primary hover:border-red-400 hover:bg-red-50 hover:text-red-500 transition-colors";

const STATUS_CONFIG = {
  เปิดรับ:  { color: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  เต็มแล้ว: { color: "bg-blue-100 text-blue-700 border-blue-200",          dot: "bg-blue-500"   },
  ปิดรับ:   { color: "bg-gray-100 text-gray-500 border-gray-200",          dot: "bg-gray-400"   },
};

const TYPE_BADGE = {
  ฝึกงาน:   "bg-sky-50 text-sky-700 border-sky-200",
  งานประจำ: "bg-violet-50 text-violet-700 border-violet-200",
};

// ── CSV helpers ───────────────────────────────────────────────

const CSV_HEADERS = [
  "id", "title", "titleEn", "companyName", "type", "field", "location", "country",
  "salary", "duration", "startDate", "deadline", "slots", "applications",
  "status", "description", "requirements", "welfare", "tags", "note",
];

function toCSVField(val) {
  const s = String(val ?? "");
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

function exportCSV(jobs, filename = `job-positions_${new Date().toISOString().slice(0, 10)}.csv`) {
  const rows = [
    CSV_HEADERS.join(","),
    ...jobs.map((j) => CSV_HEADERS.map((h) => toCSVField(j[h])).join(",")),
  ];
  const blob = new Blob(["﻿" + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function parseCSVLine(line) {
  const values = []; let cur = "", inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++; } else inQ = !inQ;
    } else if (ch === "," && !inQ) { values.push(cur); cur = ""; }
    else cur += ch;
  }
  values.push(cur);
  return values;
}

function parseCSV(text) {
  const lines   = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter(l => l.trim());
  if (lines.length < 2) return { error: "ไฟล์ว่างหรือไม่มีข้อมูล" };
  const headers = parseCSVLine(lines[0]).map(h => h.trim());
  const missing = ["id", "title"].filter(r => !headers.includes(r));
  if (missing.length) return { error: `ไม่พบคอลัมน์ที่จำเป็น: ${missing.join(", ")}` };
  const rows = lines.slice(1).map(line => {
    const vals = parseCSVLine(line);
    const obj  = {};
    headers.forEach((h, i) => { obj[h] = vals[i] ?? ""; });
    if (obj.slots)        obj.slots        = parseInt(obj.slots, 10) || 0;
    if (obj.applications) obj.applications = parseInt(obj.applications, 10) || 0;
    return obj;
  }).filter(r => r.id?.trim() && r.title?.trim());
  if (!rows.length) return { error: "ไม่พบข้อมูลตำแหน่งงานที่ถูกต้องในไฟล์" };
  return { rows, headers };
}

// ── Import Modal ──────────────────────────────────────────────

function ImportModal({ onClose, onConfirm }) {
  const [step, setStep]   = useState("upload");
  const [parsed, setParsed] = useState(null);
  const [mode, setMode]   = useState("replace");
  const [error, setError] = useState("");
  const fileRef           = useRef(null);

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
              <p className="text-sm font-semibold text-foreground">นำเข้าข้อมูลตำแหน่งงาน</p>
              <p className="text-xs text-muted">
                {step === "upload" ? "เลือกไฟล์ CSV ที่ต้องการนำเข้า" : `พบข้อมูล ${parsed?.rows.length} รายการ`}
              </p>
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
              <input ref={fileRef} type="file" accept=".csv" className="hidden"
                onChange={e => handleFile(e.target.files[0])} />
              <div
                className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border py-10 hover:border-primary hover:bg-accent-soft/30 transition-colors"
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
              {error && <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600 border border-red-200">{error}</p>}
              <div className="rounded-lg bg-surface-muted px-4 py-3 text-xs text-muted">
                <p className="font-semibold text-foreground mb-1">คอลัมน์ที่รองรับ</p>
                <p className="font-mono leading-relaxed">{CSV_HEADERS.join(", ")}</p>
                <p className="mt-1">คอลัมน์บังคับ: <span className="font-semibold text-foreground">id, title</span></p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "replace", label: "แทนที่ทั้งหมด", desc: "ลบข้อมูลเดิมทั้งหมดแล้วใช้ข้อมูลใหม่" },
                  { value: "merge",   label: "รวมข้อมูล",     desc: "เพิ่มรายการใหม่ / อัปเดตรายการที่มี ID ซ้ำ" },
                ].map(opt => (
                  <button key={opt.value} onClick={() => setMode(opt.value)}
                    className={`rounded-xl border p-3 text-left transition-all ${mode === opt.value ? "border-primary bg-accent-soft ring-2 ring-primary/20" : "border-border hover:border-primary"}`}>
                    <p className="text-sm font-semibold text-foreground">{opt.label}</p>
                    <p className="text-xs text-muted mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>
              <div className="overflow-hidden rounded-xl border border-border">
                <div className="border-b border-border bg-surface-muted px-4 py-2 text-xs font-semibold text-muted">
                  ตัวอย่างข้อมูล (5 รายการแรก)
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border">
                        {["รหัส", "ตำแหน่ง", "บริษัท", "ประเภท", "สถานะ"].map(h => (
                          <th key={h} className="px-3 py-2 text-left font-semibold text-muted">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {parsed.rows.slice(0, 5).map((row, i) => (
                        <tr key={i} className="border-b border-border last:border-0">
                          <td className="px-3 py-2 font-mono text-muted">{row.id}</td>
                          <td className="px-3 py-2 text-foreground">{row.title}</td>
                          <td className="px-3 py-2 text-muted">{row.companyName || "—"}</td>
                          <td className="px-3 py-2 text-muted">{row.type || "—"}</td>
                          <td className="px-3 py-2 text-muted">{row.status || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parsed.rows.length > 5 && (
                  <div className="border-t border-border bg-surface-muted px-4 py-2 text-xs text-muted">
                    และอีก {parsed.rows.length - 5} รายการ
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between pt-1">
                <button onClick={() => { setStep("upload"); setParsed(null); }}
                  className="text-sm text-muted hover:text-foreground transition-colors">
                  ← เลือกไฟล์ใหม่
                </button>
                <div className="flex gap-2">
                  <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors">ยกเลิก</button>
                  <button onClick={() => { onConfirm(parsed.rows, mode); onClose(); }} className="btn-primary">
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

// ── Delete Modal ──────────────────────────────────────────────

function DeleteModal({ job, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm rounded-2xl border border-border bg-surface shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <div className="flex flex-col items-center px-6 pt-8 pb-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-foreground">ยืนยันการลบตำแหน่งงาน</h2>
          <p className="mt-2 text-sm text-muted">คุณต้องการลบตำแหน่ง</p>
          <p className="mt-1 font-semibold text-foreground">{job.title}</p>
          <p className="text-xs text-muted">{job.companyName}</p>
          <div className="mt-3 w-full rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-600">
            ⚠️ การดำเนินการนี้ไม่สามารถย้อนกลับได้
          </div>
        </div>
        <div className="flex gap-3 border-t border-border px-6 py-4">
          <button onClick={onCancel} className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-surface-muted transition-colors">ยกเลิก</button>
          <button onClick={onConfirm} className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 transition-colors">ลบข้อมูล</button>
        </div>
      </div>
    </div>
  );
}

// ── Bulk Delete Modal ─────────────────────────────────────────

function BulkDeleteModal({ count, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm rounded-2xl border border-border bg-surface shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <div className="flex flex-col items-center px-6 pt-8 pb-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-foreground">ยืนยันการลบหลายรายการ</h2>
          <p className="mt-2 text-sm text-muted">คุณต้องการลบตำแหน่งงานที่เลือกทั้งหมด</p>
          <p className="mt-1 text-2xl font-extrabold text-red-500">{count}</p>
          <p className="text-xs text-muted">รายการ</p>
          <div className="mt-3 w-full rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-600">
            ⚠️ การดำเนินการนี้ไม่สามารถย้อนกลับได้
          </div>
        </div>
        <div className="flex gap-3 border-t border-border px-6 py-4">
          <button onClick={onCancel} className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-surface-muted transition-colors">ยกเลิก</button>
          <button onClick={onConfirm} className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 transition-colors">ลบ {count} รายการ</button>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────

function formatDeadline(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}
function isExpired(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}
function HighlightText({ text, terms }) {
  if (!text || !terms.length) return <>{text}</>;
  const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const parts   = text.split(new RegExp(`(${escaped.join("|")})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1
          ? <mark key={i} className="rounded bg-amber-100 text-amber-800 px-0.5 not-italic">{part}</mark>
          : <span key={i}>{part}</span>
      )}
    </>
  );
}
function matchField(j, kw) {
  const q = kw.toLowerCase();
  return [j.id, j.title, j.titleEn, j.companyName, j.field, j.location, j.type, j.status]
    .some(v => String(v ?? "").toLowerCase().includes(q));
}

// ── Pagination ────────────────────────────────────────────────

function Pagination({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null;
  const pages = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push("…");
    pages.push(totalPages);
  }
  const btnBase = "flex h-8 min-w-[2rem] items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors";
  return (
    <div className="flex items-center gap-1">
      <button disabled={page === 1} onClick={() => onPage(page - 1)}
        className={`${btnBase} border border-border text-muted hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed`}>‹</button>
      {pages.map((p, i) => p === "…" ? (
        <span key={`e${i}`} className="px-1 text-sm text-muted select-none">…</span>
      ) : (
        <button key={p} onClick={() => onPage(p)}
          className={`${btnBase} border ${p === page ? "border-primary bg-primary text-white" : "border-border text-muted hover:border-primary hover:text-primary"}`}>
          {p}
        </button>
      ))}
      <button disabled={page === totalPages} onClick={() => onPage(page + 1)}
        className={`${btnBase} border border-border text-muted hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed`}>›</button>
    </div>
  );
}

// ── Filter persistence ────────────────────────────────────────

const FILTER_KEY = "job-list-filters";
function loadFilters() {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(sessionStorage.getItem(FILTER_KEY)) ?? {}; } catch { return {}; }
}
function saveFilters(data) {
  try { sessionStorage.setItem(FILTER_KEY, JSON.stringify(data)); } catch { /* ignore */ }
}

// ── Icon helpers ──────────────────────────────────────────────

function XIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  );
}

// ── EmptyState ────────────────────────────────────────────────

function EmptyState({ hasFilter, onClear, onNew }) {
  if (hasFilter) return (
    <div className="py-16 text-center">
      <p className="text-3xl mb-3">🔍</p>
      <p className="text-sm font-semibold text-foreground">ไม่พบตำแหน่งงานที่ตรงกับเงื่อนไข</p>
      <p className="text-xs text-muted mt-1 mb-4">ลองเปลี่ยนคำค้นหาหรือตัวกรอง</p>
      <button onClick={onClear} className="text-sm font-medium text-primary hover:underline">ล้างตัวกรองทั้งหมด</button>
    </div>
  );
  return (
    <div className="py-16 text-center">
      <p className="text-3xl mb-3">💼</p>
      <p className="text-sm font-semibold text-foreground">ยังไม่มีตำแหน่งงาน</p>
      <p className="text-xs text-muted mt-1 mb-4">เพิ่มตำแหน่งงานแรก หรือนำเข้าจาก CSV</p>
      <Link href="/admin/marketplace/job-positions/new" className="btn-primary text-sm">+ เพิ่มตำแหน่งงาน</Link>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────

export default function JobListClient() {
  const router = useRouter();
  const { jobs, ready, deleteJob, addJob, updateJob, replaceAll } = useJobs();

  // ── Filters ──
  const [activeTab,    setActiveTab]    = useState(() => loadFilters().activeTab    ?? "ทั้งหมด");
  const [searchInput,  setSearchInput]  = useState("");
  const [keywords,     setKeywords]     = useState(() => loadFilters().keywords     ?? []);
  const [filterStatus, setFilterStatus] = useState(() => loadFilters().filterStatus ?? "ทั้งหมด");
  const [filterType,   setFilterType]   = useState(() => loadFilters().filterType   ?? "ทั้งหมด");
  const [filterField,  setFilterField]  = useState(() => loadFilters().filterField  ?? "ทั้งหมด");
  const [sortBy,       setSortBy]       = useState(() => loadFilters().sortBy       ?? "default");
  const [pageSize,     setPageSize]     = useState(20);
  const [page,         setPage]         = useState(1);

  // ── Selection (เหมือน student) ──
  const [selectedIds,   setSelectedIds]   = useState(new Set());
  const [showBulkDel,   setShowBulkDel]   = useState(false);

  // ── Modals ──
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showImport,   setShowImport]   = useState(false);
  const [importDone,   setImportDone]   = useState(null);

  useEffect(() => {
    saveFilters({ activeTab, keywords, filterStatus, filterType, filterField, sortBy });
  }, [activeTab, keywords, filterStatus, filterType, filterField, sortBy]);

  // ── Tab switch ──
  const switchTab = useCallback((tab) => {
    setActiveTab(tab); setFilterType("ทั้งหมด"); setPage(1); setSelectedIds(new Set());
  }, []);

  // ── Keyword search ──
  const addKeyword = useCallback((raw) => {
    const kw = raw.trim();
    if (!kw || keywords.includes(kw)) return;
    setKeywords(prev => [...prev, kw]); setSearchInput(""); setPage(1); setSelectedIds(new Set());
  }, [keywords]);

  const removeKeyword = useCallback((kw) => {
    setKeywords(prev => prev.filter(k => k !== kw)); setPage(1);
  }, []);

  const clearFilters = () => {
    setKeywords([]); setSearchInput(""); setFilterStatus("ทั้งหมด");
    setFilterType("ทั้งหมด"); setFilterField("ทั้งหมด"); setSortBy("default"); setPage(1);
  };

  // ── Tab counts ──
  const tabCounts = useMemo(() => ({
    ทั้งหมด: jobs.length,
    ฝึกงาน:  jobs.filter(j => j.type === "ฝึกงาน").length,
    งานประจำ: jobs.filter(j => j.type === "งานประจำ").length,
  }), [jobs]);

  // ── Import ──
  const handleImport = (rows, mode) => {
    if (mode === "replace") {
      replaceAll(rows);
      setImportDone({ count: rows.length, mode: "replace" });
    } else {
      const existingIds = new Set(jobs.map(j => j.id));
      let added = 0, updated = 0;
      rows.forEach(row => {
        if (existingIds.has(row.id)) { updateJob(row.id, row); updated++; }
        else { addJob(row); added++; }
      });
      setImportDone({ added, updated, mode: "merge" });
    }
    setPage(1); setSelectedIds(new Set());
    setTimeout(() => setImportDone(null), 4000);
  };

  // ── Filtered list ──
  const filtered = useMemo(() => {
    let list = [...jobs];
    if (activeTab === "ฝึกงาน")   list = list.filter(j => j.type === "ฝึกงาน");
    if (activeTab === "งานประจำ") list = list.filter(j => j.type === "งานประจำ");
    if (keywords.length > 0)       list = list.filter(j => keywords.every(kw => matchField(j, kw)));
    if (searchInput.trim())        list = list.filter(j => matchField(j, searchInput.trim().toLowerCase()));
    if (filterStatus !== "ทั้งหมด") list = list.filter(j => j.status === filterStatus);
    if (filterType   !== "ทั้งหมด") list = list.filter(j => j.type   === filterType);
    if (filterField  !== "ทั้งหมด") list = list.filter(j => j.field  === filterField);
    switch (sortBy) {
      case "deadline-asc":  list.sort((a, b) => (a.deadline ?? "").localeCompare(b.deadline ?? "")); break;
      case "deadline-desc": list.sort((a, b) => (b.deadline ?? "").localeCompare(a.deadline ?? "")); break;
      case "applications":  list.sort((a, b) => (b.applications ?? 0) - (a.applications ?? 0)); break;
      case "title-asc":     list.sort((a, b) => (a.title ?? "").localeCompare(b.title ?? "", "th")); break;
    }
    return list;
  }, [jobs, activeTab, keywords, searchInput, filterStatus, filterType, filterField, sortBy]);

  const activeTerms = [...keywords, searchInput.trim()].filter(Boolean);
  const hasActiveFilter = keywords.length > 0 || filterStatus !== "ทั้งหมด" ||
    (activeTab === "ทั้งหมด" && filterType !== "ทั้งหมด") || filterField !== "ทั้งหมด" || sortBy !== "default";

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd   = Math.min(safePage * pageSize, filtered.length);

  // ── Status summary (tab-scoped) ──
  const tabScoped = useMemo(() => {
    if (activeTab === "ฝึกงาน")   return jobs.filter(j => j.type === "ฝึกงาน");
    if (activeTab === "งานประจำ") return jobs.filter(j => j.type === "งานประจำ");
    return jobs;
  }, [jobs, activeTab]);

  const statusSummary = useMemo(() => [
    { label: "ทั้งหมด", count: tabScoped.length, cfg: { color: "bg-surface-muted border-border text-foreground", dot: "bg-gray-400" } },
    ...JOB_STATUSES.map(s => ({ label: s, count: tabScoped.filter(j => j.status === s).length, cfg: STATUS_CONFIG[s] })),
  ], [tabScoped]);

  // ── Checkbox multi-select (เหมือน student) ──
  const pageIds = paginated.map(j => j.id);
  const allPageSelected  = pageIds.length > 0 && pageIds.every(id => selectedIds.has(id));
  const somePageSelected = pageIds.some(id => selectedIds.has(id)) && !allPageSelected;

  const toggleSelect = useCallback((id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleSelectPage = () => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allPageSelected) pageIds.forEach(id => next.delete(id));
      else pageIds.forEach(id => next.add(id));
      return next;
    });
  };

  const selectedJobs = jobs.filter(j => selectedIds.has(j.id));

  const handleBulkDelete = async () => {
    const ids = [...selectedIds];
    for (const id of ids) await deleteJob(id);
    setSelectedIds(new Set());
    setShowBulkDel(false);
  };

  // ── AdminTable columns ──
  // ตำแหน่งงาน ไม่กำหนด width → รับ space ที่เหลือทั้งหมด (ใหญ่สุด)
  // บริษัท/ที่ตั้ง กำหนด width คงที่ → ไม่แย่งพื้นที่จาก col หลัก
  const columns = [
    { label: (
        <input type="checkbox" checked={allPageSelected}
          ref={el => { if (el) el.indeterminate = somePageSelected; }}
          onChange={toggleSelectPage} onClick={e => e.stopPropagation()}
          className="rounded border-border" />
      ), width: "44px", align: "center" },
    { label: "ตำแหน่งงาน",        width: "200px" },
    { label: "สาขา",             width: "130px" },
    { label: "เงินเดือน",        width: "110px" },
    { label: "บริษัท / ที่ตั้ง", width: "175px" },
    { label: "ประเภท / ระยะเวลา", width: "120px" },
    { label: "สมัคร/รับ", align: "center", width: "96px" },
    { label: "ปิดรับ",           width: "102px" },
    { label: "สถานะ", align: "center", width: "108px" },
    { label: "จัดการ", align: "center", width: "115px" },
  ];

  const rows = paginated.map(j => {
    const statusCfg = STATUS_CONFIG[j.status] ?? STATUS_CONFIG["ปิดรับ"];
    const expired   = isExpired(j.deadline);

    return [
      // 0: Checkbox
      <input key="cb" type="checkbox" checked={selectedIds.has(j.id)} onChange={() => toggleSelect(j.id)}
        onClick={e => e.stopPropagation()} className="rounded border-border" />,

      // 1: ตำแหน่งงาน — ID + ชื่อ + EN + เงินเดือน
      <div key="title" className="min-w-0">
        <p className="text-[10px] font-mono text-muted/60 mb-0.5">{j.id}</p>
        <p className="text-xs font-semibold text-foreground line-clamp-1">
          <HighlightText text={j.title} terms={activeTerms} />
        </p>
        {j.titleEn && (
          <p className="text-[11px] text-muted line-clamp-1">
            <HighlightText text={j.titleEn} terms={activeTerms} />
          </p>
        )}
      </div>,

      // 1b: สาขา
      <div key="field" className="min-w-0">
        {j.field
          ? <p className="text-xs text-foreground line-clamp-2"><HighlightText text={j.field} terms={activeTerms} /></p>
          : <p className="text-xs text-muted/50">—</p>
        }
      </div>,

      // 1c: เงินเดือน
      <div key="salary" className="min-w-0">
        {j.salary
          ? <p className="text-xs font-medium text-emerald-600 line-clamp-2">{j.salary}</p>
          : <p className="text-xs text-muted/50">—</p>
        }
      </div>,

      // 2: บริษัท + ที่ตั้ง
      <div key="co" className="min-w-0 overflow-hidden">
        <p className="text-xs font-medium text-foreground truncate">
          <HighlightText text={j.companyName} terms={activeTerms} />
        </p>
        {(j.location || j.country) && (
          <p className="mt-0.5 text-[10px] text-muted truncate">
            📍 {[j.location, j.country && j.country !== "ไทย" ? j.country : null].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>,

      // 3: ประเภท + ระยะเวลา
      <div key="type" className="shrink-0">
        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${TYPE_BADGE[j.type] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
          {j.type}
        </span>
        {j.duration
          ? <p className="mt-1 text-[11px] text-sky-600">⏱ {j.duration}</p>
          : <p className="mt-1 text-[11px] text-muted/50">—</p>
        }
      </div>,

      // 4: สมัคร/รับ
      <p key="slots" className="text-xs text-center whitespace-nowrap">
        <span className="font-semibold text-foreground">{j.applications ?? 0}</span>
        <span className="text-muted"> / {j.slots > 0 ? j.slots : "—"}</span>
      </p>,

      // 5: ปิดรับ
      <div key="deadline" className="shrink-0">
        <p className={`text-xs whitespace-nowrap ${expired && j.status === "เปิดรับ" ? "text-red-500 font-medium" : "text-foreground"}`}>
          {formatDeadline(j.deadline)}
        </p>
        {expired && j.status === "เปิดรับ" && (
          <p className="text-[10px] text-red-400">เกินกำหนด</p>
        )}
      </div>,

      // 6: สถานะ
      <span key="status" className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${statusCfg.color}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
        {j.status}
      </span>,

      // 7: Actions
      <div key="actions" className="flex items-center justify-center gap-1">
        <Link href={`/admin/marketplace/job-positions/${j.id}`} title="ดูรายละเอียด"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted hover:border-primary hover:text-primary transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
          </svg>
        </Link>
        <Link href={`/admin/marketplace/job-positions/${j.id}?edit=1`} title="แก้ไข"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted hover:border-amber-500 hover:text-amber-500 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
        </Link>
        <button onClick={() => setDeleteTarget(j)} title="ลบ"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted hover:border-red-500 hover:text-red-500 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </button>
      </div>,
    ];
  });

  if (!ready) return (
    <div className="flex items-center justify-center py-24 text-sm text-muted">กำลังโหลดข้อมูล...</div>
  );

  return (
    <div className="space-y-5">

      {/* ── Import modal ── */}
      {showImport && <ImportModal onClose={() => setShowImport(false)} onConfirm={handleImport} />}

      {/* ── Import success banner ── */}
      {importDone && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span>
            {importDone.mode === "replace"
              ? `นำเข้าสำเร็จ — แทนที่ด้วยข้อมูลใหม่ทั้งหมด ${importDone.count} รายการ`
              : `รวมข้อมูลสำเร็จ — เพิ่มใหม่ ${importDone.added} รายการ, อัปเดต ${importDone.updated} รายการ`}
          </span>
        </div>
      )}

      {/* ── Category tabs ── */}
      <div className="flex items-center gap-1 border-b border-border">
        {[
          { key: "ทั้งหมด",  icon: "🗂️", label: "ทั้งหมด" },
          { key: "ฝึกงาน",   icon: "🎓",  label: "ฝึกงาน"  },
          { key: "งานประจำ", icon: "💼",  label: "งานประจำ" },
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

      {/* ── Filter UI ── */}
      <div className="flex flex-col gap-3">
        {/* Row 1: search + actions */}
        <div className="flex items-center gap-2">
          <div className="relative w-80 shrink-0">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none"
              xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
            <input type="text" value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addKeyword(searchInput); } }}
              placeholder="ชื่อตำแหน่ง บริษัท สาขา ที่ตั้ง… (Enter เพื่อล็อก)"
              className="w-full rounded-lg border border-border bg-surface pl-9 pr-4 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-accent-soft" />
          </div>
          <button onClick={() => addKeyword(searchInput)} disabled={!searchInput.trim()}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            ค้นหา
          </button>
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
            <Link href="/admin/marketplace/job-positions/new"
              className="btn-primary inline-flex items-center gap-1.5 whitespace-nowrap">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              เพิ่มตำแหน่งงาน
            </Link>
          </div>
        </div>

        {/* Row 2: filter dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col gap-0.5">
            <label className={labelCls}>สถานะ</label>
            <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }} className={selectCls}>
              <option value="ทั้งหมด">📋 สถานะทั้งหมด</option>
              {JOB_STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          {activeTab === "ทั้งหมด" && (
            <div className="flex flex-col gap-0.5">
              <label className={labelCls}>ประเภท</label>
              <select value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1); }} className={selectCls}>
                <option value="ทั้งหมด">💼 ประเภททั้งหมด</option>
                {JOB_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          )}
          <div className="flex flex-col gap-0.5">
            <label className={labelCls}>สาขา</label>
            <select value={filterField} onChange={e => { setFilterField(e.target.value); setPage(1); }} className={selectCls}>
              <option value="ทั้งหมด">🔬 สาขาทั้งหมด</option>
              {JOB_FIELDS.map(f => <option key={f}>{f}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-0.5">
            <label className={labelCls}>เรียงลำดับ</label>
            <select value={sortBy} onChange={e => { setSortBy(e.target.value); setPage(1); }} className={selectCls}>
              <option value="default">⇅ ค่าเริ่มต้น</option>
              <option value="title-asc">🔤 ชื่อตำแหน่ง A-Z</option>
              <option value="deadline-asc">📅 ปิดรับเร็วสุดก่อน</option>
              <option value="deadline-desc">📅 ปิดรับล่าสุดก่อน</option>
              <option value="applications">👥 ผู้สมัครมากสุด</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Active filter chips ── */}
      {hasActiveFilter && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted">กรองด้วย:</span>
          {filterStatus !== "ทั้งหมด" && (
            <button onClick={() => { setFilterStatus("ทั้งหมด"); setPage(1); }} className={chipBase}>
              📋 {filterStatus}<XIcon />
            </button>
          )}
          {activeTab === "ทั้งหมด" && filterType !== "ทั้งหมด" && (
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
              ⇅ {{ "title-asc": "ชื่อตำแหน่ง A-Z", "deadline-asc": "ปิดรับเร็วสุดก่อน", "deadline-desc": "ปิดรับล่าสุดก่อน", applications: "ผู้สมัครมากสุด" }[sortBy]}<XIcon />
            </button>
          )}
          {keywords.map(kw => (
            <button key={kw} onClick={() => removeKeyword(kw)} className={chipBase}>
              🔍 &ldquo;{kw}&rdquo;<XIcon />
            </button>
          ))}
          <button onClick={clearFilters}
            className="text-xs font-medium text-muted hover:text-red-500 transition-colors underline underline-offset-2 ml-1">
            ล้างทั้งหมด
          </button>
        </div>
      )}

      {/* ── Selection bar (เหมือน student) ── */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-accent-soft px-4 py-2.5">
          <div className="flex items-center gap-3">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-primary text-[10px] font-bold text-white">
              {selectedIds.size}
            </span>
            <span className="text-sm font-medium text-primary">เลือกแล้ว {selectedIds.size} รายการ</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportCSV(selectedJobs, `job-selected_${new Date().toISOString().slice(0, 10)}.csv`)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-white px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/5 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              ส่งออก CSV
            </button>
            <button onClick={() => setShowBulkDel(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              ลบที่เลือก
            </button>
            <button onClick={() => setSelectedIds(new Set())}
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground transition-colors">
              <XIcon />ยกเลิก
            </button>
          </div>
        </div>
      )}

      {/* ── Table (AdminTable) ── */}
      {paginated.length === 0 ? (
        <div className="card">
          <EmptyState hasFilter={hasActiveFilter} onClear={clearFilters} />
        </div>
      ) : (
        <AdminTable
          columns={columns}
          rows={rows}
          onRowClick={(i) => router.push(`/admin/marketplace/job-positions/${paginated[i].id}`)}
          onCellClick={(e, i, j) => {
            if (j === 0 || j === 9) { e.stopPropagation(); }
          }}
        />
      )}

      {/* ── Footer ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-xs text-muted">
          {filtered.length === 0 ? "ไม่พบรายการ" : (
            <>
              แสดง <span className="font-semibold text-foreground">{rangeStart}–{rangeEnd}</span>{" "}
              จาก <span className="font-semibold text-foreground">{filtered.length}</span> ตำแหน่ง
              {filtered.length < jobs.length && (
                <> (กรองจากทั้งหมด <span className="font-semibold text-foreground">{jobs.length}</span>)</>
              )}
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

      {/* ── Delete modals ── */}
      {deleteTarget && (
        <DeleteModal
          job={deleteTarget}
          onConfirm={() => { deleteJob(deleteTarget.id); setDeleteTarget(null); }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
      {showBulkDel && (
        <BulkDeleteModal
          count={selectedIds.size}
          onConfirm={handleBulkDelete}
          onCancel={() => setShowBulkDel(false)}
        />
      )}
    </div>
  );
}
