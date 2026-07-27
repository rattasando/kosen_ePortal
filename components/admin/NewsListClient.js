"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { useNews } from "./contexts/NewsContext";
import NewsEditor, { emptyNewsForm, NewsPreview } from "./editors/NewsEditor";

// ── Constants ──────────────────────────────────────────────────
const CATEGORIES = [
  "ความร่วมมือ",
  "กิจกรรม",
  "ทุนการศึกษา",
  "ประกาศ",
  "ความสำเร็จ",
  "โครงการแลกเปลี่ยน",
];

const CAT_COLORS = {
  ความร่วมมือ:       "bg-blue-100 text-blue-700",
  กิจกรรม:           "bg-violet-100 text-violet-700",
  ทุนการศึกษา:       "bg-amber-100 text-amber-700",
  ประกาศ:            "bg-slate-100 text-slate-700",
  ความสำเร็จ:        "bg-emerald-100 text-emerald-700",
  โครงการแลกเปลี่ยน: "bg-rose-100 text-rose-700",
};

const STATUS_CONFIG = {
  published: { label: "เผยแพร่",   color: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  draft:     { label: "แบบร่าง",   color: "bg-amber-100 text-amber-700 border-amber-200",       dot: "bg-amber-400" },
  archived:  { label: "เก็บถาวร",  color: "bg-gray-100 text-gray-600 border-gray-200",          dot: "bg-gray-400" },
};

const SORT_OPTIONS = [
  { value: "default",     label: "⇅ ค่าเริ่มต้น" },
  { value: "newest",      label: "📅 วันเผยแพร่ ใหม่สุดก่อน" },
  { value: "oldest",      label: "📅 วันเผยแพร่ เก่าสุดก่อน" },
  { value: "created_new", label: "🕐 วันสร้าง ใหม่สุดก่อน" },
  { value: "created_old", label: "🕐 วันสร้าง เก่าสุดก่อน" },
  { value: "title_az",    label: "ก–ฮ (หัวข้อ)" },
  { value: "views",       label: "👁 ยอดวิวมากสุด" },
];

const PAGE_SIZE_OPTIONS = [10, 20, 50];

// ── Style constants ────────────────────────────────────────────
const inputCls  = "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-accent-soft placeholder:text-muted";
const selectCls = "rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-accent-soft";
const labelCls  = "text-xs font-medium text-foreground";
const chipBase  = "inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-accent-soft px-2.5 py-1 text-xs font-semibold text-primary hover:border-red-400 hover:bg-red-50 hover:text-red-500 transition-colors";

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
const FILTER_KEY = "news-list-filters";
function loadFilters() {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(FILTER_KEY)) ?? {}; }
  catch { return {}; }
}
function saveFilters(data) {
  try { localStorage.setItem(FILTER_KEY, JSON.stringify(data)); }
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

function CategoryBadge({ category }) {
  const color = CAT_COLORS[category] ?? "bg-gray-100 text-gray-600";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${color}`}>
      {category}
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
        ) : (
          <span key={i}>{part}</span>
        )
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

// ── Tag input helper ───────────────────────────────────────────
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
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
          placeholder="พิมพ์แท็ก แล้ว Enter"
          className={inputCls}
        />
        <button type="button" onClick={addTag}
          className="rounded-lg border border-border px-3 py-2 text-sm text-muted hover:text-foreground transition-colors whitespace-nowrap">
          + เพิ่ม
        </button>
      </div>
    </div>
  );
}

// ── Empty form ─────────────────────────────────────────────────
function emptyForm() { return emptyNewsForm(); }

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

function nextId(news) {
  const nums = news.map((n) => parseInt(n.id.replace("NEWS", ""), 10)).filter(Boolean);
  const max = nums.length ? Math.max(...nums) : 0;
  return `NEWS${String(max + 1).padStart(3, "0")}`;
}

// ── DeleteModal ────────────────────────────────────────────────
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
          ต้องการลบข่าว <span className="font-semibold text-foreground">"{title}"</span> ใช่หรือไม่?
          การกระทำนี้ไม่สามารถย้อนกลับได้
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onCancel}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors">
            ยกเลิก
          </button>
          <button onClick={onConfirm}
            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 transition-colors">
            ลบข่าว
          </button>
        </div>
      </div>
    </div>
  );
}


// ── NewsDetail (Detail panel) ──────────────────────────────────
function NewsDetail({ item, onClose, onEdit, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.draft;

  const infoRow = (label, value) => (
    <div className="flex items-start gap-3">
      <span className="w-28 flex-shrink-0 text-xs text-muted pt-0.5">{label}</span>
      <span className="flex-1 text-sm text-foreground break-words">{value ?? "—"}</span>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="flex w-full max-w-2xl flex-col rounded-2xl border border-border bg-surface shadow-2xl max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-mono text-muted">{item.id}</span>
            <StatusBadge status={item.status} />
            {item.featured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-semibold text-amber-700">
                ★ Featured
              </span>
            )}
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-surface-muted hover:text-foreground transition-colors ml-2 flex-shrink-0">
            <XIcon />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {/* Thumbnail */}
          {item.image && (
            <div className="relative h-48 w-full overflow-hidden rounded-xl border border-border bg-surface-muted">
              <Image src={item.image} alt={item.title} fill className="object-cover" />
            </div>
          )}

          {/* Title */}
          <div>
            <CategoryBadge category={item.category} />
            <h2 className="mt-2 text-base font-bold text-foreground leading-snug">{item.title}</h2>
            <p className="mt-1.5 text-sm text-muted leading-relaxed">{item.excerpt}</p>
          </div>

          {/* Info */}
          <div className="space-y-2.5 rounded-xl border border-border p-4">
            {infoRow("ผู้เขียน", item.author)}
            {infoRow("Slug", item.slug || "—")}
            {infoRow("วันที่เผยแพร่", item.publishedAt ?? "ยังไม่เผยแพร่")}
            {infoRow("สร้างเมื่อ", item.createdAt)}
            {infoRow("แก้ไขล่าสุด", item.updatedAt)}
            {infoRow("ยอดวิว", item.views != null ? `${item.views.toLocaleString()} ครั้ง` : "—")}
          </div>

          {/* Tags */}
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

          {/* Delete confirm */}
          {confirmDelete && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-3">
              <p className="text-sm font-semibold text-red-700">ยืนยันการลบข่าว</p>
              <p className="text-xs text-red-600">ข่าว "{item.title}" จะถูกลบถาวร ไม่สามารถกู้คืนได้</p>
              <div className="flex gap-2">
                <button onClick={() => { onDelete(item.id); onClose(); }}
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
              ลบข่าว
            </button>
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
export default function NewsListClient() {
  const { news, ready, addNews, updateNews, deleteNews } = useNews();

  // ── Filter state (session-persisted) ─
  const [searchInput, setSearchInput]   = useState("");
  const [keywords,    setKeywords]      = useState([]);
  const [filterCat,   setFilterCat]     = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [sortBy,      setSortBy]        = useState("default");
  const [pageSize,    setPageSize]      = useState(10);
  const [page,        setPage]          = useState(1);
  const [hydrated,    setHydrated]      = useState(false);

  // ── Modal state ─
  const [modal,     setModal]    = useState(null);
  const [preview,   setPreview]  = useState(null);
  const [detail,    setDetail]   = useState(null);
  const [delTarget, setDelTarget] = useState(null);

  // Restore filters from localStorage
  useEffect(() => {
    const f = loadFilters();
    if (f.searchInput  !== undefined) setSearchInput(f.searchInput);
    if (f.keywords     !== undefined) setKeywords(f.keywords);
    if (f.filterCat    !== undefined) setFilterCat(f.filterCat);
    if (f.filterStatus !== undefined) setFilterStatus(f.filterStatus);
    if (f.sortBy       !== undefined) setSortBy(f.sortBy);
    if (f.pageSize     !== undefined) setPageSize(f.pageSize);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveFilters({ searchInput, keywords, filterCat, filterStatus, sortBy, pageSize });
    setPage(1);
  }, [searchInput, keywords, filterCat, filterStatus, sortBy, pageSize, hydrated]);

  // ── Keyword chips ─
  const addKeyword = () => {
    const t = searchInput.trim();
    if (t && !keywords.includes(t)) setKeywords([...keywords, t]);
    setSearchInput("");
  };
  const removeKeyword = (k) => setKeywords(keywords.filter((x) => x !== k));

  const activeTerms = useMemo(
    () => [...keywords, searchInput.trim()].filter(Boolean),
    [keywords, searchInput]
  );

  // ── Match helper ─
  const matchField = (n, q) => {
    const ql = q.toLowerCase();
    return [n.id, n.title, n.excerpt, n.author, n.category, ...(n.tags ?? [])].some(
      (v) => String(v ?? "").toLowerCase().includes(ql)
    );
  };

  // ── Filtered + sorted list ─
  const filtered = useMemo(() => {
    let list = [...news];
    keywords.forEach((k) => { list = list.filter((n) => matchField(n, k)); });
    if (searchInput.trim()) list = list.filter((n) => matchField(n, searchInput.trim()));
    if (filterCat)    list = list.filter((n) => n.category === filterCat);
    if (filterStatus) list = list.filter((n) => n.status   === filterStatus);
    switch (sortBy) {
      case "newest":      list.sort((a, b) => (b.publishedAt ?? b.createdAt ?? "").localeCompare(a.publishedAt ?? a.createdAt ?? "")); break;
      case "oldest":      list.sort((a, b) => (a.publishedAt ?? a.createdAt ?? "").localeCompare(b.publishedAt ?? b.createdAt ?? "")); break;
      case "created_new": list.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? "")); break;
      case "created_old": list.sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? "")); break;
      case "title_az":    list.sort((a, b) => a.title.localeCompare(b.title, "th")); break;
      case "views":       list.sort((a, b) => (b.views ?? 0) - (a.views ?? 0)); break;
      default: break;
    }
    return list;
  }, [news, keywords, searchInput, filterCat, filterStatus, sortBy]);

  // ── Pagination ─
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage   = Math.min(page, totalPages);
  const pageSlice  = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  // ── Status pill counts ─
  const statusCounts = useMemo(() => {
    const base = news.filter((n) => {
      if (filterCat && n.category !== filterCat) return false;
      if (keywords.length && !keywords.every((k) => matchField(n, k))) return false;
      if (searchInput.trim() && !matchField(n, searchInput.trim())) return false;
      return true;
    });
    return {
      all:       base.length,
      published: base.filter((n) => n.status === "published").length,
      draft:     base.filter((n) => n.status === "draft").length,
      archived:  base.filter((n) => n.status === "archived").length,
    };
  }, [news, filterCat, keywords, searchInput]);

  // ── Active filter chips ─
  const hasFilters = !!(filterCat || filterStatus || sortBy !== "default" || keywords.length > 0);

  const clearAll = () => {
    setKeywords([]); setSearchInput("");
    setFilterCat(""); setFilterStatus("");
    setSortBy("default");
  };

  // ── Save handler ─
  const handleSave = (form) => {
    const today = new Date().toISOString().slice(0, 10);
    if (modal?.mode === "edit") {
      updateNews(modal.item.id, {
        ...form,
        updatedAt: today,
        publishedAt: form.publishedAt || (form.status === "published" ? today : modal.item.publishedAt ?? null),
      });
    } else {
      addNews({
        ...form,
        id: nextId(news),
        views: 0,
        createdAt: today,
        updatedAt: today,
        publishedAt: form.publishedAt || (form.status === "published" ? today : null),
      });
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

  const sortLabel = SORT_OPTIONS.find((s) => s.value === sortBy)?.label;
  const statusLabel = filterStatus ? STATUS_CONFIG[filterStatus]?.label : null;

  return (
    <div className="space-y-4 p-6">
      {/* ── Status pills ── */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: "",          label: "ทั้งหมด",   count: statusCounts.all,       pill: "bg-surface-muted border-border text-foreground" },
          { key: "published", label: "เผยแพร่",   count: statusCounts.published, pill: "bg-emerald-50 border-emerald-200 text-emerald-700" },
          { key: "draft",     label: "แบบร่าง",   count: statusCounts.draft,     pill: "bg-amber-50 border-amber-200 text-amber-700" },
          { key: "archived",  label: "เก็บถาวร",  count: statusCounts.archived,  pill: "bg-gray-50 border-gray-200 text-gray-600" },
        ].map(({ key, label, count, pill }) => (
          <button
            key={key}
            onClick={() => setFilterStatus(filterStatus === key ? "" : key)}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold transition-all ${pill} ${filterStatus === key ? "ring-2 ring-primary/30 ring-offset-1" : "opacity-70 hover:opacity-100"}`}
          >
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
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addKeyword(); }}
            placeholder="ค้นหาหัวข้อ ผู้เขียน หมวดหมู่ แท็ก… (Enter เพื่อล็อก)"
            maxLength={80}
            className={`${inputCls} pl-9`}
          />
        </div>
        <button onClick={addKeyword} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors">ค้นหา</button>
        <button onClick={() => setModal({ mode: "add" })} className="btn-primary whitespace-nowrap">+ เพิ่มข่าว</button>
      </div>

      {/* ── Filter row ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-col gap-0.5">
          <label className={labelCls}>หมวดหมู่</label>
          <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className={selectCls}>
            <option value="">หมวดหมู่ทั้งหมด</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
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
          {filterCat && (
            <button className={chipBase} onClick={() => setFilterCat("")}>
              หมวด: {filterCat} <XIcon />
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
          {keywords.map((k) => (
            <button key={k} className={chipBase} onClick={() => removeKeyword(k)}>
              "{k}" <XIcon />
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
                {["รูป", "หัวข้อ / สรุปย่อ", "หมวดหมู่", "ผู้เขียน", "วันที่เผยแพร่", "สถานะ", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pageSlice.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-sm text-muted">ไม่พบข่าวที่ตรงกับเงื่อนไข</td>
                </tr>
              ) : pageSlice.map((n) => (
                <tr
                  key={n.id}
                  className="hover:bg-surface-muted/60 transition-colors cursor-pointer"
                  onClick={() => setDetail(n)}
                >
                  {/* Thumbnail */}
                  <td className="px-4 py-3">
                    <div className="relative h-14 w-20 flex-shrink-0 overflow-hidden rounded-lg border border-border bg-surface-muted">
                      {n.image ? (
                        <Image src={n.image} alt={n.title} fill className="object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-muted text-xs">ไม่มีรูป</div>
                      )}
                    </div>
                  </td>
                  {/* Title + excerpt */}
                  <td className="px-4 py-3 max-w-xs">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {n.featured && <span className="text-amber-500 text-xs">★</span>}
                      <p className="font-semibold text-foreground line-clamp-1 text-sm leading-snug">
                        <HighlightText text={n.title} terms={activeTerms} />
                      </p>
                    </div>
                    <p className="text-xs text-muted line-clamp-2 leading-relaxed">
                      <HighlightText text={n.excerpt} terms={activeTerms} />
                    </p>
                    <p className="mt-1 font-mono text-[10px] text-muted/70">{n.id}</p>
                  </td>
                  {/* Category */}
                  <td className="px-4 py-3">
                    <CategoryBadge category={n.category} />
                  </td>
                  {/* Author */}
                  <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">
                    <HighlightText text={n.author} terms={activeTerms} />
                  </td>
                  {/* Published at */}
                  <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">
                    {n.publishedAt ?? <span className="italic">ยังไม่เผยแพร่</span>}
                  </td>
                  {/* Status */}
                  <td className="px-4 py-3">
                    <StatusBadge status={n.status} />
                  </td>
                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button title="ดูพรีวิวข่าว" onClick={() => setPreview(n)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted hover:border-primary hover:text-primary transition-colors">
                        <EyeIcon />
                      </button>
                      <button title="แก้ไข" onClick={() => setModal({ mode: "edit", item: n })}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted hover:border-amber-400 hover:text-amber-500 transition-colors">
                        <EditIcon />
                      </button>
                      <button title="ลบ" onClick={() => setDelTarget(n)}
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

        {/* ── Pagination footer ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3 bg-surface-muted/40">
          <div className="flex items-center gap-2 text-xs text-muted">
            <span>แสดง</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="rounded border border-border bg-surface px-1.5 py-1 text-xs outline-none"
            >
              {PAGE_SIZE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            <span>รายการ</span>
            {filtered.length > 0 && (
              <span>
                ({(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filtered.length)} จาก {filtered.length})
              </span>
            )}
          </div>
          <Pagination page={safePage} totalPages={totalPages} onPage={setPage} />
        </div>
      </div>

      {/* ── Editor (full-screen) ── */}
      {modal && (
        <NewsEditor
          item={modal.item ?? null}
          onSave={(form) => { handleSave(form); setModal(null); }}
          onClose={() => setModal(null)}
        />
      )}
      {preview && (
        <NewsPreview
          item={preview}
          onClose={() => setPreview(null)}
          onEdit={(n) => { setPreview(null); setModal({ mode: "edit", item: n }); }}
        />
      )}
      {detail && (
        <NewsDetail
          item={detail}
          onClose={() => setDetail(null)}
          onEdit={(n) => { setDetail(null); setModal({ mode: "edit", item: n }); }}
          onDelete={(id) => { deleteNews(id); setDetail(null); }}
        />
      )}
      {delTarget && (
        <DeleteModal
          title={delTarget.title}
          onConfirm={() => { deleteNews(delTarget.id); setDelTarget(null); }}
          onCancel={() => setDelTarget(null)}
        />
      )}
    </div>
  );
}
