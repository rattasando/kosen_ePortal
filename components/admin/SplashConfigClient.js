"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSplash } from "./contexts/SplashContext";

const inputCls    = "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-accent-soft placeholder:text-muted";
const labelCls    = "text-xs font-medium text-foreground";
const textareaCls = `${inputCls} resize-none`;

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE_MB   = 5;

const FREQ_OPTIONS = [
  { value: "once_per_session", label: "ครั้งเดียวต่อ Session",     desc: "แสดงเมื่อเปิดเบราว์เซอร์ใหม่ หรือปิด-เปิด Tab" },
  { value: "once_per_day",     label: "ครั้งเดียวต่อวัน",          desc: "แสดงวันละ 1 ครั้ง แม้ reload หน้า" },
  { value: "always",           label: "ทุกครั้งที่โหลดหน้า Home",  desc: "แสดงเสมอทุกครั้งที่เข้าหน้า Home" },
];

const WIDTH_OPTIONS = [
  { value: "sm", label: "เล็ก",  maxW: "max-w-sm" },
  { value: "md", label: "กลาง", maxW: "max-w-md" },
  { value: "lg", label: "ใหญ่", maxW: "max-w-lg" },
];

const RADIUS_OPTIONS = [
  { value: "none", label: "เหลี่ยม",   cls: "rounded-none" },
  { value: "lg",   label: "มนเล็กน้อย", cls: "rounded-lg"   },
  { value: "2xl",  label: "มน",        cls: "rounded-2xl"  },
  { value: "3xl",  label: "มนมาก",     cls: "rounded-3xl"  },
];

const RADIUS_MAP_PREVIEW = {
  none: "rounded-none",
  lg:   "rounded-lg",
  "2xl": "rounded-2xl",
  "3xl": "rounded-3xl",
};

const PRESET_IMAGES = [
  "/banners/banner1.jpg",
  "/banners/banner2.jpg",
  "/banners/banner3.jpg",
  "/banners/banner4.jpg",
];

// ── Icons ─────────────────────────────────────────────────────
const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

