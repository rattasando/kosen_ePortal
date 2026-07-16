"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { useBanners } from "./BannerContext";
import { useNews } from "./NewsContext";
import { publishedNews, formatDate } from "@/lib/newsUtils";

// ── Constants ──────────────────────────────────────────────────
const LAYOUT_CONFIG = {
  hero:          { label: "Hero",        desc: "ข้อความ + ปุ่ม CTA",            color: "bg-blue-100 text-blue-700 border-blue-200" },
  "news-single": { label: "News Single", desc: "ข่าวเด่น 1 ชิ้นแบบเต็มหน้าจอ", color: "bg-rose-100 text-rose-700 border-rose-200" },
};

const PRESET_IMAGES = [
  "/banners/banner1.jpg",
  "/banners/banner2.jpg",
  "/banners/banner3.jpg",
  "/banners/banner4.jpg",
];

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE_MB = 5;

// ── Shared styles ──────────────────────────────────────────────
const inputCls    = "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-accent-soft placeholder:text-muted";
const labelCls    = "text-xs font-medium text-foreground";
const textareaCls = `${inputCls} resize-none`;

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);

const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
  </svg>
);

// ── PositionPicker ─────────────────────────────────────────────
const POS_GRID = [
  ["left top",    "center top",    "right top"   ],
  ["left center", "center",        "right center"],
  ["left bottom", "center bottom", "right bottom"],
];
const POS_LABELS = {
  "left top": "↖", "center top": "↑", "right top": "↗",
  "left center": "←", "center": "·", "right center": "→",
  "left bottom": "↙", "center bottom": "↓", "right bottom": "↘",
};

