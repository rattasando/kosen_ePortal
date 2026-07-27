"use client";

import { useState, useEffect, useMemo, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { DEFAULT_JOBS } from "@/lib/data/jobData";
import { DEFAULT_COMPANIES } from "@/lib/data/companyData";

// ── helpers ────────────────────────────────────────────────────────────────
const SEED_VERSION = `v${DEFAULT_JOBS.length}r8`;

function loadFromStorage(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const version = localStorage.getItem("kosen_jobs_seed_version");
    if (version !== SEED_VERSION) {
      localStorage.setItem("kosen_jobs", JSON.stringify(DEFAULT_JOBS));
      localStorage.setItem("kosen_jobs_seed_version", SEED_VERSION);
      return fallback;
    }
    const r = localStorage.getItem(key);
    return r ? JSON.parse(r) : fallback;
  }
  catch { return fallback; }
}

function formatDate(iso) {
  if (!iso) return "–";
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}

function daysLeft(iso) {
  if (!iso) return null;
  return Math.ceil((new Date(iso) - new Date()) / 86400000);
}

const STATUS_CFG = {
  เปิดรับ:  { label: "เปิดรับ",    color: "bg-green-50 text-green-700 border-green-200" },
  ปิดรับ:   { label: "ปิดรับแล้ว", color: "bg-gray-50 text-gray-500 border-gray-200" },
  เต็มแล้ว: { label: "ที่นั่งเต็ม", color: "bg-orange-50 text-orange-600 border-orange-200" },
  เต็มแล้ว: { label: "เต็มแล้ว",   color: "bg-amber-100 text-amber-700 border-amber-200" },
};

const FIELD_COLORS = [
  "bg-blue-50 text-blue-700 border-blue-100",
  "bg-violet-50 text-violet-700 border-violet-100",
  "bg-emerald-50 text-emerald-700 border-emerald-100",
  "bg-amber-50 text-amber-700 border-amber-100",
  "bg-rose-50 text-rose-700 border-rose-100",
  "bg-cyan-50 text-cyan-700 border-cyan-100",
  "bg-orange-50 text-orange-700 border-orange-100",
  "bg-teal-50 text-teal-700 border-teal-100",
];
const fieldColorMap = {};
let colorIdx = 0;
function getFieldColor(field) {
  if (!fieldColorMap[field]) fieldColorMap[field] = FIELD_COLORS[colorIdx++ % FIELD_COLORS.length];
  return fieldColorMap[field];
}

function CompanyAvatar({ name, logo, size = "md" }) {
  const initials = name.replace(/บริษัท|จำกัด|\(มหาชน\)/g, "").trim().slice(0, 2);
  const sz = size === "lg" ? "h-14 w-14" : "h-12 w-12";
  if (logo) {
    return (
      <div className={`shrink-0 ${sz} rounded-xl border border-border bg-white flex items-center justify-center overflow-hidden p-1.5`}>
        <img src={logo} alt={name} className="w-full h-full object-contain" />
      </div>
    );
  }
  return (
    <div className={`shrink-0 ${sz} rounded-xl bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center font-bold text-primary border border-primary/20 text-sm`}>
      {initials}
    </div>
  );
}

// ── Dropdown component ────────────────────────────────────────────────────
function Dropdown({ label, value, options, onChange, icon, activeColor }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const active = value !== options[0];

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
          active
            ? (activeColor ?? "border-primary bg-primary text-white")
            : "border-border bg-surface text-foreground hover:border-primary/40"
        }`}
      >
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
              <button
                key={opt}
                onClick={() => { onChange(opt); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between gap-3 ${
                  value === opt
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-foreground hover:bg-surface-muted"
                }`}
              >
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