// ── Tab button helper ─────────────────────────────────────────
function TabBtn({ active, onClick, children }) {
  return (
    <button type="button" onClick={onClick}
      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${active ? "bg-primary text-white" : "text-muted hover:text-foreground hover:bg-surface-muted"}`}>
      {children}
    </button>
  );
}

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
);

// ── Image thumbnail (shared) ──────────────────────────────────
// aspectCls: "aspect-square" (default, คลัง) หรือ "aspect-video" (preset)
function ImgThumb({ src, selected, onClick, onDelete, deleting, aspectCls = "aspect-square" }) {
  return (
    <div className={`group relative overflow-hidden rounded-lg border-2 transition-all ${selected ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary"}`}>
      <button type="button" onClick={onClick} className={`block w-full ${aspectCls} overflow-hidden`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="block h-full w-full object-cover" />
      </button>
      {selected && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-primary/30">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white shadow">
            <CheckIcon />
          </span>
        </div>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          disabled={deleting}
          title="ลบรูปนี้"
          className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-600 disabled:opacity-50"
        >
          {deleting
            ? <svg className="h-2.5 w-2.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
            : <TrashIcon />}
        </button>
      )}
    </div>
  );
}

// ── Image Uploader ────────────────────────────────────────────
function SplashImageUploader({ value, onChange }) {
  const initTab = value?.startsWith("/splash/") ? "library" : "preset";
  const [tab, setTab]               = useState(initTab);
  const [library, setLibrary]       = useState(null);
  const [dragging, setDragging]     = useState(false);
  const [uploading, setUploading]   = useState(false);
  const [progress, setProgress]     = useState(0);
  const [uploadError, setUploadError] = useState("");
  const [deletingFile, setDeletingFile] = useState(null); // filename กำลังลบ
  const [confirmDelete, setConfirmDelete] = useState(null); // filename ที่รอยืนยัน
  const fileRef = useRef(null);

  // โหลด library เมื่อสลับไปแท็บ library หรือเมื่อ mount ครั้งแรก (ถ้ารูปปัจจุบันเป็น /splash/)
  const loadLibrary = useCallback(async () => {
    setLibrary(null);
    try {
      const res  = await fetch("/api/upload/splash/list");
      const json = await res.json();
      setLibrary(json.files ?? []);
    } catch {
      setLibrary([]);
    }
  }, []);

  useEffect(() => {
    if (tab === "library") loadLibrary();
  }, [tab, loadLibrary]);

  const upload = useCallback(async (file) => {
    if (!ALLOWED_TYPES.includes(file.type)) { setUploadError("รองรับเฉพาะ JPG, PNG, WebP, GIF"); return; }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) { setUploadError(`ขนาดไฟล์ต้องไม่เกิน ${MAX_SIZE_MB} MB`); return; }
    setUploadError("");
    setUploading(true);
    setProgress(10);
    try {
      const fd   = new FormData();
      fd.append("file", file);
      const tick = setInterval(() => setProgress((p) => Math.min(p + 15, 80)), 200);
      const res  = await fetch("/api/upload/splash", { method: "POST", body: fd });
      clearInterval(tick);
      setProgress(95);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      onChange(json.path);
      setProgress(100);
      // refresh library แล้วสลับไปแท็บ library
      await loadLibrary();
      setTab("library");
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 800);
    }
  }, [onChange, loadLibrary]);

  const handleFiles = useCallback((files) => { if (files?.[0]) upload(files[0]); }, [upload]);

  const handleDelete = useCallback(async (file) => {
    setDeletingFile(file.name);
    setConfirmDelete(null);
    try {
      const res = await fetch(`/api/upload/splash/${encodeURIComponent(file.name)}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "ลบไม่สำเร็จ");
      }
      // ถ้ากำลังใช้รูปที่ลบอยู่ ให้ล้างค่าออก
      if (value === file.path) onChange("");
      setLibrary((prev) => prev?.filter((f) => f.name !== file.name) ?? null);
    } catch (err) {
      alert(err.message);
    } finally {
      setDeletingFile(null);
    }
  }, [value, onChange]);

  return (
    <div className="space-y-3">
      {/* Tab bar */}
      <div className="flex items-center justify-between">
        <label className={labelCls}>รูปภาพ</label>
        <div className="flex gap-1 rounded-lg border border-border p-0.5">
          <TabBtn active={tab === "library"} onClick={() => setTab("library")}>คลังรูป Splash</TabBtn>
          <TabBtn active={tab === "upload"}  onClick={() => setTab("upload")}>อัปโหลดใหม่</TabBtn>
          <TabBtn active={tab === "preset"}  onClick={() => setTab("preset")}>รูปสำเร็จ</TabBtn>
          <TabBtn active={tab === "url"}     onClick={() => setTab("url")}>URL</TabBtn>
        </div>
      </div>

      {/* ── คลังรูป Splash ── */}
      {tab === "library" && (
        <div className="space-y-3">
          {/* Confirm delete dialog */}
          {confirmDelete && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-red-700">ยืนยันการลบ</p>
                <p className="mt-0.5 truncate text-xs text-red-600">{confirmDelete.name}</p>
                {value === confirmDelete.path && (
                  <p className="mt-1 text-xs text-red-500">⚠ รูปนี้กำลังถูกใช้งานอยู่</p>
                )}
              </div>
              <div className="flex shrink-0 gap-2">
                <button type="button" onClick={() => setConfirmDelete(null)}
                  className="rounded-lg border border-border bg-white px-2.5 py-1 text-xs text-muted hover:text-foreground transition-colors">
                  ยกเลิก
                </button>
                <button type="button" onClick={() => handleDelete(confirmDelete)}
                  className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-700 transition-colors">
                  ลบ
                </button>
              </div>
            </div>
          )}

          {library === null ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              กำลังโหลดคลังรูป...
            </div>
          ) : library.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-10 text-center">
              <p className="text-sm font-medium text-foreground">ยังไม่มีรูปในคลัง</p>
              <p className="text-xs text-muted">อัปโหลดรูปก่อนเพื่อเลือกใช้ที่นี่</p>
              <button type="button" onClick={() => setTab("upload")}
                className="mt-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted hover:border-primary hover:text-primary transition-colors">
                ไปที่อัปโหลด →
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-5 gap-1.5">
                {library.map((f) => (
                  <ImgThumb
                    key={f.path}
                    src={f.path}
                    selected={value === f.path}
                    onClick={() => onChange(f.path)}
                    onDelete={() => setConfirmDelete(f)}
                    deleting={deletingFile === f.name}
                    aspectCls="aspect-square"
                  />
                ))}
              </div>
              <button type="button" onClick={loadLibrary}
                className="w-full rounded-lg border border-border py-1.5 text-xs text-muted hover:border-primary hover:text-primary transition-colors">
                รีเฟรชคลังรูป
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── อัปโหลดใหม่ ── */}
      {tab === "upload" && (
        <div>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
            onClick={() => !uploading && fileRef.current?.click()}
            className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-10 cursor-pointer transition-all select-none
              ${dragging ? "border-primary bg-accent-soft" : "border-border hover:border-primary hover:bg-surface-muted"}
              ${uploading ? "pointer-events-none opacity-60" : ""}`}>
            <span className={`${dragging ? "text-primary" : "text-muted"}`}><UploadIcon /></span>
            <p className="text-sm font-medium text-foreground">
              {uploading ? "กำลังอัปโหลด..." : "วางไฟล์ที่นี่ หรือคลิกเพื่อเลือก"}
            </p>
            <p className="text-xs text-muted">JPG, PNG, WebP, GIF · สูงสุด {MAX_SIZE_MB} MB</p>
            {uploading && (
              <div className="w-48 h-1.5 overflow-hidden rounded-full bg-surface-muted mt-1">
                <div className="h-full rounded-full bg-primary transition-all duration-200" style={{ width: `${progress}%` }} />
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept={ALLOWED_TYPES.join(",")} className="hidden"
            onChange={(e) => handleFiles(e.target.files)} />
          {uploadError && <p className="mt-1.5 text-xs text-red-500">{uploadError}</p>}
          {value?.startsWith("/splash/") && !uploadError && (
            <p className="mt-1.5 text-xs text-emerald-600">ใช้อยู่: {value}</p>
          )}
        </div>
      )}

      {/* ── รูปสำเร็จ (Banner presets) ── */}
      {tab === "preset" && (
        <div className="grid grid-cols-4 gap-2">
          {PRESET_IMAGES.map((img) => (
            <ImgThumb key={img} src={img} selected={value === img} onClick={() => onChange(img)} aspectCls="aspect-video" />
          ))}
        </div>
      )}

      {/* ── URL ── */}
      {tab === "url" && (
        <div>
          <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
            placeholder="/splash/my-image.jpg หรือ https://..." className={inputCls} />
          <p className="mt-1 text-xs text-muted">วาง path จาก /public หรือ URL ภายนอก</p>
        </div>
      )}

      {/* รูปที่เลือกปัจจุบัน — แสดงแค่ใน Live Preview ด้านล่าง */}
      {value && (
        <p className="truncate font-mono text-[11px] text-muted">
          <span className="text-primary font-semibold">✓ เลือกแล้ว:</span> {value}
        </p>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────
const WIDTH_ORDER  = ["sm", "md", "lg"];
const RADIUS_ORDER = ["none", "lg", "2xl", "3xl"];

export default function SplashConfigClient() {
  const { config, ready, updateConfig } = useSplash();
  const [form, setForm]           = useState(null);
  const [saved, setSaved]         = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startWidth: "md" });

  useEffect(() => {
    if (ready && !form) setForm({ ...config });
  }, [ready, config, form]);

  // ── Width drag — document-level listeners ────────────────────
  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e) => {
      const delta    = e.clientX - dragRef.current.startX;
      const offset   = Math.round(delta / 80);
      const startIdx = WIDTH_ORDER.indexOf(dragRef.current.startWidth);
      const newIdx   = Math.max(0, Math.min(2, startIdx + offset));
      setForm((f) => f ? { ...f, width: WIDTH_ORDER[newIdx] } : f);
    };
    const onUp = () => setIsDragging(false);
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, [isDragging]);

  if (!ready || !form) {
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

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSave = () => {
    updateConfig(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = () => setForm({ ...config });

  const widthMaxW = WIDTH_OPTIONS.find((w) => w.value === form.width)?.maxW ?? "max-w-md";
  const radiusCls = RADIUS_MAP_PREVIEW[form.radius ?? "2xl"] ?? "rounded-2xl";

  // ── Width drag start ─────────────────────────────────────────
  const handleWidthDragStart = (e) => {
    e.preventDefault();
    dragRef.current = { startX: e.clientX, startWidth: form.width };
    setIsDragging(true);
  };

  // ── Radius cycle ─────────────────────────────────────────────
  const cycleRadius = () => {
    const idx = RADIUS_ORDER.indexOf(form.radius ?? "2xl");
    set("radius", RADIUS_ORDER[(idx + 1) % RADIUS_ORDER.length]);
  };
  const currentRadiusLabel = RADIUS_OPTIONS.find((o) => o.value === (form.radius ?? "2xl"))?.label ?? "มน";

  // Toggle helper
  const Toggle = ({ on, onToggle }) => (
    <button type="button" onClick={onToggle}
      className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 transition-colors duration-200 focus:outline-none ${on ? "border-primary bg-primary" : "border-border bg-surface-muted"}`}>
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${on ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );

  return (
    <div className="space-y-5 p-6">

      {/* ── Master toggle — full width ── */}
      <div className={`flex items-center justify-between rounded-2xl border-2 p-4 transition-all ${form.enabled ? "border-primary bg-accent-soft" : "border-border bg-surface"}`}>
        <div>
          <p className="text-sm font-bold text-foreground">เปิดใช้งาน Splash Screen</p>
          <p className="text-xs text-muted mt-0.5">
            {form.enabled ? "Splash จะแสดงเมื่อผู้เยี่ยมชมเข้าหน้า Home" : "ปิดอยู่ — ผู้เยี่ยมชมจะไม่เห็น Splash"}
          </p>
        </div>
        <Toggle on={form.enabled} onToggle={() => set("enabled", !form.enabled)} />
      </div>

      {/* ── 2-column: Settings | Preview ── */}
      <div className={`grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] gap-5 transition-opacity duration-200 ${form.enabled ? "opacity-100" : "opacity-40 pointer-events-none select-none"}`}>

        {/* ══ LEFT: Settings ══ */}
        <div className="space-y-4">

          {/* รูปภาพ */}
          <div className="rounded-2xl border border-border bg-surface p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-muted">รูปภาพ</p>
            <SplashImageUploader value={form.image} onChange={(v) => set("image", v)} />
          </div>

          {/* เนื้อหา */}
          <div className="rounded-2xl border border-border bg-surface p-4 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wide text-muted">เนื้อหา <span className="font-normal normal-case text-muted/60">(ไม่บังคับ)</span></p>
            <div>
              <label className={`mb-1 block ${labelCls}`}>หัวข้อ</label>
              <input type="text" value={form.title} onChange={(e) => set("title", e.target.value)}
                placeholder="เช่น ประกาศสำคัญ, ยินดีต้อนรับ" className={inputCls} />
            </div>
            <div>
              <label className={`mb-1 block ${labelCls}`}>รายละเอียด</label>
              <textarea value={form.body} onChange={(e) => set("body", e.target.value)}
                rows={2} placeholder="ข้อความเพิ่มเติม..." className={textareaCls} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`mb-1 block ${labelCls}`}>ข้อความปุ่ม</label>
                <input type="text" value={form.ctaLabel} onChange={(e) => set("ctaLabel", e.target.value)}
                  placeholder="อ่านเพิ่มเติม" className={inputCls} />
              </div>
              <div>
                <label className={`mb-1 block ${labelCls}`}>URL ปุ่ม</label>
                <input type="text" value={form.ctaHref} onChange={(e) => set("ctaHref", e.target.value)}
                  placeholder="/news หรือ https://..." className={inputCls} />
              </div>
            </div>
          </div>

          {/* การแสดงผล */}
          <div className="rounded-2xl border border-border bg-surface p-4 space-y-4">
            <p className="text-xs font-bold uppercase tracking-wide text-muted">การแสดงผล</p>

            {/* ความถี่ — compact list */}
            <div>
              <p className={`mb-2 ${labelCls}`}>ความถี่การแสดง</p>
              <div className="space-y-1.5">
                {FREQ_OPTIONS.map((opt) => (
                  <button key={opt.value} type="button" onClick={() => set("showFrequency", opt.value)}
                    className={`w-full flex items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all ${form.showFrequency === opt.value ? "border-primary bg-accent-soft" : "border-border hover:border-primary/40"}`}>
                    <span className={`mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 transition-colors ${form.showFrequency === opt.value ? "border-primary bg-primary" : "border-border"}`} />
                    <div className="min-w-0">
                      <p className={`text-xs font-semibold leading-snug ${form.showFrequency === opt.value ? "text-primary" : "text-foreground"}`}>{opt.label}</p>
                      <p className="mt-0.5 text-[11px] text-muted leading-snug">{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* ขอบ + หน่วงเวลา — 2 row */}
            <div className="space-y-3 border-t border-border pt-3">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">ขอบ Popup</p>
                  <p className="text-[11px] text-muted">{form.border !== false ? "มีเส้นขอบรอบ popup" : "ไม่มีขอบ — กลมกลืนกว่าเมื่อรูปเต็มขอบ"}</p>
                </div>
                <Toggle on={form.border !== false} onToggle={() => set("border", form.border === false ? true : false)} />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">หน่วงเวลาก่อนแสดง</p>
                  <span className="rounded-lg border border-border bg-surface-muted px-2 py-0.5 font-mono text-sm">
                    {((form.delayMs ?? 0) / 1000).toFixed(1)} วิ
                  </span>
                </div>
                <input type="range" min="0" max="3" step="0.5"
                  value={(form.delayMs ?? 0) / 1000}
                  onChange={(e) => set("delayMs", Math.round(Number(e.target.value) * 1000))}
                  className="w-full accent-primary" />
                <div className="mt-1 flex justify-between text-[10px] text-muted">
                  <span>ทันที</span><span>1.5 วิ</span><span>3 วิ</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ══ RIGHT: Preview (sticky) ══ */}
        <div className="sticky top-6 self-start space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-foreground">ตัวอย่าง</p>
            <p className="text-[11px] text-muted">ลากขอบขวา · กดมุมเพื่อเปลี่ยนความมน</p>
          </div>

          {/* Backdrop */}
          <div className="relative flex items-center justify-center rounded-2xl py-10 px-4 select-none"
            style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)", minHeight: "200px" }}>

            {/* Popup */}
            <div className={`relative w-full ${widthMaxW} ${radiusCls} overflow-hidden bg-surface shadow-2xl transition-all duration-200 ${form.border !== false ? "border border-border" : ""}`}>

              {/* Close */}
              <span className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white text-xs pointer-events-none">✕</span>

              {/* Image */}
              {form.image
                ? <img src={form.image} alt="" className="block w-full pointer-events-none" /> // eslint-disable-line @next/next/no-img-element
                : <div className="flex h-32 items-center justify-center bg-surface-muted text-xs text-muted pointer-events-none">ยังไม่ได้เลือกรูป</div>
              }

              {/* Content */}
              {(form.title || form.body || (form.ctaLabel && form.ctaHref)) && (
                <div className="p-4 pointer-events-none">
                  {form.title && <p className="text-base font-extrabold leading-snug text-foreground">{form.title}</p>}
                  {form.body  && <p className="mt-1.5 text-sm text-muted leading-relaxed">{form.body}</p>}
                  {form.ctaLabel && form.ctaHref && (
                    <div className="mt-3">
                      <span className="inline-flex items-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white">{form.ctaLabel}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Radius badge */}
              <button type="button" onClick={cycleRadius} title="กดเพื่อเปลี่ยนความมน"
                className="absolute bottom-2 left-2 z-20 flex items-center gap-1 rounded-full border border-white/30 bg-black/50 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-primary/80 transition-colors">
                ◌ {currentRadiusLabel}
              </button>

              {/* Width drag handle */}
              <div onMouseDown={handleWidthDragStart}
                className={`absolute right-0 top-0 bottom-0 z-20 flex w-5 cursor-ew-resize items-center justify-center transition-opacity ${isDragging ? "opacity-100" : "opacity-0 hover:opacity-100"}`}>
                <div className="h-10 w-1 rounded-full bg-primary/70 shadow" />
              </div>
            </div>

            {/* Width pills */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
              {WIDTH_OPTIONS.map((opt) => (
                <button key={opt.value} type="button" onClick={() => set("width", opt.value)}
                  className={`rounded-full border px-3 py-0.5 text-[11px] font-semibold transition-all ${form.width === opt.value ? "border-white bg-white text-gray-900" : "border-white/30 bg-black/30 text-white/70 hover:border-white/60 hover:text-white"}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* ── Save bar ── */}
      <div className="flex items-center justify-between rounded-2xl border border-border bg-surface px-5 py-4">
        <p className="text-xs text-muted">บันทึกเพื่อให้มีผลในหน้า Home</p>
        <div className="flex gap-2">
          <button onClick={handleReset}
            className="rounded-lg border border-border px-4 py-2 text-sm text-muted hover:text-foreground transition-colors">
            รีเซ็ต
          </button>
          <button onClick={handleSave}
            className={`inline-flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold transition-all ${saved ? "bg-emerald-600 text-white" : "btn-primary"}`}>
            {saved ? <><CheckIcon />บันทึกแล้ว</> : "บันทึก"}
          </button>
        </div>
      </div>
    </div>
  );
}
