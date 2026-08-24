"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Image from "next/image";
import { useActivities } from "./contexts/ActivitiesContext";
import { formatDate, formatDateTime } from "@/lib/utils/newsUtils";

// ── Constants ──────────────────────────────────────────────────
const TYPES = ["Workshop", "การแข่งขัน", "Career", "สังคม", "สัมมนา", "กีฬา"];

const TYPE_COLORS = {
  Workshop:      "bg-blue-100 text-blue-700",
  "การแข่งขัน": "bg-purple-100 text-purple-700",
  Career:        "bg-emerald-100 text-emerald-700",
  สังคม:         "bg-pink-100 text-pink-700",
  สัมมนา:        "bg-orange-100 text-orange-700",
  กีฬา:          "bg-red-100 text-red-700",
};

const STATUS_CONFIG = {
  published: { label: "เผยแพร่",  color: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  draft:     { label: "แบบร่าง",  color: "bg-amber-100 text-amber-700 border-amber-200",       dot: "bg-amber-400" },
  archived:  { label: "เก็บถาวร", color: "bg-gray-100 text-gray-600 border-gray-200",          dot: "bg-gray-400" },
};

const SORT_OPTIONS = [
  { value: "newest",   label: "🕐 วันจัดล่าสุด" },
  { value: "oldest",   label: "🕐 วันจัดเก่าสุด" },
  { value: "created",  label: "📅 สร้างล่าสุด" },
  { value: "title_az", label: "ก–ฮ (ชื่อ)" },
  { value: "views",    label: "👁 ยอดวิวมากสุด" },
];

const PAGE_SIZE_OPTIONS = [10, 20, 50];

// ── Styles ─────────────────────────────────────────────────────
const inputCls  = "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-accent-soft placeholder:text-muted";
const selectCls = "rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-accent-soft";
const labelCls  = "text-xs font-medium text-foreground";
const chipBase  = "inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-accent-soft px-2.5 py-1 text-xs font-semibold text-primary hover:border-red-400 hover:bg-red-50 hover:text-red-500 transition-colors";

// ── Icons ──────────────────────────────────────────────────────
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

// ── Filter persistence ─────────────────────────────────────────
const FILTER_KEY = "activities-list-filters";
function loadFilters() {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(sessionStorage.getItem(FILTER_KEY)) ?? {}; }
  catch { return {}; }
}
function saveFilters(data) {
  try { sessionStorage.setItem(FILTER_KEY, JSON.stringify(data)); }
  catch { /* ignore */ }
}

