"use client";

import { useState, useMemo, useEffect } from "react";
import { useDocuments } from "./contexts/DocumentContext";
import { DOCUMENT_CATEGORIES, FILE_TYPES } from "@/lib/data/documentsData";
import { formatDateTime } from "@/lib/utils/newsUtils";

// ── Helpers ────────────────────────────────────────────────────────────────

// alias ให้ชื่อตรงกับที่ใช้ใน codebase นี้
const toThaiDateTime = formatDateTime;

function nowISO() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const mins = [0, 15, 30, 45].reduce((prev, cur) => Math.abs(cur - d.getMinutes()) < Math.abs(prev - d.getMinutes()) ? cur : prev);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(mins)}`;
}

function todayDateStr() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function effectiveStatus(doc) {
  if (doc.status !== "published" || !doc.rawDate) return doc.status;
  const hasTime = doc.rawDate.includes("T");
  const now = nowISO();
  const docVal = hasTime ? doc.rawDate.slice(0, 16) : doc.rawDate;
  const nowVal = hasTime ? now : now.slice(0, 10);
  return docVal > nowVal ? "scheduled" : "published";
}

function genId(docs) {
  const max = docs.reduce((m, d) => {
    const n = parseInt(d.id.replace("D", "")) || 0;
    return n > m ? n : m;
  }, 0);
  return `D${String(max + 1).padStart(3, "0")}`;
}

// ── Constants ──────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  published: { label: "เผยแพร่",       color: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  draft:     { label: "แบบร่าง",       color: "bg-amber-100 text-amber-700 border-amber-200",       dot: "bg-amber-400" },
  scheduled: { label: "กำหนดเผยแพร่", color: "bg-blue-100 text-blue-700 border-blue-200",           dot: "bg-blue-400" },
};

const CAT_BADGE = {
  announcement: "bg-amber-100 text-amber-700",
  form:         "bg-blue-100 text-blue-700",
  guideline:    "bg-violet-100 text-violet-700",
  report:       "bg-emerald-100 text-emerald-700",
  letter:       "bg-orange-100 text-orange-700",
};

const FILE_BADGE = {
  PDF:  "bg-red-100 text-red-700",
  DOCX: "bg-sky-100 text-sky-700",
  XLSX: "bg-emerald-100 text-emerald-700",
};

const SORT_OPTIONS = [
  { value: "default", label: "⇅ ค่าเริ่มต้น" },
  { value: "newest",  label: "🕐 ใหม่สุดก่อน" },
  { value: "oldest",  label: "🕐 เก่าสุดก่อน" },
  { value: "title_az", label: "ก–ฮ (ชื่อเอกสาร)" },
];

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const inputCls  = "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-accent-soft placeholder:text-muted";
const selectCls = "rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-accent-soft";
const labelCls  = "text-xs font-medium text-foreground";
const chipBase  = "inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-accent-soft px-2.5 py-1 text-xs font-semibold text-primary hover:border-red-400 hover:bg-red-50 hover:text-red-500 transition-colors";

const FILTER_KEY = "doc-list-filters";
function loadFilters() {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(sessionStorage.getItem(FILTER_KEY)) ?? {}; }
  catch { return {}; }
}
function saveFilters(data) {
  try { sessionStorage.setItem(FILTER_KEY, JSON.stringify(data)); }
  catch { /* ignore */ }
}

// ── Icons ──────────────────────────────────────────────────────────────────

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);
const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);
const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

// ── Sub-components ─────────────────────────────────────────────────────────

function StatusBadge({ doc }) {
  const es = effectiveStatus(doc);
  const cfg = STATUS_CONFIG[es] ?? STATUS_CONFIG.draft;
  return (
    <div>
      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${cfg.color}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
        {cfg.label}
      </span>
      {es === "scheduled" && doc.rawDate && (
        <p className="mt-0.5 text-[10px] text-blue-600">📅 {toThaiDateTime(doc.rawDate)}</p>
      )}
    </div>
  );
}

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
  const btn = "flex h-8 min-w-[2rem] items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors";
  return (
    <div className="flex items-center gap-1">
      <button disabled={page === 1} onClick={() => onPage(page - 1)}
        className={`${btn} border border-border text-muted hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed`}>‹</button>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="px-1 text-sm text-muted select-none">…</span>
        ) : (
          <button key={p} onClick={() => onPage(p)}
            className={`${btn} border ${p === page ? "border-primary bg-primary text-white" : "border-border text-muted hover:border-primary hover:text-primary"}`}>
            {p}
          </button>
        )
      )}
      <button disabled={page === totalPages} onClick={() => onPage(page + 1)}
        className={`${btn} border border-border text-muted hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed`}>›</button>
    </div>
  );
}

// ── DeleteModal ────────────────────────────────────────────────────────────

function DeleteModal({ title, onConfirm, onCancel }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-2xl">
        <h3 className="text-base font-bold text-foreground">ยืนยันการลบ</h3>
        <p className="mt-2 text-sm text-muted">
          ต้องการลบเอกสาร <span className="font-semibold text-foreground">"{title}"</span> ใช่หรือไม่?
          การกระทำนี้ไม่สามารถย้อนกลับได้
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onCancel}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors">
            ยกเลิก
          </button>
          <button onClick={onConfirm}
            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 transition-colors">
            ลบเอกสาร
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Document Detail Panel ──────────────────────────────────────────────────

function DocDetail({ doc, onClose, onEdit, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const catLabel = DOCUMENT_CATEGORIES.find((c) => c.id === doc.category)?.label ?? doc.category;
  const es = effectiveStatus(doc);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const infoRow = (label, value) => (
    <div className="flex items-start gap-3">
      <span className="w-32 flex-shrink-0 text-xs text-muted pt-0.5">{label}</span>
      <span className="flex-1 text-sm text-foreground break-words">{value ?? "—"}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="flex w-full max-w-lg flex-col rounded-2xl border border-border bg-surface shadow-2xl max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-mono text-muted">{doc.id}</span>
            <StatusBadge doc={doc} />
            {doc.isNew && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">ใหม่</span>
            )}
          </div>
          <button onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-surface-muted hover:text-foreground transition-colors ml-2 flex-shrink-0">
            <XIcon />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          <div>
            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${CAT_BADGE[doc.category] ?? "bg-gray-100 text-gray-600"}`}>
              {catLabel}
            </span>
            <h2 className="mt-2 text-base font-bold text-foreground leading-snug">{doc.title}</h2>
            {doc.description && (
              <p className="mt-1.5 text-sm text-muted leading-relaxed">{doc.description}</p>
            )}
          </div>

          <div className="space-y-2.5 rounded-xl border border-border p-4">
            {infoRow("ประเภทไฟล์", (
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${FILE_BADGE[doc.fileType] ?? "bg-gray-100 text-gray-600"}`}>
                {doc.fileType}
              </span>
            ))}
            {infoRow("ขนาดไฟล์", doc.fileSize || "—")}
            {infoRow("วันที่เผยแพร่", doc.rawDate ? toThaiDateTime(doc.rawDate) : "—")}
            {infoRow("URL ไฟล์", doc.fileUrl || "—")}
          </div>

          {confirmDelete && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-3">
              <p className="text-sm font-semibold text-red-700">ยืนยันการลบเอกสาร</p>
              <p className="text-xs text-red-600">เอกสาร "{doc.title}" จะถูกลบถาวร ไม่สามารถกู้คืนได้</p>
              <div className="flex gap-2">
                <button onClick={() => { onDelete(doc.id); onClose(); }}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors">
                  ยืนยันลบ
                </button>
                <button onClick={() => setConfirmDelete(false)}
                  className="rounded-lg border border-border px-4 py-2 text-sm text-muted hover:text-foreground transition-colors">
                  ยกเลิก
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-5 py-4 flex-shrink-0">
          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)}
              className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
              ลบเอกสาร
            </button>
          ) : <div />}
          <div className="flex gap-2">
            <button onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors">
              ปิด
            </button>
            <button onClick={() => { onEdit(doc); onClose(); }} className="btn-primary">แก้ไข</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Document Modal (Add / Edit) ────────────────────────────────────────────

const EMPTY_FORM = () => ({
  title: "",
  category: "announcement",
  description: "",
  rawDate: `${todayDateStr()}T08:00`,
  fileType: "PDF",
  fileSize: "",
  fileUrl: "",
  isNew: false,
  status: "published",
});

function DocumentModal({ doc, onSave, onClose }) {
  const isEdit = !!doc?.id;
  const [form, setForm] = useState(() => doc ? { ...doc } : EMPTY_FORM());
  const [uploadedFile, setUploadedFile] = useState(null);
  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const isScheduled = effectiveStatus({ ...form }) === "scheduled";
  const displayDate = toThaiDateTime(form.rawDate);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop().toUpperCase();
    const size = formatFileSize(file.size);
    setUploadedFile({ name: file.name, size, ext });
    set("fileSize", size);
    if (["PDF", "DOCX", "XLSX"].includes(ext)) set("fileType", ext);
  };

  const handleSave = () => {
    if (!form.title.trim() || !form.rawDate) return;
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-xl rounded-2xl border border-border bg-surface shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4 flex-shrink-0">
          <div>
            <p className="text-sm font-semibold text-foreground">{isEdit ? "แก้ไขเอกสาร" : "เพิ่มเอกสารใหม่"}</p>
            <p className="text-xs text-muted">{isEdit ? `รหัส ${doc.id}` : "กรอกข้อมูลเอกสารที่ต้องการเพิ่ม"}</p>
          </div>
          <button onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-surface-muted hover:text-foreground transition-colors">
            <XIcon />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">

          {/* Title */}
          <div>
            <label className={`mb-1 block ${labelCls}`}>ชื่อเอกสาร <span className="text-red-500">*</span></label>
            <input value={form.title} onChange={(e) => set("title", e.target.value)}
              className={inputCls} placeholder="ชื่อเอกสาร" />
          </div>

          {/* Category + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`mb-1 block ${labelCls}`}>หมวดหมู่</label>
              <select value={form.category} onChange={(e) => set("category", e.target.value)} className={`${selectCls} w-full`}>
                {DOCUMENT_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className={`mb-1 block ${labelCls}`}>สถานะ</label>
              <select value={form.status} onChange={(e) => set("status", e.target.value)} className={`${selectCls} w-full`}>
                <option value="published">เผยแพร่</option>
                <option value="draft">แบบร่าง</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={`mb-1 block ${labelCls}`}>คำอธิบาย</label>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)}
              rows={3} className={`${inputCls} resize-none`} placeholder="อธิบายเนื้อหาของเอกสาร..." />
          </div>

          {/* Date + Time */}
          <div>
            <label className={`mb-1 block ${labelCls}`}>วันที่และเวลาเผยแพร่ <span className="text-red-500">*</span></label>
            <div className="flex gap-2">
              <input
                type="date"
                value={form.rawDate?.split("T")[0] ?? ""}
                onChange={(e) => {
                  const time = form.rawDate?.split("T")[1] ?? "08:00";
                  set("rawDate", e.target.value ? `${e.target.value}T${time}` : "");
                }}
                className={`${inputCls} flex-1`}
              />
              <input
                type="number" min="0" max="23"
                value={parseInt(form.rawDate?.split("T")[1]?.slice(0, 2) ?? "8", 10)}
                onChange={(e) => {
                  let h = Math.max(0, Math.min(23, parseInt(e.target.value, 10) || 0));
                  const date = form.rawDate?.split("T")[0] ?? todayDateStr();
                  const mins = form.rawDate?.split("T")[1]?.slice(3, 5) ?? "00";
                  set("rawDate", `${date}T${String(h).padStart(2, "0")}:${mins}`);
                }}
                className="w-14 shrink-0 rounded-lg border border-border bg-surface px-2 py-2 text-sm text-center outline-none transition focus:border-primary focus:ring-2 focus:ring-accent-soft [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <span className="flex items-center text-sm font-semibold text-muted shrink-0">:</span>
              <input
                type="number" min="0" max="59"
                value={parseInt(form.rawDate?.split("T")[1]?.slice(3, 5) ?? "0", 10)}
                onChange={(e) => {
                  let m = Math.max(0, Math.min(59, parseInt(e.target.value, 10) || 0));
                  const date = form.rawDate?.split("T")[0] ?? todayDateStr();
                  const hrs = form.rawDate?.split("T")[1]?.slice(0, 2) ?? "08";
                  set("rawDate", `${date}T${hrs}:${String(m).padStart(2, "0")}`);
                }}
                className="w-14 shrink-0 rounded-lg border border-border bg-surface px-2 py-2 text-sm text-center outline-none transition focus:border-primary focus:ring-2 focus:ring-accent-soft [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <span className="flex items-center text-xs text-muted shrink-0">น.</span>
              <button type="button" onClick={() => set("rawDate", nowISO())}
                className="shrink-0 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted hover:border-primary hover:text-primary transition-colors whitespace-nowrap">
                ปัจจุบัน
              </button>
            </div>
            {form.rawDate && (
              <div className="mt-1.5 flex items-center gap-2">
                <p className="text-xs text-muted">แสดงผล: <span className="font-medium text-foreground">{displayDate}</span></p>
                {isScheduled && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                    📅 กำหนดเผยแพร่ล่วงหน้า
                  </span>
                )}
              </div>
            )}
          </div>

          {/* File upload */}
          <div>
            <label className={`mb-1 block ${labelCls}`}>ไฟล์เอกสาร</label>
            <input type="file" accept=".pdf,.docx,.xlsx" onChange={handleFileChange}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-muted outline-none transition focus:border-primary file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-primary hover:file:bg-primary/20" />
            {uploadedFile ? (
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-border bg-surface-muted px-3 py-2">
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${FILE_BADGE[uploadedFile.ext] ?? "bg-gray-100 text-gray-600"}`}>{uploadedFile.ext}</span>
                <span className="flex-1 truncate text-xs text-foreground">{uploadedFile.name}</span>
                <span className="shrink-0 text-xs text-muted">{uploadedFile.size}</span>
              </div>
            ) : form.fileSize ? (
              <p className="mt-1.5 text-xs text-muted">ขนาดไฟล์ปัจจุบัน: <span className="font-medium text-foreground">{form.fileSize}</span></p>
            ) : null}
          </div>

          {/* File type (manual override) */}
          {!uploadedFile && (
            <div>
              <label className={`mb-1 block ${labelCls}`}>ประเภทไฟล์</label>
              <select value={form.fileType} onChange={(e) => set("fileType", e.target.value)} className={`${selectCls} w-full`}>
                {FILE_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
          )}

          {/* isNew toggle */}
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-4 py-3 hover:bg-surface-muted transition-colors">
            <input type="checkbox" checked={form.isNew} onChange={(e) => set("isNew", e.target.checked)}
              className="h-4 w-4 accent-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">แสดง badge "ใหม่"</p>
              <p className="text-xs text-muted">แสดงป้ายกำกับ "ใหม่" บนเอกสารนี้ในหน้าเว็บ</p>
            </div>
            {form.isNew && <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">ใหม่</span>}
          </label>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4 flex-shrink-0">
          <button onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors">
            ยกเลิก
          </button>
          <button onClick={handleSave} disabled={!form.title.trim() || !form.rawDate}
            className="btn-primary disabled:opacity-40">
            {isEdit ? "บันทึกการแก้ไข" : "เพิ่มเอกสาร"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function DocumentListClient() {
  const { documents, ready, addDocument, updateDocument, deleteDocument } = useDocuments();

  const [searchInput,    setSearchInput]    = useState("");
  const [keywords,       setKeywords]       = useState([]);
  const [filterCat,      setFilterCat]      = useState("");
  const [filterStatus,   setFilterStatus]   = useState("");
  const [filterFileType, setFilterFileType] = useState("");
  const [sortBy,         setSortBy]         = useState("default");
  const [pageSize,       setPageSize]       = useState(10);
  const [page,           setPage]           = useState(1);
  const [hydrated,       setHydrated]       = useState(false);

  const [modal,     setModal]     = useState(null);
  const [detail,    setDetail]    = useState(null);
  const [delTarget, setDelTarget] = useState(null);

  const addKeyword = (kw) => {
    const trimmed = kw.trim();
    if (!trimmed) return;
    setKeywords((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
    setSearchInput("");
    setPage(1);
  };
  const removeKeyword = (kw) => { setKeywords((prev) => prev.filter((k) => k !== kw)); setPage(1); };

  const activeTerms = useMemo(
    () => [...keywords, searchInput.trim()].filter(Boolean),
    [keywords, searchInput],
  );

  // Restore filters
  useEffect(() => {
    const f = loadFilters();
    if (f.searchInput    !== undefined) setSearchInput(f.searchInput);
    if (f.filterCat      !== undefined) setFilterCat(f.filterCat);
    if (f.filterStatus   !== undefined) setFilterStatus(f.filterStatus);
    if (f.filterFileType !== undefined) setFilterFileType(f.filterFileType);
    if (f.sortBy         !== undefined) setSortBy(f.sortBy);
    if (f.pageSize       !== undefined) setPageSize(f.pageSize);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveFilters({ searchInput, filterCat, filterStatus, filterFileType, sortBy, pageSize });
    setPage(1);
  }, [searchInput, filterCat, filterStatus, filterFileType, sortBy, pageSize, hydrated]);

  const matchDoc = (d, kw) => {
    const q = kw.toLowerCase();
    return d.title.toLowerCase().includes(q) || (d.description ?? "").toLowerCase().includes(q);
  };

  // Filtered + sorted
  const filtered = useMemo(() => {
    let list = documents.filter((d) => {
      if (filterCat      && d.category !== filterCat)      return false;
      if (filterFileType && d.fileType  !== filterFileType) return false;
      if (filterStatus   && effectiveStatus(d) !== filterStatus) return false;
      if (keywords.length > 0 && !keywords.every((kw) => matchDoc(d, kw))) return false;
      if (searchInput.trim() && !matchDoc(d, searchInput.trim())) return false;
      return true;
    });
    switch (sortBy) {
      case "newest":   list = [...list].sort((a, b) => (b.rawDate ?? "").localeCompare(a.rawDate ?? "")); break;
      case "oldest":   list = [...list].sort((a, b) => (a.rawDate ?? "").localeCompare(b.rawDate ?? "")); break;
      case "title_az": list = [...list].sort((a, b) => a.title.localeCompare(b.title, "th")); break;
      default: break;
    }
    return list;
  }, [documents, searchInput, keywords, filterCat, filterFileType, filterStatus, sortBy]);

  // Status counts (before status filter, but after search/keyword/cat/fileType)
  const statusCounts = useMemo(() => {
    const base = documents.filter((d) => {
      if (filterCat      && d.category !== filterCat)      return false;
      if (filterFileType && d.fileType  !== filterFileType) return false;
      if (keywords.length > 0 && !keywords.every((kw) => matchDoc(d, kw))) return false;
      if (searchInput.trim() && !matchDoc(d, searchInput.trim())) return false;
      return true;
    });
    return {
      all:       base.length,
      published: base.filter((d) => effectiveStatus(d) === "published").length,
      scheduled: base.filter((d) => effectiveStatus(d) === "scheduled").length,
      draft:     base.filter((d) => d.status === "draft").length,
    };
  }, [documents, searchInput, keywords, filterCat, filterFileType]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage   = Math.min(page, totalPages);
  const pageSlice  = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const hasFilters = !!(filterCat || filterFileType || filterStatus || sortBy !== "default" || keywords.length > 0 || searchInput.trim());
  const clearAll = () => { setFilterCat(""); setFilterFileType(""); setFilterStatus(""); setSortBy("default"); setKeywords([]); setSearchInput(""); setPage(1); };

  const handleSave = (form) => {
    if (modal?.mode === "edit") {
      updateDocument(modal.doc.id, form);
    } else {
      addDocument({ ...form, id: genId(documents) });
    }
    setModal(null);
  };

  if (!ready) return (
    <div className="flex items-center justify-center py-24 text-sm text-muted">
      <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
      กำลังโหลด...
    </div>
  );

  const sortLabel   = SORT_OPTIONS.find((s) => s.value === sortBy)?.label;
  const statusLabel = filterStatus ? (STATUS_CONFIG[filterStatus]?.label ?? filterStatus) : null;
  const catLabel    = filterCat ? DOCUMENT_CATEGORIES.find((c) => c.id === filterCat)?.label : null;

  return (
    <div className="space-y-4 p-6">

      {/* ── Status pills ── */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: "",          label: "ทั้งหมด",        count: statusCounts.all,       pill: "bg-surface-muted border-border text-foreground" },
          { key: "published", label: "เผยแพร่",        count: statusCounts.published, pill: "bg-emerald-50 border-emerald-200 text-emerald-700" },
          { key: "scheduled", label: "กำหนดเผยแพร่",  count: statusCounts.scheduled, pill: "bg-blue-50 border-blue-200 text-blue-700" },
          { key: "draft",     label: "แบบร่าง",        count: statusCounts.draft,     pill: "bg-amber-50 border-amber-200 text-amber-700" },
        ].map(({ key, label, count, pill }) => (
          <button key={key}
            onClick={() => setFilterStatus(filterStatus === key ? "" : key)}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${pill} ${filterStatus === key ? "ring-2 ring-primary/30 ring-offset-1" : "opacity-80 hover:opacity-100"}`}>
            {label}
            <span className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${filterStatus === key ? "bg-primary/10" : "bg-border"}`}>{count}</span>
          </button>
        ))}
      </div>

      {/* ── Search row ── */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted pointer-events-none" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
          <input type="text" value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addKeyword(searchInput); } }}
            placeholder="ค้นหาชื่อเอกสาร คำอธิบาย... (Enter เพื่อล็อก)"
            className={`${inputCls} pl-9`} />
        </div>
        <button onClick={() => addKeyword(searchInput)} disabled={!searchInput.trim()}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
          ค้นหา
        </button>
        <button onClick={() => setModal({ mode: "add" })} className="btn-primary whitespace-nowrap">+ เพิ่มเอกสาร</button>
      </div>

      {/* ── Filter row ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-col gap-0.5">
          <label className={labelCls}>หมวดหมู่</label>
          <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className={selectCls}>
            <option value="">หมวดหมู่ทั้งหมด</option>
            {DOCUMENT_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-0.5">
          <label className={labelCls}>ชนิดไฟล์</label>
          <select value={filterFileType} onChange={(e) => setFilterFileType(e.target.value)} className={selectCls}>
            <option value="">ทุกชนิด</option>
            {FILE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-0.5">
          <label className={labelCls}>เรียงลำดับ</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={selectCls}>
            {SORT_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {/* ── Active filter chips ── */}
      {hasFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted">กรอง:</span>
          {filterCat && (
            <button className={chipBase} onClick={() => setFilterCat("")}>
              หมวด: {catLabel} <XIcon />
            </button>
          )}
          {filterFileType && (
            <button className={chipBase} onClick={() => setFilterFileType("")}>
              ชนิดไฟล์: {filterFileType} <XIcon />
            </button>
          )}
          {filterStatus && (
            <button className={chipBase} onClick={() => setFilterStatus("")}>
              สถานะ: {statusLabel} <XIcon />
            </button>
          )}
          {sortBy !== "default" && (
            <button className={chipBase} onClick={() => setSortBy("default")}>
              เรียง: {sortLabel} <XIcon />
            </button>
          )}
          {keywords.map((kw) => (
            <button key={kw} className={chipBase} onClick={() => removeKeyword(kw)}>
              🔍 &ldquo;{kw}&rdquo; <XIcon />
            </button>
          ))}
          <button onClick={clearAll} className="text-xs text-muted underline hover:text-foreground transition-colors">ล้างทั้งหมด</button>
        </div>
      )}

      {/* ── Table ── */}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-muted">
                {["ชื่อเอกสาร / คำอธิบาย", "หมวดหมู่", "ไฟล์", "วันที่เผยแพร่", "สถานะ", "จัดการ"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pageSlice.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-sm text-muted">ไม่พบเอกสารที่ตรงกับเงื่อนไข</td>
                </tr>
              ) : pageSlice.map((doc) => {
                const catLabel = DOCUMENT_CATEGORIES.find((c) => c.id === doc.category)?.label ?? doc.category;
                return (
                  <tr key={doc.id}
                    className="hover:bg-surface-muted/60 transition-colors cursor-pointer"
                    onClick={() => setDetail(doc)}>
                    <td className="px-4 py-3 max-w-xs">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        {doc.isNew && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">ใหม่</span>}
                        <p className="font-semibold text-foreground line-clamp-1 text-sm leading-snug">{doc.title}</p>
                      </div>
                      {doc.description && (
                        <p className="text-xs text-muted line-clamp-2 leading-relaxed">{doc.description}</p>
                      )}
                      <p className="mt-1 font-mono text-[10px] text-muted/70">{doc.id}</p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${CAT_BADGE[doc.category] ?? "bg-gray-100 text-gray-600"}`}>
                        {catLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${FILE_BADGE[doc.fileType] ?? "bg-gray-100 text-gray-600"}`}>
                        {doc.fileType}
                      </span>
                      {doc.fileSize && <span className="ml-1.5 text-xs text-muted">{doc.fileSize}</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">
                      {doc.rawDate ? toThaiDateTime(doc.rawDate) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge doc={doc} />
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <button title="ดูรายละเอียด" onClick={() => setDetail(doc)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted hover:border-primary hover:text-primary transition-colors">
                          <EyeIcon />
                        </button>
                        <button title="แก้ไข" onClick={() => setModal({ mode: "edit", doc })}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted hover:border-amber-400 hover:text-amber-500 transition-colors">
                          <EditIcon />
                        </button>
                        <button title="ลบ" onClick={() => setDelTarget(doc)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted hover:border-red-400 hover:text-red-500 transition-colors">
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Pagination footer ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3 bg-surface-muted/40">
          <div className="flex items-center gap-2 text-xs text-muted">
            <span>แสดง</span>
            <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}
              className="rounded border border-border bg-surface px-1.5 py-1 text-xs outline-none">
              {PAGE_SIZE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            <span>รายการ</span>
            {filtered.length > 0 && (
              <span>({(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filtered.length)} จาก {filtered.length})</span>
            )}
          </div>
          <Pagination page={safePage} totalPages={totalPages} onPage={setPage} />
        </div>
      </div>

      {/* ── Modals ── */}
      {modal && (
        <DocumentModal doc={modal.mode === "edit" ? modal.doc : null} onSave={handleSave} onClose={() => setModal(null)} />
      )}
      {detail && (
        <DocDetail
          doc={detail}
          onClose={() => setDetail(null)}
          onEdit={(d) => { setDetail(null); setModal({ mode: "edit", doc: d }); }}
          onDelete={(id) => { deleteDocument(id); setDetail(null); }}
        />
      )}
      {delTarget && (
        <DeleteModal
          title={delTarget.title}
          onConfirm={() => { deleteDocument(delTarget.id); setDelTarget(null); }}
          onCancel={() => setDelTarget(null)}
        />
      )}
    </div>
  );
}
