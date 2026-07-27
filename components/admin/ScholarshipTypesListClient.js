"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useScholarshipTypes } from "./contexts/ScholarshipTypesContext";

// ── Constants ──────────────────────────────────────────────────
const BADGE_OPTIONS = [
  { label: "Sky (ฟ้า)",      value: "bg-sky-100 text-sky-700 border-sky-200",         preview: "bg-sky-100 text-sky-700" },
  { label: "Teal (เขียวน้ำ)", value: "bg-teal-100 text-teal-700 border-teal-200",     preview: "bg-teal-100 text-teal-700" },
  { label: "Emerald (เขียว)", value: "bg-emerald-100 text-emerald-700 border-emerald-200", preview: "bg-emerald-100 text-emerald-700" },
  { label: "Violet (ม่วง)",  value: "bg-violet-100 text-violet-700 border-violet-200", preview: "bg-violet-100 text-violet-700" },
  { label: "Blue (น้ำเงิน)", value: "bg-blue-100 text-blue-700 border-blue-200",      preview: "bg-blue-100 text-blue-700" },
  { label: "Amber (เหลือง)",  value: "bg-amber-100 text-amber-700 border-amber-200",   preview: "bg-amber-100 text-amber-700" },
  { label: "Rose (ชมพู)",    value: "bg-rose-100 text-rose-700 border-rose-200",       preview: "bg-rose-100 text-rose-700" },
];

const HIGHLIGHT_OPTIONS = [
  { label: "Sky",     value: "border-sky-200" },
  { label: "Teal",    value: "border-teal-200" },
  { label: "Emerald", value: "border-emerald-300" },
  { label: "Violet",  value: "border-violet-200" },
  { label: "Blue",    value: "border-blue-200" },
  { label: "Amber",   value: "border-amber-200" },
  { label: "Rose",    value: "border-rose-200" },
];

const STATUS_CONFIG = {
  active:   { label: "แสดงอยู่",    color: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  inactive: { label: "ซ่อนอยู่",   color: "bg-amber-100 text-amber-700 border-amber-200",       dot: "bg-amber-400" },
  draft:    { label: "แบบร่าง",    color: "bg-gray-100 text-gray-600 border-gray-200",          dot: "bg-gray-400" },
};

const SORT_OPTIONS = [
  { value: "default",  label: "⇅ ลำดับที่กำหนด" },
  { value: "name_az",  label: "ก–ฮ (ชื่อทุน)" },
  { value: "count_hi", label: "💰 จำนวนทุนมากสุด" },
  { value: "count_lo", label: "💰 จำนวนทุนน้อยสุด" },
];

const PAGE_SIZE_OPTIONS = [10, 20, 50];

// ── Styles ─────────────────────────────────────────────────────
const inputCls  = "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-accent-soft placeholder:text-muted";
const selectCls = "rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-accent-soft";
const labelCls  = "text-xs font-medium text-foreground";
const chipBase  = "inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-accent-soft px-2.5 py-1 text-xs font-semibold text-primary hover:border-red-400 hover:bg-red-50 hover:text-red-500 transition-colors";

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);

// ── Filter persistence ─────────────────────────────────────────
const FILTER_KEY = "scholarship-types-filters";
function loadFilters() {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(sessionStorage.getItem(FILTER_KEY)) ?? {}; }
  catch { return {}; }
}
function saveFilters(data) {
  try { sessionStorage.setItem(FILTER_KEY, JSON.stringify(data)); }
  catch { /* ignore */ }
}