function PositionPicker({ value = "center", onChange }) {
  return (
    <div>
      <label className={`mb-1 block ${labelCls}`}>ตำแหน่งรูปภาพ</label>
      <div className="inline-grid grid-cols-3 gap-0.5 rounded-lg border border-border p-1 bg-surface-muted">
        {POS_GRID.map((row) =>
          row.map((pos) => (
            <button key={pos} type="button" title={pos} onClick={() => onChange(pos)}
              className={`flex h-7 w-7 items-center justify-center rounded text-sm font-bold transition-colors
                ${value === pos ? "bg-primary text-white" : "text-muted hover:bg-surface hover:text-foreground"}`}>
              {POS_LABELS[pos]}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────
function nextId(banners) {
  const nums = banners.map((b) => parseInt(b.id.replace("BNR", ""), 10)).filter(Boolean);
  return `BNR${String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3, "0")}`;
}

function emptyForm() {
  return {
    layout: "hero",
    eyebrow: "",
    headline: "",
    body: "",
    badge: "",
    newsId: "",
    ctaLabel: "",
    ctaHref: "",
    secondaryLabel: "",
    secondaryHref: "",
    image: PRESET_IMAGES[0],
    imagePosition: "center",
    status: "active",
  };
}

// ── ImageUploader ──────────────────────────────────────────────
function ImageUploader({ value, onChange }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0); // 0-100
  const [uploadError, setUploadError] = useState("");
  const [tab, setTab] = useState("preset"); // "preset" | "upload" | "url"
  const fileRef = useRef(null);

  const upload = useCallback(async (file) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError("รองรับเฉพาะไฟล์ JPG, PNG, WebP, GIF");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setUploadError(`ขนาดไฟล์ต้องไม่เกิน ${MAX_SIZE_MB} MB`);
      return;
    }
    setUploadError("");
    setUploading(true);
    setProgress(10);

    try {
      const fd = new FormData();
      fd.append("file", file);

      // Fake intermediate progress (XHR doesn't report upload progress easily with fetch)
      const tick = setInterval(() => setProgress((p) => Math.min(p + 15, 80)), 200);

      const res = await fetch("/api/upload/banner", { method: "POST", body: fd });
      clearInterval(tick);
      setProgress(95);

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");

      onChange(json.path);
      setProgress(100);
      setTab("preset"); // jump back so preview is visible
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 800);
    }
  }, [onChange]);

  const handleFiles = useCallback((files) => {
    if (files?.[0]) upload(files[0]);
  }, [upload]);

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  // ── Tabs ──────────────────────────────────────────────────────
  const tabBtn = (key, label) => (
    <button type="button" onClick={() => setTab(key)}
      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${tab === key ? "bg-primary text-white" : "text-muted hover:text-foreground hover:bg-surface-muted"}`}>
      {label}
    </button>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className={labelCls}>รูปภาพพื้นหลัง</label>
        <div className="flex gap-1 rounded-lg border border-border p-0.5">
          {tabBtn("preset", "รูปสำเร็จ")}
          {tabBtn("upload", "อัปโหลด")}
          {tabBtn("url",    "URL")}
        </div>
      </div>

      {/* ── Preset tab ── */}
      {tab === "preset" && (
        <div className="grid grid-cols-4 gap-2">
          {PRESET_IMAGES.map((img) => (
            <button key={img} type="button" onClick={() => onChange(img)}
              className={`relative aspect-video overflow-hidden rounded-lg border-2 transition-all ${value === img ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary"}`}>
              <Image src={img} alt={img} fill className="object-cover" sizes="120px" />
              {value === img && (
                <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                  <span className="text-white text-lg font-bold">✓</span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* ── Upload tab ── */}
      {tab === "upload" && (
        <div>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => !uploading && fileRef.current?.click()}
            className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-8 cursor-pointer transition-all select-none
              ${dragging ? "border-primary bg-accent-soft" : "border-border hover:border-primary hover:bg-surface-muted"}
              ${uploading ? "pointer-events-none opacity-60" : ""}`}>
            <span className={`text-muted ${dragging ? "text-primary" : ""}`}><UploadIcon /></span>
            <p className="text-sm font-medium text-foreground">
              {uploading ? "กำลังอัปโหลด..." : "วางไฟล์ที่นี่ หรือคลิกเพื่อเลือกไฟล์"}
            </p>
            <p className="text-xs text-muted">JPG, PNG, WebP, GIF · สูงสุด {MAX_SIZE_MB} MB</p>
            {uploading && (
              <div className="w-48 overflow-hidden rounded-full bg-surface-muted h-1.5 mt-1">
                <div className="h-full rounded-full bg-primary transition-all duration-200" style={{ width: `${progress}%` }} />
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept={ALLOWED_TYPES.join(",")} className="hidden"
            onChange={(e) => handleFiles(e.target.files)} />
          {uploadError && <p className="mt-1.5 text-xs text-red-500">{uploadError}</p>}
          {value && !PRESET_IMAGES.includes(value) && value.startsWith("/banners/") && (
            <p className="mt-1.5 text-xs text-emerald-600">อัปโหลดสำเร็จ: {value}</p>
          )}
        </div>
      )}

      {/* ── URL tab ── */}
      {tab === "url" && (
        <div>
          <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
            placeholder="/banners/my-image.jpg หรือ https://..." className={inputCls} />
          <p className="mt-1 text-xs text-muted">วาง path จาก /public หรือ URL ภายนอก</p>
        </div>
      )}

      {/* ── Live preview strip (always shown) ── */}
      {value && (
        <div className="relative h-16 w-full overflow-hidden rounded-lg border border-border">
          <Image src={value} alt="preview" fill className="object-cover" sizes="100%"
            onError={() => {}} />
          <div className="absolute inset-0 bg-gradient-to-r from-[#083a66]/70 to-transparent" />
          <p className="absolute bottom-1 left-2 text-[10px] text-white/60 font-mono truncate max-w-[80%]">{value}</p>
        </div>
      )}
    </div>
  );
}

// ── NewsPicker ─────────────────────────────────────────────────
function NewsPicker({ value, onChange, pubNews }) {
  if (!pubNews.length) {
    return <p className="text-xs text-muted">ไม่มีข่าวที่เผยแพร่อยู่ในระบบ</p>;
  }
  return (
    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
      {pubNews.map((n) => {
        const selected = value === n.id;
        return (
          <button
            key={n.id}
            type="button"
            onClick={() => onChange(n.id)}
            className={`w-full flex items-center gap-3 rounded-xl border-2 p-2.5 text-left transition-all ${selected ? "border-primary bg-accent-soft ring-1 ring-primary/20" : "border-border hover:border-primary/40 hover:bg-surface-muted/30"}`}
          >
            <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border border-border bg-surface-muted">
              {n.image ? (
                <Image src={n.image} alt={n.title} fill className="object-cover" sizes="80px" />
              ) : (
                <div className="flex h-full items-center justify-center text-lg text-muted">📰</div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${n.catColor}`}>{n.category}</span>
                <time className="text-[10px] text-muted">{formatDate(n.updatedAt)}</time>
              </div>
              <p className="text-xs font-semibold text-foreground line-clamp-2 leading-snug">{n.title}</p>
            </div>
            {selected && (
              <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white text-[10px] font-bold">✓</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── BannerModal ────────────────────────────────────────────────
function BannerModal({ item, onClose, onSave }) {
  const isEdit = !!item;
  const [form, setForm] = useState(isEdit ? { imagePosition: "center", ...item, badge: item.badge ?? "" } : emptyForm());
  const [errors, setErrors] = useState({});

  const { news: allNews } = useNews();
  const pubNews = publishedNews(allNews);
  const selectedNews = pubNews.find((n) => n.id === form.newsId) ?? null;

  const isNewsSingle = form.layout === "news-single";

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const set = (field, val) => {
    setForm((f) => ({ ...f, [field]: val }));
    setErrors((e) => ({ ...e, [field]: "" }));
  };

  // When picking a news item, auto-fill ctaHref
  const pickNews = (newsId) => {
    const n = pubNews.find((x) => x.id === newsId);
    setForm((f) => ({
      ...f,
      newsId,
      image: n?.image ?? f.image,
      ctaHref: `/news/${newsId}`,
      ctaLabel: f.ctaLabel || "อ่านข่าวเต็ม",
    }));
    setErrors((e) => ({ ...e, newsId: "" }));
  };

  const validate = () => {
    const e = {};
    if (isNewsSingle && !form.newsId) e.newsId = "กรุณาเลือกข่าวที่จะแสดง";
    if (!isNewsSingle && !form.headline.trim()) e.headline = "กรุณากรอกหัวข้อหลัก";
    if (!form.ctaLabel.trim()) e.ctaLabel = "กรุณากรอกข้อความปุ่ม";
    if (!form.ctaHref.trim())  e.ctaHref  = "กรุณากรอก URL ปุ่ม";
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
      <label className={`mb-1 block ${labelCls}`}>
        {label}{opts.required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {opts.textarea ? (
        <textarea value={form[key] ?? ""} onChange={(e) => set(key, e.target.value)}
          rows={opts.rows ?? 3} placeholder={opts.placeholder} className={textareaCls} />
      ) : (
        <input type="text" value={form[key] ?? ""} onChange={(e) => set(key, e.target.value)}
          placeholder={opts.placeholder} className={inputCls} />
      )}
      {errors[key] && <p className="mt-1 text-xs text-red-500">{errors[key]}</p>}
    </div>
  );

  // ── Preview box ──────────────────────────────────────────────
  const previewImg  = isNewsSingle ? (selectedNews?.image ?? form.image) : form.image;
  const PreviewBox = () => {
    if (!previewImg && !(isNewsSingle && !selectedNews)) return null;
    const displayTitle = form.headline?.trim() || selectedNews?.title || "";
    const isLong = displayTitle.length > 50;
    return (
      <div className="relative w-full overflow-hidden rounded-xl border border-border" style={{ height: "200px" }}>
        {previewImg ? (
          <Image src={previewImg} alt="preview" fill className="object-cover" style={{ objectPosition: form.imagePosition ?? "center" }} sizes="100%" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />

        {form.badge && (
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1 text-xs font-bold text-white shadow tracking-wide">✦ {form.badge}</span>
          </div>
        )}

        <div className="absolute inset-0 flex flex-col justify-end px-5 pb-4">
          {isNewsSingle && selectedNews ? (
            <>
              <div className="flex items-center gap-2 mb-2">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${selectedNews.catColor}`}>{selectedNews.category}</span>
                <time className="text-xs text-white/80">{formatDate(selectedNews.updatedAt)}</time>
              </div>
              <p className={`font-extrabold text-white leading-tight line-clamp-3 mb-2.5 ${isLong ? "text-lg" : "text-xl"}`}>
                {displayTitle}
              </p>
            </>
          ) : isNewsSingle ? (
            <p className="text-sm text-white/50 italic mb-3">← เลือกข่าวด้านบนเพื่อดูพรีวิว</p>
          ) : (
            <>
              {form.eyebrow && <p className="text-[10px] font-semibold uppercase tracking-widest text-white/60 mb-1">{form.eyebrow}</p>}
              <p className={`font-extrabold text-white leading-tight line-clamp-3 mb-1.5 ${(form.headline || "").length > 50 ? "text-lg" : "text-xl"}`}>
                {form.headline || "หัวข้อหลัก…"}
              </p>
              {form.body && <p className="text-xs text-white/70 line-clamp-1 mb-1.5">{form.body}</p>}
            </>
          )}
          {form.ctaLabel && (
            <div className="flex gap-2">
              <span className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white">{form.ctaLabel}</span>
              {!isNewsSingle && form.secondaryLabel && (
                <span className="rounded-lg border border-white/40 px-3 py-1.5 text-xs font-semibold text-white">{form.secondaryLabel}</span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="flex w-full max-w-2xl flex-col rounded-2xl border border-border bg-surface shadow-2xl max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4 flex-shrink-0">
          <div>
            <p className="text-sm font-semibold text-foreground">{isEdit ? "แก้ไข Banner" : "เพิ่ม Banner ใหม่"}</p>
            <p className="text-xs text-muted">{isEdit ? `รหัส ${item.id}` : "สไลด์ใหม่จะปรากฏในหน้า Home"}</p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-surface-muted hover:text-foreground transition-colors">
            <XIcon />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-5">

          {/* ── Layout picker ── */}
          <div>
            <label className={`mb-2 block ${labelCls}`}>รูปแบบ Layout</label>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(LAYOUT_CONFIG).map(([key, cfg]) => (
                <button key={key} type="button" onClick={() => set("layout", key)}
                  className={`rounded-xl border-2 p-4 text-left transition-all ${form.layout === key ? "border-primary bg-accent-soft ring-2 ring-primary/20" : "border-border hover:border-primary/40"}`}>
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
                  <p className="mt-2 text-xs text-muted leading-relaxed">{cfg.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* ── News-Single: news picker ── */}
          {isNewsSingle && (
            <div className="space-y-4">
              <div>
                <label className={`mb-2 block ${labelCls}`}>
                  เลือกข่าวที่จะแสดง<span className="ml-0.5 text-red-500">*</span>
                </label>
                <NewsPicker value={form.newsId} onChange={pickNews} pubNews={pubNews} />
                {errors.newsId && <p className="mt-1 text-xs text-red-500">{errors.newsId}</p>}
              </div>
              <div>
                <label className={`mb-1 block ${labelCls}`}>
                  หัวข้อที่แสดงบน Banner
                  <span className="ml-1 font-normal text-muted">(ไม่บังคับ — หากว่างจะใช้หัวข้อข่าวจริง)</span>
                </label>
                <input
                  type="text"
                  value={form.headline ?? ""}
                  onChange={(e) => set("headline", e.target.value)}
                  placeholder={selectedNews?.title ?? "ปล่อยว่างเพื่อใช้หัวข้อข่าวจริง"}
                  className={inputCls}
                />
              </div>
            </div>
          )}

          {/* ── Hero: image picker ── */}
          {!isNewsSingle && (
            <ImageUploader value={form.image} onChange={(v) => set("image", v)} />
          )}

          {/* ── Image position ── */}
          <PositionPicker value={form.imagePosition ?? "center"} onChange={(v) => set("imagePosition", v)} />

          {/* ── Preview ── */}
          <div>
            <p className={`mb-2 ${labelCls}`}>พรีวิว</p>
            <PreviewBox />
          </div>

          {/* ── Badge (top-left label) ── */}
          {field("Badge (ป้ายมุมบนซ้าย — ไม่บังคับ)", "badge", { placeholder: "เช่น ข่าวเด่น, ประกาศ" })}

          {/* ── Hero-only text fields ── */}
          {!isNewsSingle && (
            <>
              {field("Eyebrow (ข้อความเล็กเหนือหัวข้อ)", "eyebrow", { placeholder: "เช่น เกี่ยวกับโครงการ THAI-KOSEN" })}
              {field("หัวข้อหลัก (Headline)", "headline", { required: true, placeholder: "หัวข้อที่แสดงขนาดใหญ่" })}
              {field("ข้อความอธิบาย (Body)", "body", { textarea: true, rows: 2, placeholder: "อธิบายเนื้อหาของสไลด์นี้ (ไม่บังคับ)" })}
            </>
          )}

          {/* ── CTA ── */}
          <div className="rounded-xl border border-border p-4 space-y-3">
            <p className="text-xs font-semibold text-muted uppercase tracking-wide">ปุ่ม CTA</p>
            <div className="grid grid-cols-2 gap-3">
              {field("ข้อความปุ่ม", "ctaLabel", { required: true, placeholder: isNewsSingle ? "อ่านข่าวเต็ม" : "อ่านรายละเอียดเพิ่มเติม" })}
              {field("URL ปุ่ม", "ctaHref", { required: true, placeholder: "/news/1 หรือ https://..." })}
            </div>
          </div>

          {/* ── Secondary CTA (hero only) ── */}
          {!isNewsSingle && (
            <div className="rounded-xl border border-border p-4 space-y-3">
              <p className="text-xs font-semibold text-muted uppercase tracking-wide">ปุ่มรอง (ไม่บังคับ)</p>
              <div className="grid grid-cols-2 gap-3">
                {field("ข้อความปุ่มรอง", "secondaryLabel", { placeholder: "เช่น ติดต่อสอบถาม" })}
                {field("URL ปุ่มรอง", "secondaryHref", { placeholder: "/contact" })}
              </div>
            </div>
          )}

          {/* ── Status ── */}
          <div>
            <label className={`mb-1 block ${labelCls}`}>สถานะ</label>
            <select value={form.status} onChange={(e) => set("status", e.target.value)}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-accent-soft w-full">
              <option value="active">แสดงอยู่ (Active)</option>
              <option value="inactive">ซ่อนอยู่ (Inactive)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4 flex-shrink-0">
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors">ยกเลิก</button>
          <button onClick={handleSubmit} className="btn-primary">{isEdit ? "บันทึกการแก้ไข" : "เพิ่ม Banner"}</button>
        </div>
      </div>
    </div>
  );
}

// ── BannerCard ─────────────────────────────────────────────────
function BannerCard({ banner, index, total, onEdit, onDelete, onToggle, onMoveUp, onMoveDown, pubNews }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const layoutCfg = LAYOUT_CONFIG[banner.layout] ?? { label: banner.layout, color: "bg-gray-100 text-gray-600 border-gray-200" };
  const isActive  = banner.status === "active";
  const linkedNews = banner.layout === "news-single" ? (pubNews?.find((n) => n.id === banner.newsId) ?? null) : null;
  const cardImage  = linkedNews?.image ?? banner.image;

  return (
    <div className={`group relative overflow-hidden rounded-2xl border-2 transition-all ${isActive ? "border-border" : "border-dashed border-border opacity-60"} bg-surface`}>
      {/* Image area */}
      <div className="relative h-52 w-full overflow-hidden">
        {cardImage ? (
          <Image src={cardImage} alt={banner.headline || linkedNews?.title || ""} fill
            className="object-cover transition-transform duration-300 group-hover:scale-105" sizes="(max-width:768px) 100vw, 50vw" />
        ) : (
          <div className="flex h-full items-center justify-center bg-surface-muted text-muted text-sm">ไม่มีรูปภาพ</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />

        {/* Badge top-left */}
        {banner.badge && (
          <div className="absolute top-3 left-10">
            <span className="inline-flex items-center gap-1 rounded-xl bg-primary/90 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">✦ {banner.badge}</span>
          </div>
        )}

        <div className="absolute inset-0 flex flex-col justify-end px-4 pb-3">
          {banner.layout === "news-single" ? (
            linkedNews ? (() => {
              const title = banner.headline?.trim() || linkedNews.title;
              const long  = title.length > 50;
              return (
                <>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${linkedNews.catColor}`}>{linkedNews.category}</span>
                    <time className="text-[10px] text-white/70">{formatDate(linkedNews.updatedAt)}</time>
                  </div>
                  <p className={`font-extrabold text-white leading-tight line-clamp-3 mb-1.5 ${long ? "text-sm" : "text-base"}`}>{title}</p>
                </>
              );
            })() : (
              <p className="text-xs text-white/50 italic mb-2">ยังไม่ได้เลือกข่าว</p>
            )
          ) : (
            <>
              {banner.eyebrow && <p className="text-[10px] font-semibold uppercase tracking-widest text-white/60 mb-0.5">{banner.eyebrow}</p>}
              <p className={`font-extrabold text-white leading-tight line-clamp-3 mb-1 ${(banner.headline || "").length > 50 ? "text-sm" : "text-base"}`}>{banner.headline}</p>
              {banner.body && <p className="text-[10px] text-white/70 line-clamp-1 mb-1">{banner.body}</p>}
            </>
          )}
          <div className="flex flex-wrap gap-1.5">
            {banner.ctaLabel && (
              <span className="rounded-lg bg-primary px-2.5 py-0.5 text-[10px] font-semibold text-white">{banner.ctaLabel}</span>
            )}
            {banner.secondaryLabel && (
              <span className="rounded-lg border border-white/40 px-2.5 py-0.5 text-[10px] font-semibold text-white">{banner.secondaryLabel}</span>
            )}
          </div>
        </div>

        <div className="absolute top-3 left-3 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-xs font-bold text-white backdrop-blur-sm">
          {index + 1}
        </div>
        <div className="absolute top-3 right-3">
          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold backdrop-blur-sm ${isActive ? "bg-emerald-500/90 text-white" : "bg-gray-500/80 text-white"}`}>
            {isActive ? "Active" : "Hidden"}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${layoutCfg.color}`}>{layoutCfg.label}</span>
            <span className="font-mono text-[10px] text-muted">{banner.id}</span>
          </div>
          <p className="mt-1 text-xs text-muted truncate">CTA: {banner.ctaLabel} → {banner.ctaHref}</p>
        </div>

        {!confirmDelete ? (
          <div className="flex items-center gap-2">
            <button onClick={onMoveUp} disabled={index === 0}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted hover:border-primary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm">↑</button>
            <button onClick={onMoveDown} disabled={index === total - 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted hover:border-primary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm">↓</button>
            <button onClick={onToggle}
              className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${isActive ? "border-amber-200 text-amber-600 hover:bg-amber-50" : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"}`}>
              {isActive ? "ซ่อน" : "แสดง"}
            </button>
            <button onClick={() => onEdit(banner)}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted hover:border-primary hover:text-primary transition-colors">แก้ไข</button>
            <button onClick={() => setConfirmDelete(true)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-400 hover:bg-red-50 transition-colors">
              <XIcon />
            </button>
          </div>
        ) : (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 space-y-2">
            <p className="text-xs font-semibold text-red-700">ลบ Banner นี้?</p>
            <div className="flex gap-2">
              <button onClick={() => onDelete(banner.id)} className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-700 transition-colors">ยืนยัน</button>
              <button onClick={() => setConfirmDelete(false)} className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted hover:text-foreground transition-colors">ยกเลิก</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────
export default function BannerListClient() {
  const { banners, ready, addBanner, updateBanner, deleteBanner, reorder } = useBanners();
  const { news: allNews } = useNews();
  const pubNews = publishedNews(allNews);
  const [modal, setModal] = useState(null);
  const [filterStatus, setFilterStatus] = useState("");

  const displayed = banners
    .filter((b) => filterStatus === "" || b.status === filterStatus)
    .sort((a, b) => a.order - b.order);

  const activeCount   = banners.filter((b) => b.status === "active").length;
  const inactiveCount = banners.filter((b) => b.status === "inactive").length;

  const handleSave = (form) => {
    if (modal?.mode === "edit") {
      updateBanner(modal.item.id, form);
    } else {
      const maxOrder = banners.reduce((m, b) => Math.max(m, b.order), 0);
      addBanner({ ...form, id: nextId(banners), order: maxOrder + 1 });
    }
  };

  const handleToggle = (banner) => {
    updateBanner(banner.id, { status: banner.status === "active" ? "inactive" : "active" });
  };

  const swap = (bannerA, bannerB) => {
    const reordered = banners.map((b) => {
      if (b.id === bannerA.id) return { ...b, order: bannerB.order };
      if (b.id === bannerB.id) return { ...b, order: bannerA.order };
      return b;
    });
    reorder(reordered);
  };

  const handleMoveUp = (banner) => {
    const sorted = [...banners].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((b) => b.id === banner.id);
    if (idx <= 0) return;
    swap(banner, sorted[idx - 1]);
  };

  const handleMoveDown = (banner) => {
    const sorted = [...banners].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((b) => b.id === banner.id);
    if (idx >= sorted.length - 1) return;
    swap(banner, sorted[idx + 1]);
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

  return (
    <div className="space-y-5 p-6">
      <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
        <span className="text-blue-500 text-sm mt-0.5">ℹ</span>
        <p className="text-xs text-blue-700 leading-relaxed">
          การแก้ไขที่นี่จะสะท้อนในหน้า Home ทันทีเมื่อโหลดหน้าใหม่ • ลำดับตัวเลขบนการ์ดคือลำดับในสไลด์ • รูปที่อัปโหลดจะบันทึกใน <code className="font-mono">/public/banners/</code>
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {[
            { key: "",         label: "ทั้งหมด",  count: banners.length, pill: "bg-surface-muted border-border text-foreground" },
            { key: "active",   label: "แสดงอยู่", count: activeCount,    pill: "bg-emerald-50 border-emerald-200 text-emerald-700" },
            { key: "inactive", label: "ซ่อนอยู่", count: inactiveCount,  pill: "bg-gray-50 border-gray-200 text-gray-600" },
          ].map(({ key, label, count, pill }) => (
            <button key={key} onClick={() => setFilterStatus(filterStatus === key ? "" : key)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${pill} ${filterStatus === key ? "ring-2 ring-primary/30 ring-offset-1" : "opacity-80 hover:opacity-100"}`}>
              {label}
              <span className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${filterStatus === key ? "bg-primary/10" : "bg-border"}`}>{count}</span>
            </button>
          ))}
        </div>
        <button onClick={() => setModal({ mode: "add" })} className="btn-primary whitespace-nowrap">+ เพิ่ม Banner</button>
      </div>

      <div className="flex flex-wrap gap-2">
        {Object.entries(LAYOUT_CONFIG).map(([key, cfg]) => (
          <span key={key} className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${cfg.color}`}>
            <span className="font-bold">{cfg.label}</span>
            <span className="opacity-70">— {cfg.desc}</span>
          </span>
        ))}
      </div>

      {displayed.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-20 text-center text-sm text-muted">
          ไม่มี Banner ที่แสดงอยู่
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {displayed.map((banner, i) => (
            <BannerCard
              key={banner.id}
              banner={banner}
              index={i}
              total={displayed.length}
              pubNews={pubNews}
              onEdit={(b) => setModal({ mode: "edit", item: b })}
              onDelete={deleteBanner}
              onToggle={() => handleToggle(banner)}
              onMoveUp={() => handleMoveUp(banner)}
              onMoveDown={() => handleMoveDown(banner)}
            />
          ))}
        </div>
      )}

      {modal && (
        <BannerModal
          item={modal.item}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
