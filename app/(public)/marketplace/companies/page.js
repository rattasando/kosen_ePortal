"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import { DEFAULT_COMPANIES } from "@/lib/data/companyData";
import { DEFAULT_JOBS } from "@/lib/data/jobData";

function loadFromStorage(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; }
  catch { return fallback; }
}

const STATUS_CFG = {
  ร่วมมือ:     { label: "ร่วมมือ",     color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  รอดำเนินการ: { label: "รอดำเนินการ", color: "bg-amber-100 text-amber-700 border-amber-200" },
  ระงับ:       { label: "ระงับ",       color: "bg-red-100 text-red-600 border-red-200" },
};

const IND_COLORS = [
  "bg-blue-50 text-blue-700 border-blue-100",
  "bg-violet-50 text-violet-700 border-violet-100",
  "bg-emerald-50 text-emerald-700 border-emerald-100",
  "bg-amber-50 text-amber-700 border-amber-100",
  "bg-rose-50 text-rose-700 border-rose-100",
  "bg-cyan-50 text-cyan-700 border-cyan-100",
  "bg-orange-50 text-orange-700 border-orange-100",
  "bg-teal-50 text-teal-700 border-teal-100",
];
const indColorMap = {};
let colorIdx = 0;
function getIndColor(ind) {
  if (!indColorMap[ind]) indColorMap[ind] = IND_COLORS[colorIdx++ % IND_COLORS.length];
  return indColorMap[ind];
}

function CompanyAvatar({ name, size = "md" }) {
  const initials = name.replace(/บริษัท|จำกัด|\(มหาชน\)|ศูนย์|การ/g, "").trim().slice(0, 2);
  const sz = size === "lg" ? "h-14 w-14 text-lg" : "h-12 w-12 text-sm";
  return (
    <div className={`shrink-0 ${sz} rounded-xl bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center font-bold text-primary border border-primary/20`}>
      {initials}
    </div>
  );
}

// ── Dropdown ────────────────────────────────────────────────────────────────
function Dropdown({ label, value, options, onChange, icon }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const active = value !== options[0];
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
          active ? "border-primary bg-primary text-white" : "border-border bg-surface text-foreground hover:border-primary/40"
        }`}>
        {icon && <span>{icon}</span>}
        <span>{active ? value : label}</span>
        <svg className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute top-full left-0 z-50 mt-1.5 min-w-[180px] rounded-2xl border border-border bg-surface shadow-xl overflow-hidden">
          <div className="py-1.5 max-h-64 overflow-y-auto">
            {options.map((opt) => (
              <button key={opt} onClick={() => { onChange(opt); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between gap-3 transition-colors ${
                  value === opt ? "bg-primary/10 text-primary font-semibold" : "text-foreground hover:bg-surface-muted"
                }`}>
                {opt}
                {value === opt && (
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tag search ───────────────────────────────────────────────────────────────
function TagSearchInput({ tags, onAdd, onRemove, inputValue, onInputChange, suggestions }) {
  const [showSug, setShowSug] = useState(false);
  const [focusedIdx, setFocusedIdx] = useState(-1);
  const inputRef = useRef(null);
  const wrapRef = useRef(null);

  const filtered = useMemo(() =>
    inputValue.trim()
      ? suggestions.filter((s) => s.toLowerCase().includes(inputValue.toLowerCase()) && !tags.includes(s))
      : [],
    [inputValue, suggestions, tags]
  );
  useEffect(() => { setShowSug(filtered.length > 0); setFocusedIdx(-1); }, [filtered]);
  useEffect(() => {
    const h = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setShowSug(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const addTag = useCallback((t) => {
    const v = t.trim();
    if (v && !tags.includes(v)) onAdd(v);
    onInputChange(""); setShowSug(false); inputRef.current?.focus();
  }, [tags, onAdd, onInputChange]);

  const handleKey = (e) => {
    if (e.key === "Enter") { e.preventDefault(); focusedIdx >= 0 ? addTag(filtered[focusedIdx]) : inputValue.trim() && addTag(inputValue); }
    else if (e.key === "Backspace" && !inputValue && tags.length) onRemove(tags[tags.length - 1]);
    else if (e.key === "ArrowDown") { e.preventDefault(); setFocusedIdx((i) => Math.min(i + 1, filtered.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setFocusedIdx((i) => Math.max(i - 1, -1)); }
    else if (e.key === "Escape") setShowSug(false);
  };

  return (
    <div ref={wrapRef} className="relative">
      <div onClick={() => inputRef.current?.focus()}
        className="flex flex-wrap items-center gap-2 min-h-[46px] w-full rounded-xl border border-border bg-surface px-3 py-2 focus-within:border-primary focus-within:ring-2 focus-within:ring-accent-soft transition cursor-text">
        <svg className="w-4 h-4 text-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        {tags.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 rounded-lg bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 text-xs font-semibold">
            {tag}
            <button onClick={(e) => { e.stopPropagation(); onRemove(tag); }} className="hover:text-primary/60 transition-colors leading-none">×</button>
          </span>
        ))}
        <input ref={inputRef} value={inputValue} onChange={(e) => onInputChange(e.target.value)} onKeyDown={handleKey}
          onFocus={() => filtered.length > 0 && setShowSug(true)}
          placeholder={tags.length === 0 ? "ค้นหาบริษัท อุตสาหกรรม หรือจังหวัด…" : "เพิ่มแท็ก…"}
          className="flex-1 min-w-[140px] bg-transparent text-sm text-foreground placeholder:text-muted outline-none" />
        {(tags.length > 0 || inputValue) && (
          <button onClick={() => { onRemove(null); onInputChange(""); }} className="ml-auto text-xs text-muted hover:text-foreground transition-colors shrink-0">ล้าง</button>
        )}
      </div>
      {showSug && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1.5 rounded-2xl border border-border bg-surface shadow-xl overflow-hidden">
          <p className="px-4 pt-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">คำแนะนำ</p>
          <div className="py-1 max-h-52 overflow-y-auto">
            {filtered.map((s, i) => (
              <button key={s} onMouseDown={(e) => { e.preventDefault(); addTag(s); }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${i === focusedIdx ? "bg-primary/10 text-primary" : "text-foreground hover:bg-surface-muted"}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── CompanyCard ──────────────────────────────────────────────────────────────
function CompanyCard({ company, openJobs, totalJobs }) {
  const statusCfg = STATUS_CFG[company.status] ?? { label: company.status, color: "bg-gray-100 text-gray-500 border-gray-200" };
  const indColor  = getIndColor(company.industry);
  return (
    <Link href={`/marketplace/companies/${company.id}`}
      className="group flex gap-5 rounded-2xl border-2 border-border bg-surface p-5 md:p-6 transition-all hover:shadow-lg hover:border-primary/50 hover:-translate-y-0.5">
      <CompanyAvatar name={company.name} size="lg" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusCfg.color}`}>{statusCfg.label}</span>
          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${indColor}`}>{company.industry}</span>
          {company.mouStatus === "มี MOU" && (
            <span className="rounded-full bg-blue-50 text-blue-600 border border-blue-100 px-2.5 py-0.5 text-xs font-semibold">มี MOU</span>
          )}
        </div>
        <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors leading-snug">{company.name}</h3>
        {company.nameEn && <p className="text-xs text-muted mt-0.5">{company.nameEn}</p>}
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
          <span>📍 {company.province}{company.country !== "ไทย" ? `, ${company.country}` : ""}</span>
          <span>🏭 {company.type}</span>
        </div>
        {company.description && (
          <p className="mt-2 text-xs text-muted leading-relaxed line-clamp-2">{company.description}</p>
        )}
      </div>
      <div className="hidden sm:flex flex-col items-end justify-between shrink-0 min-w-[100px]">
        <span className="text-lg text-muted group-hover:text-primary transition-colors">›</span>
        <div className="text-right space-y-1">
          {openJobs > 0
            ? <p className="text-sm font-bold text-emerald-600">{openJobs} เปิดรับ</p>
            : <p className="text-xs text-muted">ไม่มีเปิดรับ</p>
          }
          {totalJobs > 0 && <p className="text-xs text-muted">{totalJobs} ตำแหน่งทั้งหมด</p>}
        </div>
      </div>
    </Link>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function CompanyListPage() {
  const [companies, setCompanies] = useState([]);
  const [jobs, setJobs]           = useState([]);
  const [ready, setReady]         = useState(false);
  const [activeInd, setActiveInd]   = useState("ทั้งหมด");
  const [activeProv, setActiveProv] = useState("ทั้งหมด");
  const [tags, setTags]             = useState([]);
  const [tagInput, setTagInput]     = useState("");

  useEffect(() => {
    setCompanies(loadFromStorage("kosen_companies", DEFAULT_COMPANIES));
    setJobs(loadFromStorage("kosen_jobs", DEFAULT_JOBS));
    setReady(true);
  }, []);

  const industries = useMemo(() => ["ทั้งหมด", ...[...new Set(companies.map((c) => c.industry).filter(Boolean))].sort()], [companies]);
  const provinces  = useMemo(() => ["ทั้งหมด", ...[...new Set(companies.map((c) => c.province).filter(Boolean))].sort()], [companies]);
  const suggestions = useMemo(() => {
    const pool = new Set();
    companies.forEach((c) => { pool.add(c.name); pool.add(c.province); pool.add(c.industry); pool.add(c.nameEn); });
    return [...pool].filter(Boolean).sort();
  }, [companies]);

  const addTag    = useCallback((t) => setTags((p) => p.includes(t) ? p : [...p, t]), []);
  const removeTag = useCallback((t) => setTags((p) => t === null ? [] : p.filter((x) => x !== t)), []);

  const filtered = useMemo(() => companies.filter((c) => {
    if (activeInd !== "ทั้งหมด" && c.industry !== activeInd) return false;
    if (activeProv !== "ทั้งหมด" && c.province !== activeProv) return false;
    if (tags.length > 0) {
      return tags.every((tag) => {
        const q = tag.toLowerCase();
        return c.name.toLowerCase().includes(q)
          || (c.nameEn || "").toLowerCase().includes(q)
          || c.industry.toLowerCase().includes(q)
          || c.province.toLowerCase().includes(q)
          || (c.description || "").toLowerCase().includes(q);
      });
    }
    if (tagInput.trim()) {
      const q = tagInput.toLowerCase();
      return c.name.toLowerCase().includes(q) || (c.nameEn || "").toLowerCase().includes(q)
        || c.industry.toLowerCase().includes(q) || c.province.toLowerCase().includes(q);
    }
    return true;
  }), [companies, activeInd, activeProv, tags, tagInput]);

  const hasFilters = activeInd !== "ทั้งหมด" || activeProv !== "ทั้งหมด" || tags.length > 0 || tagInput.trim();
  const activePartners = companies.filter((c) => c.status === "ร่วมมือ").length;
  const mouCount = companies.filter((c) => c.mouStatus === "มี MOU").length;
  const totalOpen = jobs.filter((j) => j.status === "เปิดรับ").length;

  if (!ready) return <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12 py-16 text-center text-muted text-sm">กำลังโหลด...</div>;

  return (
    <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12 py-10 md:py-14">

      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted">
        <Link href="/marketplace" className="hover:text-primary transition-colors">ตลาดงาน</Link>
        <span>/</span>
        <span className="text-foreground font-medium">รายชื่อบริษัท</span>
      </nav>

      {/* Hero */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">บริษัทพาร์ทเนอร์</h1>
        <p className="mt-2 text-muted text-sm md:text-base">องค์กรที่ร่วมมือกับ KOSEN เพื่อรับนักศึกษาฝึกงานและบรรจุงาน</p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-emerald-700 font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {activePartners} พาร์ทเนอร์
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-100 px-3 py-1 text-blue-700 font-medium">
            📋 {mouCount} มี MOU
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted border border-border px-3 py-1 text-muted font-medium">
            💼 {totalOpen} ตำแหน่งเปิดรับ
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-3">
        <TagSearchInput tags={tags} onAdd={addTag} onRemove={removeTag}
          inputValue={tagInput} onInputChange={setTagInput} suggestions={suggestions} />
        <div className="flex flex-wrap items-center gap-2">
          <Dropdown label="อุตสาหกรรม" value={activeInd} options={industries} onChange={setActiveInd} icon="🏭" />
          <Dropdown label="จังหวัด" value={activeProv} options={provinces} onChange={setActiveProv} icon="📍" />
          {hasFilters && (
            <button onClick={() => { setActiveInd("ทั้งหมด"); setActiveProv("ทั้งหมด"); setTags([]); setTagInput(""); }}
              className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2.5 text-sm text-muted hover:text-foreground hover:border-foreground/30 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              ล้างทั้งหมด
            </button>
          )}
        </div>
      </div>

      <p className="mb-4 text-xs font-semibold text-muted uppercase tracking-wide">
        พบ {filtered.length} บริษัท
        {hasFilters && <span className="ml-1 text-primary">(กรองจาก {companies.length})</span>}
      </p>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface-muted py-20 text-center">
          <p className="text-4xl mb-3">🏢</p>
          <p className="text-foreground font-semibold mb-1">ไม่พบบริษัทที่ตรงกับเงื่อนไข</p>
          <button onClick={() => { setActiveInd("ทั้งหมด"); setActiveProv("ทั้งหมด"); setTags([]); setTagInput(""); }}
            className="mt-3 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors">
            ล้างตัวกรอง
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((company) => {
            const compJobs  = jobs.filter((j) => j.companyName === company.name);
            const openJobs  = compJobs.filter((j) => j.status === "เปิดรับ").length;
            return <CompanyCard key={company.id} company={company} openJobs={openJobs} totalJobs={compJobs.length} />;
          })}
        </div>
      )}
    </div>
  );
}