// ── Helpers ────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${cfg.color}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function HighlightText({ text, terms }) {
  if (!text || !terms?.length) return <>{text}</>;
  const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const parts = text.split(new RegExp(`(${escaped.join("|")})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="rounded bg-amber-100 text-amber-800 px-0.5 not-italic">{part}</mark>
        ) : <span key={i}>{part}</span>
      )}
    </>
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
      <button disabled={page === 1} onClick={() => onPage(page - 1)} className={`${btn} border border-border text-muted hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed`}>‹</button>
      {pages.map((p, i) =>
        p === "…" ? <span key={`e${i}`} className="px-1 text-sm text-muted select-none">…</span> : (
          <button key={p} onClick={() => onPage(p)} className={`${btn} border ${p === page ? "border-primary bg-primary text-white" : "border-border text-muted hover:border-primary hover:text-primary"}`}>{p}</button>
        )
      )}
      <button disabled={page === totalPages} onClick={() => onPage(page + 1)} className={`${btn} border border-border text-muted hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed`}>›</button>
    </div>
  );
}

// ── List input (criteria / benefits) ──────────────────────────
function ListInput({ items, onChange, placeholder }) {
  const [input, setInput] = useState("");
  const add = () => {
    const t = input.trim();
    if (t && !items.includes(t)) onChange([...items, t]);
    setInput("");
  };
  return (
    <div>
      <div className="space-y-1 mb-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 rounded-lg bg-surface-muted px-3 py-1.5">
            <span className="flex-1 text-xs text-foreground">{item}</span>
            <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} className="text-muted hover:text-red-500 transition-colors"><XIcon /></button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder} className={inputCls} />
        <button type="button" onClick={add}
          className="rounded-lg border border-border px-3 py-2 text-sm text-muted hover:text-foreground transition-colors whitespace-nowrap">+ เพิ่ม</button>
      </div>
    </div>
  );
}

// ── Empty form ─────────────────────────────────────────────────
function emptyForm() {
  return {
    name: "", slug: "", icon: "🎓",
    badgeColor: BADGE_OPTIONS[0].value,
    highlightColor: HIGHLIGHT_OPTIONS[0].value,
    coverage: "", valuePerSem: "", valueTotal: "",
    count: "", note: "",
    criteria: [], benefits: [],
    featured: false, status: "draft", order: 99,
  };
}

function nextId(list) {
  const nums = list.map((s) => parseInt(s.id.replace("SCH", ""), 10)).filter(Boolean);
  return `SCH${String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3, "0")}`;
}

// ── ScholarshipModal ───────────────────────────────────────────
function ScholarshipModal({ item, onClose, onSave }) {
  const isEdit = !!item;
  const [form, setForm] = useState(isEdit ? { ...item, count: String(item.count ?? ""), order: String(item.order ?? "") } : emptyForm());
  const [errors, setErrors] = useState({});
  const nameRef = useRef(null);

  useEffect(() => {
    nameRef.current?.focus();
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const set = (field, val) => {
    setForm((f) => ({ ...f, [field]: val }));
    setErrors((e) => ({ ...e, [field]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "กรุณากรอกชื่อประเภททุน";
    if (!form.coverage.trim()) e.coverage = "กรุณากรอกความคุ้มครอง";
    if (!form.valuePerSem.trim()) e.valuePerSem = "กรุณากรอกมูลค่าต่อภาค";
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onSave({ ...form, count: Number(form.count) || 0, order: Number(form.order) || 99 });
    onClose();
  };

  const f = (label, key, opts = {}) => (
    <div>
      <label className={`mb-1 block ${labelCls}`}>{label}{opts.required && <span className="ml-0.5 text-red-500">*</span>}</label>
      <input type={opts.type ?? "text"} value={form[key]} onChange={(e) => set(key, e.target.value)} placeholder={opts.placeholder} className={inputCls} />
      {errors[key] && <p className="mt-1 text-xs text-red-500">{errors[key]}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="flex w-full max-w-2xl flex-col rounded-2xl border border-border bg-surface shadow-2xl max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-border px-5 py-4 flex-shrink-0">
          <div>
            <p className="text-sm font-semibold text-foreground">{isEdit ? "แก้ไขประเภททุน" : "เพิ่มประเภททุนใหม่"}</p>
            <p className="text-xs text-muted">{isEdit ? `รหัส ${item.id}` : "ข้อมูลนี้จะแสดงในหน้า Scholarship"}</p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-surface-muted hover:text-foreground transition-colors"><XIcon /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          <div ref={nameRef} tabIndex={-1} />

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">{f("ชื่อประเภททุน", "name", { required: true, placeholder: "เช่น ทุน 2 ปี" })}</div>
            <div>
              <label className={`mb-1 block ${labelCls}`}>ไอคอน (Emoji)</label>
              <input value={form.icon} onChange={(e) => set("icon", e.target.value)} placeholder="🎓" className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`mb-1 block ${labelCls}`}>สีสัญลักษณ์</label>
              <select value={form.badgeColor} onChange={(e) => set("badgeColor", e.target.value)} className={`${selectCls} w-full`}>
                {BADGE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              {/* Preview */}
              <div className="mt-1.5">
                <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${form.badgeColor}`}>
                  {form.icon} {form.name || "ตัวอย่าง"}
                </span>
              </div>
            </div>
            <div>
              <label className={`mb-1 block ${labelCls}`}>สีขอบ (Highlight)</label>
              <select value={form.highlightColor} onChange={(e) => set("highlightColor", e.target.value)} className={`${selectCls} w-full`}>
                {HIGHLIGHT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`mb-1 block ${labelCls}`}>สถานะ</label>
              <select value={form.status} onChange={(e) => set("status", e.target.value)} className={`${selectCls} w-full`}>
                <option value="active">แสดงอยู่ (Active)</option>
                <option value="inactive">ซ่อนอยู่ (Inactive)</option>
                <option value="draft">แบบร่าง (Draft)</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {f("จำนวนทุน", "count", { type: "number", placeholder: "100" })}
              {f("ลำดับแสดงผล", "order", { type: "number", placeholder: "1" })}
            </div>
          </div>

          {f("ความคุ้มครอง (ช่วงเวลา)", "coverage", { required: true, placeholder: "เช่น 2 ปีสุดท้าย (ปี 4–5)" })}

          <div className="grid grid-cols-2 gap-4">
            {f("มูลค่าต่อภาคการศึกษา", "valuePerSem", { required: true, placeholder: "เช่น ภาคการศึกษาละ 25,000 บาท" })}
            {f("มูลค่ารวมทั้งหมด", "valueTotal", { placeholder: "เช่น รวมสูงสุด 100,000 บาท" })}
          </div>

          {f("หมายเหตุ (Note)", "note", { placeholder: "เช่น บริษัทพาร์ทเนอร์ 25+ แห่ง" })}

          <div>
            <label className={`mb-1.5 block ${labelCls}`}>คุณสมบัติผู้สมัคร<span className="ml-0.5 text-red-500">*</span></label>
            <ListInput items={form.criteria} onChange={(v) => set("criteria", v)} placeholder="เพิ่มคุณสมบัติ เช่น เกรดเฉลี่ย 3.00 ขึ้นไป" />
          </div>

          <div>
            <label className={`mb-1.5 block ${labelCls}`}>สิทธิประโยชน์</label>
            <ListInput items={form.benefits} onChange={(v) => set("benefits", v)} placeholder="เพิ่มสิทธิประโยชน์ เช่น ค่าเล่าเรียน" />
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-4 py-3 hover:bg-surface-muted transition-colors">
            <input type="checkbox" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} className="h-4 w-4 accent-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">ทุนแนะนำ (Featured)</p>
              <p className="text-xs text-muted">แสดงป้าย "แนะนำ" บนการ์ดทุนในหน้าเว็บไซต์</p>
            </div>
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4 flex-shrink-0">
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors">ยกเลิก</button>
          <button onClick={handleSubmit} className="btn-primary">{isEdit ? "บันทึกการแก้ไข" : "เพิ่มประเภททุน"}</button>
        </div>
      </div>
    </div>
  );
}