// ── Helper components ──────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${cfg.color}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function TypeBadge({ type }) {
  const color = TYPE_COLORS[type] ?? "bg-gray-100 text-gray-600";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${color}`}>
      {type}
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
        i % 2 === 1
          ? <mark key={i} className="rounded bg-amber-100 text-amber-800 px-0.5 not-italic">{part}</mark>
          : <span key={i}>{part}</span>
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
      <button disabled={page === 1} onClick={() => onPage(page - 1)}
        className={`${btn} border border-border text-muted hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed`}>‹</button>
      {pages.map((p, i) =>
        p === "…"
          ? <span key={`e${i}`} className="px-1 text-sm text-muted select-none">…</span>
          : <button key={p} onClick={() => onPage(p)}
              className={`${btn} border ${p === page ? "border-primary bg-primary text-white" : "border-border text-muted hover:border-primary hover:text-primary"}`}>
              {p}
            </button>
      )}
      <button disabled={page === totalPages} onClick={() => onPage(page + 1)}
        className={`${btn} border border-border text-muted hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed`}>›</button>
    </div>
  );
}

function TagInput({ tags, onChange }) {
  const [input, setInput] = useState("");
  const addTag = () => {
    const t = input.trim();
    if (t && !tags.includes(t)) onChange([...tags, t]);
    setInput("");
  };
  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-1.5">
        {tags.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-full bg-accent-soft border border-primary/30 px-2.5 py-1 text-xs font-semibold text-primary">
            {t}
            <button type="button" onClick={() => onChange(tags.filter((x) => x !== t))} className="hover:text-red-500 transition-colors"><XIcon /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
          placeholder="พิมพ์แท็ก แล้ว Enter" className={inputCls} />
        <button type="button" onClick={addTag}
          className="rounded-lg border border-border px-3 py-2 text-sm text-muted hover:text-foreground transition-colors whitespace-nowrap">+ เพิ่ม</button>
      </div>
    </div>
  );
}

function slugify(text) {
  return text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 80);
}
function nextId(list) {
  const nums = list.map((a) => parseInt(a.id.replace("ACT", ""), 10)).filter(Boolean);
  return `ACT${String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3, "0")}`;
}
function emptyForm() {
  return { title: "", slug: "", type: TYPES[0], typeColor: TYPE_COLORS[TYPES[0]], date: "", location: "", image: "", excerpt: "", organizer: "", tags: [], status: "draft", featured: false };
}

// ── DeleteModal ────────────────────────────────────────────────
function DeleteModal({ title, onConfirm, onCancel }) {
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onCancel]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-2xl">
        <h3 className="text-base font-bold text-foreground">ยืนยันการลบ</h3>
        <p className="mt-2 text-sm text-muted">
          ต้องการลบกิจกรรม <span className="font-semibold text-foreground">"{title}"</span> ใช่หรือไม่?
          การกระทำนี้ไม่สามารถย้อนกลับได้
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors">ยกเลิก</button>
          <button onClick={onConfirm} className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 transition-colors">ลบกิจกรรม</button>
        </div>
      </div>
    </div>
  );
}

// ── ActivityDetail (info panel) ────────────────────────────────
function ActivityDetail({ item, onClose, onEdit, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const row = (label, value) => value ? (
    <div className="flex items-start gap-3">
      <span className="w-28 flex-shrink-0 text-xs text-muted pt-0.5">{label}</span>
      <span className="flex-1 text-sm text-foreground break-words">{value}</span>
    </div>
  ) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="flex w-full max-w-2xl flex-col rounded-2xl border border-border bg-surface shadow-2xl max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-border px-5 py-4 flex-shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-muted">{item.id}</span>
            <TypeBadge type={item.type} />
            <StatusBadge status={item.status} />
            {item.featured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-semibold text-amber-700">★ Featured</span>
            )}
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-surface-muted hover:text-foreground transition-colors ml-2 flex-shrink-0"><XIcon /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {item.image && (
            <div className="relative h-48 w-full overflow-hidden rounded-xl border border-border bg-surface-muted">
              <Image src={item.image} alt={item.title} fill className="object-cover" />
            </div>
          )}
          <div>
            <h2 className="text-base font-bold text-foreground leading-snug">{item.title}</h2>
            <p className="mt-1.5 text-sm text-muted leading-relaxed">{item.excerpt}</p>
          </div>
          <div className="space-y-2.5 rounded-xl border border-border p-4">
            {row("วันที่จัด", formatDate(item.date))}
            {row("สถานที่", item.location)}
            {row("จัดโดย", item.organizer)}
            {row("สร้างเมื่อ", formatDateTime(item.createdAt))}
            {row("แก้ไขล่าสุด", formatDateTime(item.updatedAt))}
            {row("ยอดวิว", item.views != null ? `${item.views.toLocaleString()} ครั้ง` : null)}
          </div>
          {item.tags?.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium text-muted">แท็ก</p>
              <div className="flex flex-wrap gap-1.5">
                {item.tags.map((t) => (
                  <span key={t} className="rounded-full bg-accent-soft border border-primary/30 px-2.5 py-1 text-xs font-semibold text-primary">{t}</span>
                ))}
              </div>
            </div>
          )}
          {confirmDelete && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-3">
              <p className="text-sm font-semibold text-red-700">ยืนยันการลบกิจกรรม</p>
              <p className="text-xs text-red-600">"{item.title}" จะถูกลบถาวร</p>
              <div className="flex gap-2">
                <button onClick={() => { onDelete(item.id); onClose(); }} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors">ยืนยันลบ</button>
                <button onClick={() => setConfirmDelete(false)} className="rounded-lg border border-border px-4 py-2 text-sm text-muted hover:text-foreground transition-colors">ยกเลิก</button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border px-5 py-4 flex-shrink-0">
          {!confirmDelete
            ? <button onClick={() => setConfirmDelete(true)} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">ลบกิจกรรม</button>
            : <div />
          }
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors">ปิด</button>
            <button onClick={() => { onEdit(item); onClose(); }} className="btn-primary">แก้ไข</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── ActivityPreview ────────────────────────────────────────────
function formatDatePrev(iso) {
  if (!iso) return "";
  try { return new Date(iso).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" }); }
  catch { return iso; }
}

function RenderBlock({ block }) {
  switch (block.type) {
    case "paragraph": return block.content ? <p className="text-base leading-8 text-foreground/80 whitespace-pre-wrap">{block.content}</p> : null;
    case "heading2":  return block.content ? <h2 className="text-2xl font-extrabold text-foreground leading-tight">{block.content}</h2> : null;
    case "heading3":  return block.content ? <h3 className="text-lg font-bold text-foreground leading-tight">{block.content}</h3> : null;
    case "spacer":    return <div className="h-6" />;
    default: return null;
  }
}

function ActivityPreview({ item, onClose, onEdit }) {
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const blocks = item.blocks || [];
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-100">
      <div className="flex items-center gap-3 border-b border-border bg-white px-5 py-3 shrink-0">
        <button onClick={onClose} className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors">← ปิด</button>
        <div className="flex-1" />
        <StatusBadge status={item.status} />
        <p className="text-sm font-semibold text-foreground line-clamp-1 max-w-xs">{item.title}</p>
        <div className="flex-1" />
        <button onClick={() => { onClose(); onEdit(item); }} className="btn-primary text-sm">✏️ แก้ไข</button>
      </div>

      <div className="flex-1 overflow-y-auto py-10">
        <div className="mx-auto max-w-4xl px-4">
          {item.image && (
            <figure className="mb-8">
              <div className="relative w-full overflow-hidden rounded-2xl" style={{ aspectRatio: "16/9" }}>
                <Image src={item.image} alt={item.title} fill className="object-cover"
                  sizes="(max-width: 768px) 100vw, 896px" />
                {item.featured && (
                  <span className="absolute left-4 top-4 flex items-center gap-1 rounded-xl bg-primary px-3 py-1.5 text-sm font-extrabold text-white shadow-lg">
                    ⭐ กิจกรรมเด่น
                  </span>
                )}
              </div>
            </figure>
          )}

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.typeColor}`}>{item.type}</span>
                <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-foreground md:text-4xl">{item.title}</h1>
              </div>
              {item.excerpt && (
                <p className="border-l-4 border-primary pl-5 text-lg font-medium leading-relaxed text-foreground">{item.excerpt}</p>
              )}
              {blocks.length > 0 && (
                <div className="space-y-5">{blocks.map((b) => <RenderBlock key={b.id} block={b} />)}</div>
              )}
              {item.tags?.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 border-t border-border pt-6">
                  <span className="text-xs text-muted">แท็ก:</span>
                  {item.tags.map((t) => (
                    <span key={t} className="rounded-full bg-surface-muted px-3 py-0.5 text-xs font-medium text-muted">#{t}</span>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-white p-5 space-y-4 h-fit">
              <p className="font-bold text-foreground">รายละเอียดกิจกรรม</p>
              <div className="space-y-3 text-sm">
                {[
                  { icon: "📅", label: "วันที่จัด", val: formatDatePrev(item.date) },
                  { icon: "📍", label: "สถานที่", val: item.location },
                  { icon: "🏛️", label: "จัดโดย", val: item.organizer },
                ].filter((r) => r.val).map((r) => (
                  <div key={r.label} className="flex items-start gap-2.5">
                    <span className="shrink-0">{r.icon}</span>
                    <div>
                      <p className="text-xs text-muted">{r.label}</p>
                      <p className="font-medium text-foreground">{r.val}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── ActivityModal (add/edit) ───────────────────────────────────
function ActivityModal({ item, onClose, onSave }) {
  const isEdit = !!item;
  const [form, setForm] = useState(isEdit ? { ...item } : emptyForm());
  const [errors, setErrors] = useState({});
  const titleRef = useRef(null);

  useEffect(() => {
    titleRef.current?.focus();
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const set = (field, val) => {
    setForm((f) => {
      const next = { ...f, [field]: val };
      if (field === "type") next.typeColor = TYPE_COLORS[val] ?? "";
      if (field === "title" && !isEdit) next.slug = slugify(val);
      return next;
    });
    setErrors((e) => ({ ...e, [field]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "กรุณากรอกชื่อกิจกรรม";
    if (!form.excerpt.trim()) e.excerpt = "กรุณากรอกสรุปย่อ";
    if (!form.organizer.trim()) e.organizer = "กรุณากรอกชื่อผู้จัดงาน";
    if (!form.date) e.date = "กรุณาระบุวันที่จัด";
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onSave(form);
    onClose();
  };

  const field = (label, key, opts = {}) => (
    <div>
      <label className={`mb-1 block ${labelCls}`}>{label}{opts.required && <span className="ml-0.5 text-red-500">*</span>}</label>
      {opts.textarea
        ? <textarea value={form[key]} onChange={(e) => set(key, e.target.value)} rows={opts.rows ?? 3} placeholder={opts.placeholder} className={`${inputCls} resize-none`} />
        : <input type={opts.type ?? "text"} value={form[key]} onChange={(e) => set(key, e.target.value)} placeholder={opts.placeholder} className={inputCls} />
      }
      {errors[key] && <p className="mt-1 text-xs text-red-500">{errors[key]}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="flex w-full max-w-2xl flex-col rounded-2xl border border-border bg-surface shadow-2xl max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-border px-5 py-4 flex-shrink-0">
          <div>
            <p className="text-sm font-semibold text-foreground">{isEdit ? "แก้ไขกิจกรรม" : "เพิ่มกิจกรรมใหม่"}</p>
            <p className="text-xs text-muted">{isEdit ? `รหัส ${item.id}` : "กรอกข้อมูลกิจกรรมที่ต้องการเพิ่ม"}</p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-surface-muted hover:text-foreground transition-colors"><XIcon /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          <div ref={titleRef} tabIndex={-1} />
          {field("ชื่อกิจกรรม", "title", { required: true, placeholder: "ชื่อกิจกรรม..." })}
          {field("Slug (URL)", "slug", { placeholder: "auto-generated-from-title" })}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`mb-1 block ${labelCls}`}>ประเภทกิจกรรม</label>
              <select value={form.type} onChange={(e) => set("type", e.target.value)} className={`${selectCls} w-full`}>
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={`mb-1 block ${labelCls}`}>สถานะ</label>
              <select value={form.status} onChange={(e) => set("status", e.target.value)} className={`${selectCls} w-full`}>
                <option value="draft">แบบร่าง</option>
                <option value="published">เผยแพร่</option>
                <option value="archived">เก็บถาวร</option>
              </select>
            </div>
          </div>

          {field("วันที่จัดงาน", "date", { required: true, type: "date" })}
          {field("สถานที่จัดงาน", "location", { placeholder: "ห้อง, อาคาร, สถานที่..." })}
          {field("สรุปย่อ", "excerpt", { required: true, textarea: true, rows: 3, placeholder: "อธิบายกิจกรรมโดยย่อ..." })}
          {field("ผู้จัดงาน", "organizer", { required: true, placeholder: "ภาควิชา / ชมรม / ฝ่าย..." })}
          {field("URL รูปภาพ", "image", { placeholder: "/activities/activity1.jpg" })}

          <div>
            <label className={`mb-1 block ${labelCls}`}>แท็ก</label>
            <TagInput tags={form.tags} onChange={(v) => set("tags", v)} />
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-4 py-3 hover:bg-surface-muted transition-colors">
            <input type="checkbox" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} className="h-4 w-4 accent-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">ปักหมุด (Featured)</p>
              <p className="text-xs text-muted">แสดงกิจกรรมนี้ในส่วนเด่นของหน้าแรก</p>
            </div>
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4 flex-shrink-0">
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors">ยกเลิก</button>
          <button onClick={handleSubmit} className="btn-primary">{isEdit ? "บันทึกการแก้ไข" : "เพิ่มกิจกรรม"}</button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────
export default function ActivitiesListClient() {
  const { activities, ready, addActivity, updateActivity, deleteActivity } = useActivities();

  const [searchInput, setSearchInput]   = useState("");
  const [keywords,    setKeywords]      = useState([]);
  const [filterType,  setFilterType]    = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [sortBy,      setSortBy]        = useState("newest");
  const [pageSize,    setPageSize]      = useState(10);
  const [page,        setPage]          = useState(1);
  const [hydrated,    setHydrated]      = useState(false);

  const [modal,     setModal]     = useState(null);
  const [preview,   setPreview]   = useState(null);
  const [detail,    setDetail]    = useState(null);
  const [delTarget, setDelTarget] = useState(null);

  useEffect(() => {
    const f = loadFilters();
    if (f.searchInput  !== undefined) setSearchInput(f.searchInput);
    if (f.keywords     !== undefined) setKeywords(f.keywords);
    if (f.filterType   !== undefined) setFilterType(f.filterType);
    if (f.filterStatus !== undefined) setFilterStatus(f.filterStatus);
    if (f.sortBy !== undefined && f.sortBy !== "default") setSortBy(f.sortBy);
    if (f.pageSize     !== undefined) setPageSize(f.pageSize);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveFilters({ searchInput, keywords, filterType, filterStatus, sortBy, pageSize });
    setPage(1);
  }, [searchInput, keywords, filterType, filterStatus, sortBy, pageSize, hydrated]);

  const addKeyword = () => {
    const t = searchInput.trim();
    if (t && !keywords.includes(t)) setKeywords([...keywords, t]);
    setSearchInput("");
  };
  const removeKeyword = (k) => setKeywords(keywords.filter((x) => x !== k));
  const activeTerms = useMemo(() => [...keywords, searchInput.trim()].filter(Boolean), [keywords, searchInput]);

  const matchField = (a, q) => {
    const ql = q.toLowerCase();
    return [a.id, a.title, a.excerpt, a.organizer, a.type, a.location, ...(a.tags ?? [])].some((v) => String(v ?? "").toLowerCase().includes(ql));
  };

  const filtered = useMemo(() => {
    let list = [...activities];
    keywords.forEach((k) => { list = list.filter((a) => matchField(a, k)); });
    if (searchInput.trim()) list = list.filter((a) => matchField(a, searchInput.trim()));
    if (filterType)   list = list.filter((a) => a.type   === filterType);
    if (filterStatus) list = list.filter((a) => a.status === filterStatus);
    switch (sortBy) {
      case "newest":   list.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "")); break;
      case "oldest":   list.sort((a, b) => (a.date ?? "").localeCompare(b.date ?? "")); break;
      case "created":  list.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? "")); break;
      case "title_az": list.sort((a, b) => a.title.localeCompare(b.title, "th")); break;
      case "views":    list.sort((a, b) => (b.views ?? 0) - (a.views ?? 0)); break;
      default: break;
    }
    return list;
  }, [activities, keywords, searchInput, filterType, filterStatus, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage   = Math.min(page, totalPages);
  const pageSlice  = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const statusCounts = useMemo(() => {
    const base = activities.filter((a) => {
      if (filterType && a.type !== filterType) return false;
      if (keywords.length && !keywords.every((k) => matchField(a, k))) return false;
      if (searchInput.trim() && !matchField(a, searchInput.trim())) return false;
      return true;
    });
    return {
      all:       base.length,
      published: base.filter((a) => a.status === "published").length,
      draft:     base.filter((a) => a.status === "draft").length,
      archived:  base.filter((a) => a.status === "archived").length,
    };
  }, [activities, filterType, keywords, searchInput]);

  const hasFilters = filterType || filterStatus || keywords.length > 0;
  const clearAll = () => { setKeywords([]); setSearchInput(""); setFilterType(""); setFilterStatus(""); setSortBy("newest"); };

  const handleSave = (form) => {
    if (modal?.mode === "edit") {
      updateActivity(modal.item.id, { ...form, updatedAt: new Date().toISOString().slice(0, 10) });
    } else {
      const now = new Date().toISOString().slice(0, 10);
      addActivity({ ...form, id: nextId(activities), views: 0, createdAt: now, updatedAt: now });
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
      {/* ── Status pills ── */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: "",          label: "ทั้งหมด",  count: statusCounts.all,       pill: "bg-surface-muted border-border text-foreground" },
          { key: "published", label: "เผยแพร่",  count: statusCounts.published, pill: "bg-emerald-50 border-emerald-200 text-emerald-700" },
          { key: "draft",     label: "แบบร่าง",  count: statusCounts.draft,     pill: "bg-amber-50 border-amber-200 text-amber-700" },
          { key: "archived",  label: "เก็บถาวร", count: statusCounts.archived,  pill: "bg-gray-50 border-gray-200 text-gray-600" },
        ].map(({ key, label, count, pill }) => (
          <button key={key} onClick={() => setFilterStatus(filterStatus === key ? "" : key)}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold transition-all ${pill} ${filterStatus === key ? "ring-2 ring-primary/30 ring-offset-1" : "opacity-70 hover:opacity-100"}`}>
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
            placeholder="ค้นหาชื่อ ผู้จัดงาน ประเภท สถานที่… (Enter เพื่อล็อก)"
            maxLength={80} className={`${inputCls} pl-9`} />
        </div>
        <button onClick={addKeyword} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors">ค้นหา</button>
        <button onClick={() => setModal({ mode: "add" })} className="btn-primary whitespace-nowrap">+ เพิ่มกิจกรรม</button>
      </div>

      {/* ── Filter row ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-col gap-0.5">
          <label className={labelCls}>ประเภท</label>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className={selectCls}>
            <option value="">ประเภททั้งหมด</option>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-0.5">
          <label className={labelCls}>สถานะ</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={selectCls}>
            <option value="">◎ ทั้งหมด</option>
            <option value="published">เผยแพร่</option>
            <option value="draft">แบบร่าง</option>
            <option value="archived">เก็บถาวร</option>
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
          {filterType && <button className={chipBase} onClick={() => setFilterType("")}>ประเภท: {filterType} <XIcon /></button>}
          {filterStatus && <button className={chipBase} onClick={() => setFilterStatus("")}>สถานะ: {statusLabel} <XIcon /></button>}
          {keywords.map((k) => (
            <button key={k} className={chipBase} onClick={() => removeKeyword(k)}>"{k}" <XIcon /></button>
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
                {["รูป", "ชื่อกิจกรรม / สรุปย่อ", "ประเภท", "วันที่ / สถานที่", "สถานะ", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pageSlice.length === 0 ? (
                <tr><td colSpan={6} className="py-16 text-center text-sm text-muted">ไม่พบกิจกรรมที่ตรงกับเงื่อนไข</td></tr>
              ) : pageSlice.map((a) => (
                <tr key={a.id} className="hover:bg-surface-muted/60 transition-colors cursor-pointer" onClick={() => setDetail(a)}>
                  <td className="px-4 py-3">
                    <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border border-border bg-surface-muted">
                      {a.image
                        ? <Image src={a.image} alt={a.title} fill className="object-cover" />
                        : <div className="flex h-full items-center justify-center text-muted text-xs">ไม่มีรูป</div>
                      }
                    </div>
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <div className="flex items-center gap-1 mb-0.5">
                      {a.featured && <span className="text-amber-500 text-xs">★</span>}
                      <p className="font-semibold text-foreground line-clamp-1 text-sm"><HighlightText text={a.title} terms={activeTerms} /></p>
                    </div>
                    <p className="text-xs text-muted line-clamp-2 leading-relaxed"><HighlightText text={a.excerpt} terms={activeTerms} /></p>
                    <p className="mt-1 font-mono text-[10px] text-muted/70">{a.id}</p>
                  </td>
                  <td className="px-4 py-3"><TypeBadge type={a.type} /></td>
                  <td className="px-4 py-3 text-xs text-muted">
                    <p className="font-medium text-foreground">{formatDate(a.date)}</p>
                    <p className="mt-0.5 line-clamp-1">{a.location}</p>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <button title="ดูตัวอย่าง" onClick={() => setPreview(a)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted hover:border-primary hover:text-primary transition-colors">
                        <EyeIcon />
                      </button>
                      <button title="แก้ไข" onClick={() => setModal({ mode: "edit", item: a })}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted hover:border-amber-400 hover:text-amber-500 transition-colors">
                        <EditIcon />
                      </button>
                      <button title="ลบ" onClick={() => setDelTarget(a)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted hover:border-red-400 hover:text-red-500 transition-colors">
                        <TrashIcon />
                      </button>
                    </div>
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

      {modal && <ActivityModal item={modal.item} onClose={() => setModal(null)} onSave={handleSave} />}
      {preview && <ActivityPreview item={preview} onClose={() => setPreview(null)} onEdit={(a) => { setPreview(null); setModal({ mode: "edit", item: a }); }} />}
      {detail && <ActivityDetail item={detail} onClose={() => setDetail(null)} onEdit={(a) => { setDetail(null); setModal({ mode: "edit", item: a }); }} onDelete={(id) => { deleteActivity(id); setDetail(null); }} />}
      {delTarget && <DeleteModal title={delTarget.title} onConfirm={() => { deleteActivity(delTarget.id); setDelTarget(null); }} onCancel={() => setDelTarget(null)} />}
    </div>
  );
}