// ── Tag search input ──────────────────────────────────────────────────────
function TagSearchInput({ tags, onAdd, onRemove, inputValue, onInputChange, suggestions }) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusedIdx, setFocusedIdx] = useState(-1);
  const inputRef = useRef(null);
  const wrapRef = useRef(null);

  const filtered = useMemo(() =>
    inputValue.trim()
      ? suggestions.filter((s) => s.toLowerCase().includes(inputValue.toLowerCase()) && !tags.includes(s))
      : [],
    [inputValue, suggestions, tags]
  );

  useEffect(() => {
    setShowSuggestions(filtered.length > 0);
    setFocusedIdx(-1);
  }, [filtered]);

  useEffect(() => {
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setShowSuggestions(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const addTag = useCallback((tag) => {
    const t = tag.trim();
    if (t && !tags.includes(t)) onAdd(t);
    onInputChange("");
    setShowSuggestions(false);
    inputRef.current?.focus();
  }, [tags, onAdd, onInputChange]);

  const handleKey = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (focusedIdx >= 0 && filtered[focusedIdx]) addTag(filtered[focusedIdx]);
      else if (inputValue.trim()) addTag(inputValue);
    } else if (e.key === "Backspace" && !inputValue && tags.length) {
      onRemove(tags[tags.length - 1]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  return (
    <div ref={wrapRef} className="relative">
      <div
        onClick={() => inputRef.current?.focus()}
        className="flex flex-wrap items-center gap-2 min-h-[46px] w-full rounded-xl border border-border bg-surface px-3 py-2 focus-within:border-primary focus-within:ring-2 focus-within:ring-accent-soft transition cursor-text"
      >
        <svg className="w-4 h-4 text-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>

        {tags.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 rounded-lg bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 text-xs font-semibold">
            {tag}
            <button onClick={(e) => { e.stopPropagation(); onRemove(tag); }} className="ml-0.5 hover:text-primary/60 transition-colors leading-none">×</button>
          </span>
        ))}

        <input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKey}
          onFocus={() => filtered.length > 0 && setShowSuggestions(true)}
          placeholder={tags.length === 0 ? "ค้นหาด้วยชื่อบริษัท, ตำแหน่งงาน, แท็ก เช่น Toyota, Python, กรุงเทพฯ…" : "เพิ่มแท็ก…"}
          className="flex-1 min-w-[140px] bg-transparent text-sm text-foreground placeholder:text-muted outline-none"
        />

        {(tags.length > 0 || inputValue) && (
          <button
            onClick={() => { onRemove(null); onInputChange(""); }}
            className="ml-auto text-xs text-muted hover:text-foreground transition-colors shrink-0"
          >
            ล้าง
          </button>
        )}
      </div>

      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1.5 rounded-2xl border border-border bg-surface shadow-xl overflow-hidden">
          <p className="px-4 pt-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">คำแนะนำ</p>
          <div className="py-1 max-h-52 overflow-y-auto">
            {filtered.map((s, i) => (
              <button
                key={s}
                onMouseDown={(e) => { e.preventDefault(); addTag(s); }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                  i === focusedIdx ? "bg-primary/10 text-primary" : "text-foreground hover:bg-surface-muted"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── JobCard (full-width row) ──────────────────────────────────────────────
function JobCard({ job }) {
  const statusCfg = STATUS_CFG[job.status] ?? { label: job.status, color: "bg-gray-100 text-gray-500 border-gray-200" };
  const isOpen = job.status === "เปิดรับ";
  const days = daysLeft(job.deadline);
  const fieldColor = getFieldColor(job.field);

  return (
    <Link
      href={`/marketplace/${job.id}`}
      className={`group flex gap-5 rounded-2xl border-2 bg-surface p-5 md:p-6 transition-all hover:shadow-lg hover:border-primary/50 hover:-translate-y-0.5 ${
        isOpen ? "border-border" : "border-border opacity-65"
      }`}
    >
      <CompanyAvatar name={job.companyName} size="lg" />
      <div className="min-w-0 flex-1">
        {/* Top row: badges */}
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusCfg.color}`}>
            {statusCfg.label}
          </span>
          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${fieldColor}`}>
            {job.field}
          </span>
          {job.type === "ฝึกงาน"
            ? <span className="rounded-full bg-blue-50 text-blue-600 border border-blue-100 px-2.5 py-0.5 text-xs font-medium">🎓 ฝึกงาน</span>
            : <span className="rounded-full bg-purple-50 text-purple-600 border border-purple-100 px-2.5 py-0.5 text-xs font-medium">💼 งานประจำ</span>
          }
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors leading-snug">{job.title}</h3>
        {job.titleEn && <p className="text-xs text-muted mt-0.5">{job.titleEn}</p>}
        <p className="text-sm text-muted mt-1">{job.companyName}</p>

        {/* Meta row */}
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted">
          <span className="flex items-center gap-1.5">📍 {job.location}</span>
          <span className="flex items-center gap-1.5">💰 {job.salary}</span>
          {job.duration && <span className="flex items-center gap-1.5">⏱ {job.duration}</span>}
          <span className="flex items-center gap-1.5">👥 {job.slots} อัตรา</span>
        </div>

        {/* Tags */}
        {job.tags && job.tags.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {job.tags.map((tag) => (
              <span key={tag} className="rounded-md bg-surface border border-border px-2 py-0.5 text-xs text-muted font-mono">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Right: deadline + arrow */}
      <div className="hidden sm:flex flex-col items-end justify-between shrink-0 min-w-[110px]">
        <span className="text-lg text-muted group-hover:text-primary transition-colors">›</span>
        <div className="text-right">
          {isOpen && days !== null && (
            <span className={`block text-xs font-semibold mb-0.5 ${days <= 7 ? "text-red-500" : "text-muted"}`}>
              {days <= 0 ? "หมดเขตแล้ว" : days === 0 ? "วันนี้!" : `อีก ${days} วัน`}
            </span>
          )}
          <span className="text-xs text-muted">ถึง {formatDate(job.deadline)}</span>
        </div>
      </div>
    </Link>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
function MarketplaceContent() {
  const searchParams = useSearchParams();

  const [jobs, setJobs]           = useState([]);
  const [companies, setCompanies] = useState([]);
  const [ready, setReady]         = useState(false);
  const [activeType, setActiveType]     = useState("ทั้งหมด");
  const [activeField, setActiveField]   = useState("ทั้งหมด");
  const [activeStatus, setActiveStatus] = useState("ทั้งหมด");
  const [tags, setTags]               = useState([]);
  const [tagInput, setTagInput]       = useState("");

  useEffect(() => {
    setJobs(loadFromStorage("kosen_jobs", DEFAULT_JOBS));
    setCompanies(loadFromStorage("kosen_companies", DEFAULT_COMPANIES));
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const type = searchParams.get("type");
    if (type === "ฝึกงาน" || type === "งานประจำ") setActiveType(type);
  }, [ready, searchParams]);

  const typeOptions   = useMemo(() => ["ทั้งหมด", "ฝึกงาน", "งานประจำ"], []);
  const statusOptions = useMemo(() => ["ทั้งหมด", "เปิดรับ", "ปิดรับ"], []);
  const fieldOptions  = useMemo(() => {
    const all = [...new Set(jobs.map((j) => j.field).filter(Boolean))].sort();
    return ["ทั้งหมด", ...all];
  }, [jobs]);

  // suggestions pool: company names + locations + fields + keywords from descriptions
  const suggestions = useMemo(() => {
    const pool = new Set();
    jobs.forEach((j) => {
      pool.add(j.companyName);
      pool.add(j.location);
      pool.add(j.field);
      if (j.titleEn) pool.add(j.titleEn);
      if (Array.isArray(j.tags)) j.tags.forEach((tag) => pool.add(tag));
    });
    return [...pool].filter(Boolean).sort();
  }, [jobs]);

  const addTag    = useCallback((t) => setTags((prev) => prev.includes(t) ? prev : [...prev, t]), []);
  const removeTag = useCallback((t) => setTags((prev) => t === null ? [] : prev.filter((x) => x !== t)), []);

  const filtered = useMemo(() => jobs.filter((j) => {
    if (activeType !== "ทั้งหมด" && j.type !== activeType) return false;
    if (activeField !== "ทั้งหมด" && j.field !== activeField) return false;
    if (activeStatus !== "ทั้งหมด" && j.status !== activeStatus) return false;
    if (tags.length > 0) {
      return tags.every((tag) => {
        const q = tag.toLowerCase();
        return j.title.toLowerCase().includes(q)
          || j.companyName.toLowerCase().includes(q)
          || j.location.toLowerCase().includes(q)
          || j.field.toLowerCase().includes(q)
          || (j.titleEn || "").toLowerCase().includes(q)
          || (j.description || "").toLowerCase().includes(q)
          || (Array.isArray(j.tags) && j.tags.some((tag) => tag.toLowerCase().includes(q)));
      });
    }
    if (tagInput.trim()) {
      const q = tagInput.toLowerCase();
      return j.title.toLowerCase().includes(q)
        || j.companyName.toLowerCase().includes(q)
        || j.location.toLowerCase().includes(q)
        || (j.titleEn || "").toLowerCase().includes(q)
        || (Array.isArray(j.tags) && j.tags.some((tag) => tag.toLowerCase().includes(q)));
    }
    return true;
  }), [jobs, activeType, activeField, tags, tagInput]);

  const hasFilters = activeType !== "ทั้งหมด" || activeField !== "ทั้งหมด" || activeStatus !== "ทั้งหมด" || tags.length > 0 || tagInput.trim();

  const openCount   = jobs.filter((j) => j.status === "เปิดรับ").length;
  const internCount = jobs.filter((j) => j.type === "ฝึกงาน").length;

  if (!ready) return <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12 py-16 text-center text-muted text-sm">กำลังโหลดข้อมูล...</div>;

  return (
    <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12 py-10 md:py-14">

      {/* Hero */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">ตลาดงาน KOSEN</h1>
        <p className="mt-2 text-muted text-sm md:text-base">ตำแหน่งงานและโอกาสฝึกงานจากบริษัทพาร์ทเนอร์</p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-emerald-700 font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            {openCount} ตำแหน่งเปิดรับ
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-100 px-3 py-1 text-blue-700 font-medium">
            🎓 {internCount} ตำแหน่งฝึกงาน
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted border border-border px-3 py-1 text-muted font-medium">
            🏢 {companies.filter((c) => c.status === "ร่วมมือ").length} บริษัทพาร์ทเนอร์
          </span>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="mb-6 space-y-3">
        {/* Tag search */}
        <TagSearchInput
          tags={tags}
          onAdd={addTag}
          onRemove={removeTag}
          inputValue={tagInput}
          onInputChange={setTagInput}
          suggestions={suggestions}
        />

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          <Dropdown
            label="ประเภทงาน"
            value={activeType}
            options={typeOptions}
            onChange={setActiveType}
            icon="📋"
          />
          <Dropdown
            label="สาขาของงาน"
            value={activeField}
            options={fieldOptions}
            onChange={setActiveField}
            icon="🎓"
          />
          <Dropdown
            label="สถานะ"
            value={activeStatus}
            options={statusOptions}
            onChange={setActiveStatus}
            icon="📌"
            activeColor={
              activeStatus === "เปิดรับ" ? "border-green-300 bg-green-50 text-green-700" :
              activeStatus === "ปิดรับ"  ? "border-gray-300 bg-gray-100 text-gray-600" :
              activeStatus === "เต็มแล้ว" ? "border-orange-300 bg-orange-50 text-orange-600" :
              undefined
            }
          />

          {hasFilters && (
            <button
              onClick={() => { setActiveType("ทั้งหมด"); setActiveField("ทั้งหมด"); setActiveStatus("ทั้งหมด"); setTags([]); setTagInput(""); }}
              className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2.5 text-sm text-muted hover:text-foreground hover:border-foreground/30 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              ล้างทั้งหมด
            </button>
          )}
        </div>
      </div>

      {/* Count */}
      <p className="mb-4 text-xs font-semibold text-muted uppercase tracking-wide">
        พบ {filtered.length} ตำแหน่งงาน
        {hasFilters && <span className="ml-1 text-primary">(กรองจาก {jobs.length})</span>}
      </p>

      {/* Job list — single column */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface-muted py-20 text-center">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-foreground font-semibold mb-1">ไม่พบตำแหน่งที่ตรงกับเงื่อนไข</p>
          <p className="text-sm text-muted mb-4">ลองปรับเงื่อนไขการค้นหาหรือล้างตัวกรอง</p>
          <button
            onClick={() => { setActiveType("ทั้งหมด"); setActiveField("ทั้งหมด"); setTags([]); setTagInput(""); }}
            className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
          >
            ล้างตัวกรอง
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((job) => <JobCard key={job.id} job={job} />)}
        </div>
      )}

      {/* Partner companies teaser */}
      <div className="mt-16 rounded-2xl border border-border bg-surface-muted p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-foreground">🏢 บริษัทพาร์ทเนอร์</h2>
          <p className="text-sm text-muted mt-1">
            {companies.filter((c) => c.status === "ร่วมมือ").length} บริษัทที่ร่วมมือกับ KOSEN — พร้อมข้อมูลติดต่อและตำแหน่งงาน
          </p>
        </div>
        <Link href="/marketplace/companies"
          className="shrink-0 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors">
          ดูรายชื่อบริษัททั้งหมด →
        </Link>
      </div>

    </div>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <MarketplaceContent />
    </Suspense>
  );
}