// ── ScholarshipDetail ──────────────────────────────────────────
function ScholarshipDetail({ item, onClose, onEdit, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const row = (label, value) => (
    <div className="flex items-start gap-3">
      <span className="w-36 flex-shrink-0 text-xs text-muted pt-0.5">{label}</span>
      <span className="flex-1 text-sm text-foreground break-words">{value ?? "—"}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="flex w-full max-w-2xl flex-col rounded-2xl border border-border bg-surface shadow-2xl max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-border px-5 py-4 flex-shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-muted">{item.id}</span>
            <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${item.badgeColor}`}>{item.icon} {item.name}</span>
            <StatusBadge status={item.status} />
            {item.featured && <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-semibold text-amber-700">★ แนะนำ</span>}
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-surface-muted hover:text-foreground transition-colors ml-2 flex-shrink-0"><XIcon /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {/* Preview card */}
          <div className={`rounded-xl border-t-4 ${item.highlightColor} border border-border p-4`}>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-muted text-2xl">{item.icon}</div>
              <div>
                <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${item.badgeColor}`}>{item.name}</span>
                <p className="mt-0.5 text-xs text-muted">ครอบคลุม: {item.coverage}</p>
              </div>
            </div>
            <div className="mt-3 rounded-xl bg-surface-muted p-3">
              <p className="text-sm font-bold text-foreground">{item.valuePerSem}</p>
              <p className="text-xs text-muted">{item.valueTotal}</p>
              {item.note && <p className="mt-1 text-xs text-primary font-medium">{item.note}</p>}
            </div>
          </div>

          <div className="space-y-2.5 rounded-xl border border-border p-4">
            {row("จำนวนทุน", item.count ? `${item.count} ทุน` : "—")}
            {row("ลำดับแสดงผล", item.order ?? "—")}
            {row("สร้างเมื่อ", item.createdAt)}
            {row("แก้ไขล่าสุด", item.updatedAt)}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">คุณสมบัติ ({item.criteria?.length ?? 0})</p>
              <ul className="space-y-1.5">
                {item.criteria?.map((c, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-foreground">
                    <span className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />{c}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">สิทธิประโยชน์ ({item.benefits?.length ?? 0})</p>
              <ul className="space-y-1.5">
                {item.benefits?.map((b, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-foreground">
                    <span className="mt-0.5 text-emerald-500 font-bold">✓</span>{b}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {confirmDelete && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-3">
              <p className="text-sm font-semibold text-red-700">ยืนยันการลบประเภททุน</p>
              <p className="text-xs text-red-600">"{item.name}" จะถูกลบถาวร และหายจากหน้าเว็บไซต์</p>
              <div className="flex gap-2">
                <button onClick={() => { onDelete(item.id); onClose(); }} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors">ยืนยันลบ</button>
                <button onClick={() => setConfirmDelete(false)} className="rounded-lg border border-border px-4 py-2 text-sm text-muted hover:text-foreground transition-colors">ยกเลิก</button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border px-5 py-4 flex-shrink-0">
          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">ลบประเภททุน</button>
          ) : <div />}
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors">ปิด</button>
            <button onClick={() => { onEdit(item); onClose(); }} className="btn-primary">แก้ไข</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────
export default function ScholarshipTypesListClient() {
  const { scholarshipTypes, ready, addScholarshipType, updateScholarshipType, deleteScholarshipType } = useScholarshipTypes();

  const [searchInput, setSearchInput]   = useState("");
  const [keywords,    setKeywords]      = useState([]);
  const [filterStatus, setFilterStatus] = useState("");
  const [sortBy,      setSortBy]        = useState("default");
  const [pageSize,    setPageSize]      = useState(10);
  const [page,        setPage]          = useState(1);
  const [hydrated,    setHydrated]      = useState(false);
  const [modal,       setModal]         = useState(null);
  const [detail,      setDetail]        = useState(null);

  useEffect(() => {
    const f = loadFilters();
    if (f.searchInput  !== undefined) setSearchInput(f.searchInput);
    if (f.keywords     !== undefined) setKeywords(f.keywords);
    if (f.filterStatus !== undefined) setFilterStatus(f.filterStatus);
    if (f.sortBy       !== undefined) setSortBy(f.sortBy);
    if (f.pageSize     !== undefined) setPageSize(f.pageSize);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveFilters({ searchInput, keywords, filterStatus, sortBy, pageSize });
    setPage(1);
  }, [searchInput, keywords, filterStatus, sortBy, pageSize, hydrated]);

  const addKeyword = () => {
    const t = searchInput.trim();
    if (t && !keywords.includes(t)) setKeywords([...keywords, t]);
    setSearchInput("");
  };
  const removeKeyword = (k) => setKeywords(keywords.filter((x) => x !== k));
  const activeTerms = useMemo(() => [...keywords, searchInput.trim()].filter(Boolean), [keywords, searchInput]);

  const matchField = (s, q) => {
    const ql = q.toLowerCase();
    return [s.id, s.name, s.coverage, s.valuePerSem, s.valueTotal, s.note, ...(s.criteria ?? []), ...(s.benefits ?? [])].some((v) => String(v ?? "").toLowerCase().includes(ql));
  };

  const filtered = useMemo(() => {
    let list = [...scholarshipTypes];
    keywords.forEach((k) => { list = list.filter((s) => matchField(s, k)); });
    if (searchInput.trim()) list = list.filter((s) => matchField(s, searchInput.trim()));
    if (filterStatus) list = list.filter((s) => s.status === filterStatus);
    switch (sortBy) {
      case "name_az":  list.sort((a, b) => a.name.localeCompare(b.name, "th")); break;
      case "count_hi": list.sort((a, b) => (b.count ?? 0) - (a.count ?? 0)); break;
      case "count_lo": list.sort((a, b) => (a.count ?? 0) - (b.count ?? 0)); break;
      default:         list.sort((a, b) => (a.order ?? 99) - (b.order ?? 99)); break;
    }
    return list;
  }, [scholarshipTypes, keywords, searchInput, filterStatus, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage   = Math.min(page, totalPages);
  const pageSlice  = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const statusCounts = useMemo(() => {
    const base = scholarshipTypes.filter((s) => {
      if (keywords.length && !keywords.every((k) => matchField(s, k))) return false;
      if (searchInput.trim() && !matchField(s, searchInput.trim())) return false;
      return true;
    });
    return {
      all:      base.length,
      active:   base.filter((s) => s.status === "active").length,
      inactive: base.filter((s) => s.status === "inactive").length,
      draft:    base.filter((s) => s.status === "draft").length,
    };
  }, [scholarshipTypes, keywords, searchInput]);

  const totalCount = scholarshipTypes.reduce((sum, s) => sum + (s.count ?? 0), 0);

  const hasFilters = filterStatus || sortBy !== "default" || keywords.length > 0;
  const clearAll = () => { setKeywords([]); setSearchInput(""); setFilterStatus(""); setSortBy("default"); };

  const handleSave = (form) => {
    if (modal?.mode === "edit") {
      updateScholarshipType(modal.item.id, { ...form, updatedAt: new Date().toISOString().slice(0, 10) });
    } else {
      const now = new Date().toISOString().slice(0, 10);
      addScholarshipType({ ...form, id: nextId(scholarshipTypes), createdAt: now, updatedAt: now });
    }
  };

  if (!ready) {
    return (
      <div className="flex items-center justify-center py-24 text-sm text-muted">
        <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        กำลังโหลด...
      </div>
    );
  }

  const sortLabel   = SORT_OPTIONS.find((s) => s.value === sortBy)?.label;
  const statusLabel = filterStatus ? STATUS_CONFIG[filterStatus]?.label : null;

  return (
    <div className="space-y-4 p-6">
      {/* ── Summary banner ── */}
      <div className="flex flex-wrap gap-3">
        <div className="rounded-xl border border-border bg-surface px-4 py-2.5 flex items-center gap-3">
          <span className="text-xs text-muted">ประเภททุนทั้งหมด</span>
          <span className="text-xl font-bold text-foreground">{scholarshipTypes.length}</span>
          <span className="text-xs text-muted">ประเภท</span>
        </div>
        <div className="rounded-xl border border-border bg-surface px-4 py-2.5 flex items-center gap-3">
          <span className="text-xs text-muted">จำนวนทุนรวม</span>
          <span className="text-xl font-bold text-primary">{totalCount.toLocaleString()}</span>
          <span className="text-xs text-muted">ทุน</span>
        </div>
      </div>

      {/* ── Status pills ── */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: "",         label: "ทั้งหมด",    count: statusCounts.all,      pill: "bg-surface-muted border-border text-foreground" },
          { key: "active",   label: "แสดงอยู่",   count: statusCounts.active,   pill: "bg-emerald-50 border-emerald-200 text-emerald-700" },
          { key: "inactive", label: "ซ่อนอยู่",  count: statusCounts.inactive, pill: "bg-amber-50 border-amber-200 text-amber-700" },
          { key: "draft",    label: "แบบร่าง",    count: statusCounts.draft,    pill: "bg-gray-50 border-gray-200 text-gray-600" },
        ].map(({ key, label, count, pill }) => (
          <button key={key} onClick={() => setFilterStatus(filterStatus === key ? "" : key)}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${pill} ${filterStatus === key ? "ring-2 ring-primary/30 ring-offset-1" : "opacity-80 hover:opacity-100"}`}>
            {label}
            <span className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${filterStatus === key ? "bg-primary/10" : "bg-border"}`}>{count}</span>
          </button>
        ))}
      </div>

      {/* ── Search row ── */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
          <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addKeyword(); }}
            placeholder="ค้นหาชื่อทุน ความคุ้มครอง มูลค่า คุณสมบัติ… (Enter เพื่อล็อก)"
            maxLength={80} className={`${inputCls} pl-9`} />
        </div>
        <button onClick={addKeyword} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors">ค้นหา</button>
        <button onClick={() => setModal({ mode: "add" })} className="btn-primary whitespace-nowrap">+ เพิ่มประเภททุน</button>
      </div>

      {/* ── Filter row ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-col gap-0.5">
          <label className={labelCls}>สถานะ</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={selectCls}>
            <option value="">◎ ทั้งหมด</option>
            <option value="active">แสดงอยู่</option>
            <option value="inactive">ซ่อนอยู่</option>
            <option value="draft">แบบร่าง</option>
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
          {filterStatus && <button className={chipBase} onClick={() => setFilterStatus("")}>สถานะ: {statusLabel} <XIcon /></button>}
          {sortBy !== "default" && <button className={chipBase} onClick={() => setSortBy("default")}>เรียง: {sortLabel} <XIcon /></button>}
          {keywords.map((k) => <button key={k} className={chipBase} onClick={() => removeKeyword(k)}>"{k}" <XIcon /></button>)}
          <button onClick={clearAll} className="text-xs text-muted underline hover:text-foreground transition-colors">ล้างทั้งหมด</button>
        </div>
      )}

      {/* ── Table ── */}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-muted">
                {["ประเภททุน", "ความคุ้มครอง", "มูลค่า / ภาค", "มูลค่ารวม", "จำนวนทุน", "คุณสมบัติ / สิทธิฯ", "สถานะ", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pageSlice.length === 0 ? (
                <tr><td colSpan={8} className="py-16 text-center text-sm text-muted">ไม่พบประเภททุนที่ตรงกับเงื่อนไข</td></tr>
              ) : pageSlice.map((s) => (
                <tr key={s.id} className="hover:bg-surface-muted/60 transition-colors cursor-pointer" onClick={() => setDetail(s)}>
                  {/* Name */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{s.icon}</span>
                      <div>
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${s.badgeColor}`}>
                          <HighlightText text={s.name} terms={activeTerms} />
                        </span>
                        {s.featured && <span className="ml-1.5 text-xs text-amber-500">★ แนะนำ</span>}
                        <p className="mt-0.5 font-mono text-[10px] text-muted/70">{s.id}</p>
                      </div>
                    </div>
                  </td>
                  {/* Coverage */}
                  <td className="px-4 py-3 text-xs text-muted">
                    <HighlightText text={s.coverage} terms={activeTerms} />
                  </td>
                  {/* Value/sem */}
                  <td className="px-4 py-3 text-xs font-medium text-foreground">
                    <HighlightText text={s.valuePerSem} terms={activeTerms} />
                  </td>
                  {/* Total */}
                  <td className="px-4 py-3 text-xs text-muted">
                    <HighlightText text={s.valueTotal} terms={activeTerms} />
                  </td>
                  {/* Count */}
                  <td className="px-4 py-3">
                    <span className="text-sm font-bold text-foreground">{s.count ?? 0}</span>
                    <span className="ml-1 text-xs text-muted">ทุน</span>
                  </td>
                  {/* Criteria / Benefits count */}
                  <td className="px-4 py-3 text-xs text-muted space-y-0.5">
                    <p>คุณสมบัติ {s.criteria?.length ?? 0} ข้อ</p>
                    <p>สิทธิฯ {s.benefits?.length ?? 0} ข้อ</p>
                  </td>
                  {/* Status */}
                  <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                  {/* Actions */}
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => setModal({ mode: "edit", item: s })}
                      className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted hover:border-primary hover:text-primary transition-colors">แก้ไข</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3 bg-surface-muted/40">
          <div className="flex items-center gap-2 text-xs text-muted">
            <span>แสดง</span>
            <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}
              className="rounded border border-border bg-surface px-1.5 py-1 text-xs outline-none">
              {PAGE_SIZE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            <span>รายการ</span>
            {filtered.length > 0 && <span>({(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filtered.length)} จาก {filtered.length})</span>}
          </div>
          <Pagination page={safePage} totalPages={totalPages} onPage={setPage} />
        </div>
      </div>

      {modal && <ScholarshipModal item={modal.item} onClose={() => setModal(null)} onSave={handleSave} />}
      {detail && (
        <ScholarshipDetail item={detail} onClose={() => setDetail(null)}
          onEdit={(s) => { setDetail(null); setModal({ mode: "edit", item: s }); }}
          onDelete={(id) => { deleteScholarshipType(id); setDetail(null); }} />
      )}
    </div>
  );
}
