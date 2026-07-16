"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useNews } from "@/components/admin/NewsContext";
import { publishedNews, formatDate } from "@/lib/newsUtils";

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES = ["ความร่วมมือ", "กิจกรรม", "ทุนการศึกษา", "ประกาศ", "ความสำเร็จ", "โครงการแลกเปลี่ยน"];
const CAT_COLORS = {
  ความร่วมมือ:       "bg-blue-100 text-blue-700",
  กิจกรรม:           "bg-violet-100 text-violet-700",
  ทุนการศึกษา:       "bg-amber-100 text-amber-700",
  ประกาศ:            "bg-slate-100 text-slate-700",
  ความสำเร็จ:        "bg-emerald-100 text-emerald-700",
  โครงการแลกเปลี่ยน: "bg-rose-100 text-rose-700",
};

const STATUS_CONFIG = {
  published: { label: "เผยแพร่",  color: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  draft:     { label: "แบบร่าง",  color: "bg-amber-100 text-amber-700 border-amber-200",       dot: "bg-amber-400" },
  archived:  { label: "เก็บถาวร", color: "bg-gray-100 text-gray-600 border-gray-200",          dot: "bg-gray-400" },
};

const BLOCK_MENU = [
  { type: "paragraph", label: "ย่อหน้า",  icon: "¶",  hint: "ข้อความธรรมดา" },
  { type: "heading1",  label: "H1",        icon: "H1", hint: "หัวข้อใหญ่มาก" },
  { type: "heading2",  label: "H2",        icon: "H2", hint: "หัวข้อหลัก" },
  { type: "heading3",  label: "H3",        icon: "H3", hint: "หัวข้อรอง" },
  { type: "heading4",  label: "H4",        icon: "H4", hint: "หัวข้อเล็ก" },
  { type: "image",     label: "รูปภาพ",    icon: "🖼", hint: "แทรกรูปภาพ" },
  { type: "spacer",    label: "เว้นวรรค",  icon: "↕",  hint: "ช่องว่าง" },
];

const FONT_SIZES = [
  { key: "sm",   label: "S",  cls: "text-sm leading-7" },
  { key: "base", label: "M",  cls: "text-base leading-8" },
  { key: "lg",   label: "L",  cls: "text-lg leading-9" },
  { key: "xl",   label: "XL", cls: "text-xl leading-9" },
];

const HERO_SIZES  = [
  { key: "21/9", label: "21:9" },
  { key: "16/9", label: "16:9" },
  { key: "4/3",  label: "4:3"  },
  { key: "1/1",  label: "1:1"  },
  { key: "full", label: "เต็ม" },
];
const IMAGE_SIZES = [
  { key: "16/9", label: "16:9" },
  { key: "4/3",  label: "4:3"  },
  { key: "3/2",  label: "3:2"  },
  { key: "1/1",  label: "1:1"  },
  { key: "full", label: "เต็ม" },
];

function uid() { return Math.random().toString(36).slice(2, 9); }
function makeBlock(type) { return { id: uid(), type, content: "", src: "", alt: "", caption: "", fontSize: "base", objectPosition: "center", imageSize: "16/9" }; }
function slugify(t) {
  return t.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 80);
}

export function emptyNewsForm() {
  return {
    title: "", slug: "", category: CATEGORIES[0], catColor: CAT_COLORS[CATEGORIES[0]],
    excerpt: "", image: "", author: "", tags: [], status: "draft", featured: false, publishedAt: "", blocks: [],
    heroAspect: "21/9", imagePosition: "center",
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function useAutoResize(value) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, [value]);
  return ref;
}

function estimatedReadTime(form) {
  const text = [form.title, form.excerpt, ...(form.blocks ?? []).map(b => b.content || "")].join(" ");
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function todayThai() {
  return new Date().toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" });
}

// Tab key → insert 4 spaces instead of shifting focus
function handleTab(e, value, onChange) {
  if (e.key !== "Tab") return;
  e.preventDefault();
  const el = e.target;
  const start = el.selectionStart;
  const end = el.selectionEnd;
  const indent = "    ";
  const next = value.substring(0, start) + indent + value.substring(end);
  onChange(next);
  requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = start + indent.length; });
}

// ── TagInput ──────────────────────────────────────────────────────────────────

function TagInput({ tags, onChange }) {
  const [input, setInput] = useState("");
  const add = () => {
    const t = input.trim();
    if (t && !tags.includes(t)) onChange([...tags, t]);
    setInput("");
  };
  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-1 text-xs font-semibold text-primary">
            {t}
            <button type="button" onClick={() => onChange(tags.filter(x => x !== t))}
              className="hover:text-red-500 transition-colors leading-none">×</button>
          </span>
        ))}
      </div>
      <div className="flex gap-1.5">
        <input value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder="พิมพ์แท็ก แล้ว Enter"
          className="flex-1 min-w-0 rounded-lg border border-border bg-white px-3 py-1.5 text-xs outline-none focus:border-primary" />
        <button type="button" onClick={add}
          className="rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted hover:text-foreground transition-colors">+ เพิ่ม</button>
      </div>
    </div>
  );
}

// ── ImageInput — upload file or paste URL, usable anywhere in the preview ─────

function ImageInput({ value, onChange, aspectRatio = "16/9", hint = "รูปภาพ", objectPosition = "center", imageFull = false }) {
  const fileRef = useRef(null);
  const [showUrl, setShowUrl] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { onChange(ev.target.result); setShowUrl(false); };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const confirmUrl = () => {
    onChange(urlDraft.trim());
    setShowUrl(false);
    setUrlDraft("");
  };

  // ── Has image ──
  if (value && !showUrl) {
    return (
      <div className="group/img relative w-full overflow-hidden rounded-2xl"
        style={imageFull ? {} : { aspectRatio }}>
        <img src={value} alt=""
          className={imageFull ? "w-full h-auto block" : "h-full w-full object-cover"}
          style={!imageFull ? { objectPosition } : undefined}
        />
        {/* Hover overlay */}
        <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-2xl bg-black/0 opacity-0 transition-all group-hover/img:bg-black/40 group-hover/img:opacity-100">
          <button type="button" onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 rounded-xl bg-white/95 px-3 py-2 text-xs font-semibold text-foreground shadow hover:bg-white transition-colors">
            <UploadIcon /> อัพโหลด
          </button>
          <button type="button" onClick={() => { setUrlDraft(value); setShowUrl(true); }}
            className="flex items-center gap-1.5 rounded-xl bg-white/95 px-3 py-2 text-xs font-semibold text-foreground shadow hover:bg-white transition-colors">
            <LinkIcon /> แก้ URL
          </button>
          <button type="button" onClick={() => onChange("")}
            className="flex items-center gap-1.5 rounded-xl bg-white/95 px-3 py-2 text-xs font-semibold text-red-500 shadow hover:bg-white transition-colors">
            <TrashIcon /> ลบ
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={handleFile} />
      </div>
    );
  }

  // ── URL input mode ──
  if (showUrl) {
    return (
      <div className="rounded-2xl border-2 border-primary/30 bg-primary/[0.03] p-4 space-y-3">
        {value && (
          <img src={value} alt="" className="w-full h-28 rounded-xl object-cover border border-border" />
        )}
        <p className="text-xs font-semibold text-muted">วาง URL รูปภาพ</p>
        <input value={urlDraft} onChange={(e) => setUrlDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") confirmUrl(); if (e.key === "Escape") setShowUrl(false); }}
          placeholder="https://... หรือ /images/..."
          autoFocus
          className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary" />
        <div className="flex gap-2">
          <button type="button" onClick={confirmUrl}
            className="rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 transition-colors">
            ✓ ใช้ URL
          </button>
          <button type="button" onClick={() => { setShowUrl(false); setUrlDraft(""); }}
            className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted hover:text-foreground transition-colors">
            ยกเลิก
          </button>
          {/* Also offer upload from this state */}
          <button type="button" onClick={() => fileRef.current?.click()}
            className="ml-auto flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted hover:border-primary hover:text-primary transition-colors">
            <UploadIcon /> อัพโหลด
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={handleFile} />
      </div>
    );
  }

  // ── No image ──
  return (
    <div className="flex flex-col items-center justify-center w-full rounded-2xl border-2 border-dashed border-border bg-surface-muted"
      style={{ aspectRatio }}>
      <span className="text-4xl text-foreground/15 mb-3">🖼</span>
      <p className="text-sm text-muted mb-4">{hint}</p>
      <div className="flex gap-2">
        <button type="button" onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1.5 rounded-xl border border-border bg-white px-4 py-2 text-xs font-semibold text-foreground shadow-sm hover:border-primary hover:bg-primary/5 hover:text-primary transition-colors">
          <UploadIcon /> อัพโหลดรูป
        </button>
        <button type="button" onClick={() => { setUrlDraft(""); setShowUrl(true); }}
          className="flex items-center gap-1.5 rounded-xl border border-border bg-white px-4 py-2 text-xs font-semibold text-foreground shadow-sm hover:border-primary hover:bg-primary/5 hover:text-primary transition-colors">
          <LinkIcon /> วาง URL
        </button>
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={handleFile} />
    </div>
  );
}

// ── Inline icons ──────────────────────────────────────────────────────────────

function UploadIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  );
}
function LinkIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

// ── Position picker (3×3 grid) ───────────────────────────────────────────────

const POS_GRID = [
  ["left top",    "center top",    "right top"],
  ["left center", "center",        "right center"],
  ["left bottom", "center bottom", "right bottom"],
];
const POS_LABELS = { "left top": "↖", "center top": "↑", "right top": "↗", "left center": "←", "center": "·", "right center": "→", "left bottom": "↙", "center bottom": "↓", "right bottom": "↘" };

function PositionPicker({ value = "center", onChange }) {
  return (
    <div className="inline-grid grid-cols-3 gap-0.5 rounded-lg border border-border bg-white p-1">
      {POS_GRID.flat().map((pos) => (
        <button key={pos} type="button" title={pos} onClick={() => onChange(pos)}
          className={`flex h-5 w-5 items-center justify-center rounded-sm text-[9px] font-bold transition-colors ${
            value === pos ? "bg-primary text-white" : "bg-slate-100 text-muted hover:bg-primary/30 hover:text-primary"
          }`}>
          {POS_LABELS[pos]}
        </button>
      ))}
    </div>
  );
}

// ── Add block row (always visible separator between blocks) ───────────────────

function AddBlockRow({ onAdd }) {
  return (
    <div className="relative flex items-center my-4">
      <div className="absolute inset-x-0 top-1/2 h-px bg-border/50" />
      <div className="relative mx-auto flex items-center gap-1 rounded-2xl border border-border bg-white px-2 py-1.5 shadow-md">
        {BLOCK_MENU.map(t => (
          <button key={t.type} type="button" onClick={() => onAdd(t.type)}
            title={t.hint}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-muted hover:bg-primary hover:text-white transition-all">
            <span className="text-base leading-none">{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Paragraph textarea (separate component to avoid hook violations) ──────────

function ParagraphTextarea({ value, onChange, fontSize = "base" }) {
  const ref = useAutoResize(value);
  const sizeCls = FONT_SIZES.find(s => s.key === fontSize)?.cls ?? "text-base leading-8";
  return (
    <textarea ref={ref} rows={1} value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => handleTab(e, value, onChange)}
      placeholder="พิมพ์ข้อความย่อหน้า..."
      className={`w-full resize-none overflow-hidden bg-transparent outline-none text-foreground/80 placeholder:text-foreground/20 ${sizeCls}`} />
  );
}

// ── ArticleBlock — editable in-place, styled like /news/[id] ─────────────────

function ArticleBlock({ block, index, total, onUpdate, onMove, onDelete }) {
  const isParagraph = block.type === "paragraph";
  const currentSize = block.fontSize ?? "base";

  return (
    <div className="group/block relative">

      {/* Floating toolbar — left side, on hover */}
      <div className="absolute -left-11 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 opacity-0 group-hover/block:opacity-100 transition-opacity z-10">
        <button type="button" disabled={index === 0} onClick={() => onMove(index, -1)}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-white text-[10px] text-muted shadow-sm hover:border-primary hover:text-primary disabled:opacity-30 transition-colors">▲</button>
        <button type="button" disabled={index === total - 1} onClick={() => onMove(index, 1)}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-white text-[10px] text-muted shadow-sm hover:border-primary hover:text-primary disabled:opacity-30 transition-colors">▼</button>
        <button type="button" onClick={() => onDelete(index)}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-white text-[10px] text-muted shadow-sm hover:border-red-400 hover:text-red-500 transition-colors">✕</button>
      </div>

      {/* Font size toolbar — top-right, shown for paragraph blocks */}
      {isParagraph && (
        <div className="absolute -top-7 right-0 flex items-center gap-0.5 opacity-0 group-hover/block:opacity-100 transition-opacity z-10">
          <span className="text-[10px] text-muted mr-1 select-none">ขนาด:</span>
          {FONT_SIZES.map(s => (
            <button key={s.key} type="button" onClick={() => onUpdate(index, "fontSize", s.key)}
              className={`h-6 w-7 rounded text-[10px] font-bold transition-colors ${
                currentSize === s.key
                  ? "bg-primary text-white"
                  : "border border-border bg-white text-muted hover:border-primary hover:text-primary"
              }`}>
              {s.label}
            </button>
          ))}
        </div>
      )}

      {block.type === "paragraph" && (
        <ParagraphTextarea value={block.content ?? ""} fontSize={currentSize} onChange={(v) => onUpdate(index, "content", v)} />
      )}

      {block.type === "heading1" && (
        <input value={block.content ?? ""}
          onChange={(e) => onUpdate(index, "content", e.target.value)}
          onKeyDown={(e) => handleTab(e, block.content ?? "", (v) => onUpdate(index, "content", v))}
          placeholder="หัวข้อ H1..."
          className="w-full bg-transparent outline-none text-3xl font-extrabold text-foreground leading-tight placeholder:text-foreground/20" />
      )}

      {block.type === "heading2" && (
        <input value={block.content ?? ""}
          onChange={(e) => onUpdate(index, "content", e.target.value)}
          onKeyDown={(e) => handleTab(e, block.content ?? "", (v) => onUpdate(index, "content", v))}
          placeholder="หัวข้อ H2..."
          className="w-full bg-transparent outline-none text-2xl font-extrabold text-foreground leading-tight placeholder:text-foreground/20" />
      )}

      {block.type === "heading3" && (
        <input value={block.content ?? ""}
          onChange={(e) => onUpdate(index, "content", e.target.value)}
          onKeyDown={(e) => handleTab(e, block.content ?? "", (v) => onUpdate(index, "content", v))}
          placeholder="หัวข้อ H3..."
          className="w-full bg-transparent outline-none text-lg font-bold text-foreground leading-tight placeholder:text-foreground/20" />
      )}

      {block.type === "heading4" && (
        <input value={block.content ?? ""}
          onChange={(e) => onUpdate(index, "content", e.target.value)}
          onKeyDown={(e) => handleTab(e, block.content ?? "", (v) => onUpdate(index, "content", v))}
          placeholder="หัวข้อ H4..."
          className="w-full bg-transparent outline-none text-base font-bold text-foreground leading-tight placeholder:text-foreground/20" />
      )}

      {block.type === "image" && (
        <figure>
          <ImageInput
            value={block.src ?? ""}
            onChange={(v) => onUpdate(index, "src", v)}
            aspectRatio={block.imageSize !== "full" ? (block.imageSize ?? "16/9") : "16/9"}
            hint="รูปภาพในบทความ"
            objectPosition={block.objectPosition ?? "center"}
            imageFull={(block.imageSize ?? "16/9") === "full"}
          />
          {block.src && (
            <div className="mt-2 space-y-2">
              {/* Size + position controls */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-muted shrink-0">ขนาด:</span>
                  {IMAGE_SIZES.map(({ key, label }) => (
                    <button key={key} type="button"
                      onClick={() => onUpdate(index, "imageSize", key)}
                      className={`rounded px-2 py-0.5 text-[10px] font-semibold transition-colors ${
                        (block.imageSize ?? "16/9") === key
                          ? "bg-primary text-white"
                          : "border border-border bg-white text-muted hover:border-primary hover:text-primary"
                      }`}>
                      {label}
                    </button>
                  ))}
                </div>
                {(block.imageSize ?? "16/9") !== "full" && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-muted shrink-0">ตำแหน่ง:</span>
                    <PositionPicker value={block.objectPosition ?? "center"} onChange={(v) => onUpdate(index, "objectPosition", v)} />
                  </div>
                )}
              </div>
              {/* Alt + Caption */}
              <div className="grid grid-cols-2 gap-2">
                <input value={block.alt ?? ""} onChange={(e) => onUpdate(index, "alt", e.target.value)}
                  placeholder="Alt text (SEO)"
                  className="rounded-lg border border-border/50 bg-transparent px-2 py-1 text-xs text-muted outline-none focus:border-primary focus:bg-surface" />
                <input value={block.caption ?? ""} onChange={(e) => onUpdate(index, "caption", e.target.value)}
                  placeholder="Caption ใต้รูป"
                  className="rounded-lg border border-border/50 bg-transparent px-2 py-1 text-xs text-muted outline-none focus:border-primary focus:bg-surface" />
              </div>
            </div>
          )}
          {block.caption && (
            <figcaption className="mt-1 text-center text-xs text-muted">{block.caption}</figcaption>
          )}
        </figure>
      )}

      {block.type === "spacer" && (
        <div className="flex items-center gap-3 py-2">
          <div className="flex-1 border-t-2 border-dashed border-border/40" />
          <span className="text-xs text-muted/50 select-none">เว้นวรรค</span>
          <div className="flex-1 border-t-2 border-dashed border-border/40" />
        </div>
      )}
    </div>
  );
}

// ── Main NewsEditor ───────────────────────────────────────────────────────────

export default function NewsEditor({ item, onSave, onClose }) {
  const isEdit = !!item?.id;
  const [form, setForm] = useState(() => item
    ? { blocks: [], tags: [], publishedAt: "", excerpt: "", author: "", heroAspect: "21/9", imagePosition: "center", ...item }
    : emptyNewsForm());
  const [errors, setErrors] = useState({});

  const set = useCallback((key, val) => {
    setForm(f => {
      const next = { ...f, [key]: val };
      if (key === "title" && !isEdit) next.slug = slugify(val);
      if (key === "category") next.catColor = CAT_COLORS[val] ?? "";
      return next;
    });
    setErrors(e => ({ ...e, [key]: "" }));
  }, [isEdit]);

  const addBlock = useCallback((type, afterIndex) => {
    setForm(f => {
      const next = [...(f.blocks ?? [])];
      const at = afterIndex === undefined ? next.length : afterIndex + 1;
      next.splice(at, 0, makeBlock(type));
      return { ...f, blocks: next };
    });
  }, []);

  const updateBlock = useCallback((index, key, value) => {
    setForm(f => ({ ...f, blocks: f.blocks.map((b, i) => i === index ? { ...b, [key]: value } : b) }));
  }, []);

  const deleteBlock = useCallback((index) => {
    setForm(f => ({ ...f, blocks: f.blocks.filter((_, i) => i !== index) }));
  }, []);

  const moveBlock = useCallback((index, dir) => {
    setForm(f => {
      const next = [...f.blocks];
      const t = index + dir;
      if (t < 0 || t >= next.length) return f;
      [next[index], next[t]] = [next[t], next[index]];
      return { ...f, blocks: next };
    });
  }, []);

  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  const handleSave = () => {
    const e = {};
    if (!form.title.trim()) e.title = "กรุณากรอกหัวข้อ";
    if (!form.author.trim()) e.author = "กรุณากรอกชื่อผู้เขียน";
    if (Object.keys(e).length) { setErrors(e); return; }
    if (!isEdit) form.slug = slugify(form.title);
    onSave(form);
  };

  const titleRef = useAutoResize(form.title);
  const excerptRef = useAutoResize(form.excerpt);
  const blocks = form.blocks ?? [];
  const catColor = CAT_COLORS[form.category] ?? "bg-gray-100 text-gray-700";

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">

      {/* ── Top bar ── */}
      <div className="flex items-center gap-3 border-b border-border bg-white px-4 py-3 shrink-0 shadow-sm">
        <button type="button" onClick={onClose}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted hover:text-foreground transition-colors">
          ← ยกเลิก
        </button>
        <div className="h-4 w-px bg-border" />
        <span className="text-sm font-semibold text-foreground truncate max-w-xs">
          {isEdit ? `แก้ไข: ${form.title || "ไม่มีชื่อ"}` : "เพิ่มข่าวใหม่"}
        </span>
        <div className="flex-1" />
        {(errors.title || errors.author) && (
          <span className="text-xs text-red-500 shrink-0">{errors.title || errors.author}</span>
        )}
        <select value={form.status} onChange={(e) => set("status", e.target.value)}
          className={`rounded-lg border px-3 py-1.5 text-sm font-semibold outline-none transition-colors ${STATUS_CONFIG[form.status]?.color ?? "bg-surface border-border text-foreground"}`}>
          <option value="draft">แบบร่าง</option>
          <option value="published">เผยแพร่</option>
          <option value="archived">เก็บถาวร</option>
        </select>
        <button type="button" onClick={handleSave}
          className="rounded-lg bg-primary px-5 py-1.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors">
          {isEdit ? "บันทึก" : "เผยแพร่"}
        </button>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ══ LEFT: Metadata only ══ */}
        <div className="w-64 shrink-0 border-r border-border overflow-y-auto bg-surface-muted/20">
          <div className="p-4 space-y-4">

            <p className="text-[10px] font-bold uppercase tracking-widest text-muted">ตั้งค่าบทความ</p>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">หมวดหมู่</label>
              <select value={form.category} onChange={(e) => set("category", e.target.value)}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
              <span className={`mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${catColor}`}>
                {form.category}
              </span>
            </div>

            {/* Author */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                ผู้เขียน / แหล่งข่าว
                {errors.author && <span className="ml-1.5 font-normal text-red-500">{errors.author}</span>}
              </label>
              <input value={form.author} onChange={(e) => set("author", e.target.value)}
                placeholder="เช่น ฝ่ายประชาสัมพันธ์ KOSEN"
                className={`w-full rounded-lg border px-3 py-2 text-sm outline-none bg-white ${errors.author ? "border-red-400" : "border-border focus:border-primary"}`} />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">แท็ก</label>
              <TagInput tags={form.tags} onChange={(v) => set("tags", v)} />
            </div>

            {/* Featured */}
            <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border bg-white p-2.5 hover:bg-surface-muted transition-colors">
              <input type="checkbox" checked={form.featured} onChange={(e) => set("featured", e.target.checked)}
                className="h-4 w-4 accent-primary" />
              <div>
                <p className="text-xs font-semibold text-foreground">ปักหมุด Featured</p>
                <p className="text-[10px] text-muted">แสดงในส่วนเด่นของหน้าแรก</p>
              </div>
            </label>

            {/* Publish date */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">วันที่เผยแพร่</label>
              <input
                type="date"
                value={form.publishedAt ?? ""}
                onChange={(e) => set("publishedAt", e.target.value)}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary"
              />
              {form.publishedAt && (
                <p className="mt-1 text-[11px] text-muted">
                  {new Date(form.publishedAt + "T00:00:00").toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              )}
            </div>

            {/* Block count hint */}
            {blocks.length > 0 && (
              <div className="rounded-lg border border-border bg-white p-3">
                <p className="text-xs font-semibold text-foreground mb-0.5">เนื้อหา</p>
                <p className="text-[11px] text-muted">{blocks.length} บล็อก</p>
                <p className="text-[10px] text-muted/60 mt-0.5">hover บล็อกเพื่อจัดการ ▲▼✕</p>
              </div>
            )}

          </div>
        </div>

        {/* ══ RIGHT: Editable article preview ══ */}
        <div className="flex-1 overflow-y-auto bg-slate-50">

          {/* Preview label bar */}
          <div className="sticky top-0 z-20 flex items-center gap-2 border-b border-slate-200 bg-slate-50/95 backdrop-blur-sm px-5 py-2">
            <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              👁 ตัวอย่างการแสดงผล (Preview)
            </span>
            <span className="text-xs text-muted">หน้าตาเหมือนที่ผู้ใช้จะเห็นจริงๆ</span>
          </div>

          {/* === Layout เหมือนหน้า /news/[id] จริงทุกอย่าง === */}
          <div className="w-full max-w-[1600px] mx-auto px-5 py-8">
            <div className="flex gap-6 items-start">

              {/* Main article */}
              <article className="flex-1 min-w-0 bg-white rounded-2xl shadow-sm border border-border">

                {/* Hero image */}
                <div>
                  <div className="overflow-hidden rounded-t-2xl">
                    <ImageInput
                      value={form.image}
                      onChange={(v) => set("image", v)}
                      aspectRatio={form.heroAspect !== "full" ? (form.heroAspect ?? "21/9") : "21/9"}
                      hint="รูปปก (Hero Image)"
                      objectPosition={form.imagePosition ?? "center"}
                      imageFull={(form.heroAspect ?? "21/9") === "full"}
                    />
                  </div>
                  {form.image && (
                    <div className="flex flex-wrap items-center gap-3 border-t border-border bg-slate-50/80 px-4 py-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-muted shrink-0">ขนาด:</span>
                        {HERO_SIZES.map(({ key, label }) => (
                          <button key={key} type="button"
                            onClick={() => set("heroAspect", key)}
                            className={`rounded px-2 py-0.5 text-[10px] font-semibold transition-colors ${
                              (form.heroAspect ?? "21/9") === key
                                ? "bg-primary text-white"
                                : "border border-border bg-white text-muted hover:border-primary hover:text-primary"
                            }`}>
                            {label}
                          </button>
                        ))}
                      </div>
                      {(form.heroAspect ?? "21/9") !== "full" && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-muted shrink-0">ตำแหน่ง:</span>
                          <PositionPicker value={form.imagePosition ?? "center"} onChange={(v) => set("imagePosition", v)} />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Content — overflow-visible so block toolbars can peek out left */}
                <div className="p-8 overflow-visible">

                  {/* Category badge */}
                  <div className="mb-5">
                    <span className={`rounded-full px-3.5 py-1 text-sm font-bold ${catColor}`}>
                      {form.category}
                    </span>
                  </div>

                  {/* Title */}
                  <div className="mb-5">
                    <textarea ref={titleRef} rows={1} value={form.title}
                      onChange={(e) => set("title", e.target.value)}
                      onKeyDown={(e) => handleTab(e, form.title, (v) => set("title", v))}
                      placeholder="หัวข้อข่าว..."
                      className={`w-full resize-none overflow-hidden bg-transparent text-3xl font-extrabold leading-tight tracking-tight text-foreground outline-none placeholder:text-foreground/20 md:text-4xl ${errors.title ? "placeholder:text-red-300" : ""}`} />
                    {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
                  </div>

                  {/* Meta row */}
                  <div className="mb-8 flex flex-wrap items-center gap-x-5 gap-y-1 border-b border-border pb-6">
                    <span className="flex items-center gap-1.5 text-sm text-muted">
                      <span className="text-base">✍️</span>
                      {form.author || <em className="not-italic text-muted/40">ชื่อผู้เขียน</em>}
                    </span>
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-muted">
                      <span className="text-base">📅</span>
                      {form.publishedAt
                        ? new Date(form.publishedAt + "T00:00:00").toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })
                        : todayThai()}
                    </span>
                    <span className="flex items-center gap-1.5 text-sm text-muted">
                      <span className="text-base">⏱️</span> {estimatedReadTime(form)} นาที
                    </span>
                  </div>

                  {/* Excerpt */}
                  {(form.excerpt !== undefined) && (
                    <div className="mb-8 border-l-4 border-primary pl-5">
                      <textarea ref={excerptRef} rows={2} value={form.excerpt}
                        onChange={(e) => set("excerpt", e.target.value)}
                        onKeyDown={(e) => handleTab(e, form.excerpt, (v) => set("excerpt", v))}
                        placeholder="บทนำข่าว..."
                        className="w-full resize-none overflow-hidden bg-transparent text-lg font-medium leading-relaxed text-foreground outline-none placeholder:text-foreground/25" />
                    </div>
                  )}

                  {/* Blocks */}
                  <div className="space-y-5">
                    <AddBlockRow onAdd={(type) => addBlock(type, -1)} />
                    {blocks.length === 0 && (
                      <div className="py-10 text-center">
                        <span className="text-4xl text-foreground/10">✍️</span>
                        <p className="mt-3 text-sm text-muted/40 italic">กดปุ่มด้านบนเพื่อเริ่มเพิ่มเนื้อหา</p>
                      </div>
                    )}
                    {blocks.map((block, index) => (
                      <div key={block.id}>
                        <ArticleBlock
                          block={block}
                          index={index}
                          total={blocks.length}
                          onUpdate={updateBlock}
                          onMove={moveBlock}
                          onDelete={deleteBlock}
                        />
                        <AddBlockRow onAdd={(type) => addBlock(type, index)} />
                      </div>
                    ))}
                  </div>

                  {/* Tags */}
                  {(form.tags ?? []).length > 0 && (
                    <div className="mt-10 flex flex-wrap items-center gap-2 border-t border-border pt-6">
                      <span className="text-xs text-muted">แท็ก:</span>
                      {(form.tags ?? []).map(tag => (
                        <span key={tag} className="rounded-full bg-surface-muted px-3 py-0.5 text-xs font-medium text-muted">#{tag}</span>
                      ))}
                    </div>
                  )}

                </div>
              </article>

              {/* Sidebar — static placeholder เหมือนหน้าจริง */}
              <aside className="hidden lg:block w-64 shrink-0">
                <div className="sticky top-16 rounded-2xl border border-border bg-white p-5">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-primary mb-1">ข่าวล่าสุด</h3>
                  <p className="text-xs text-muted mb-4">อัปเดตล่าสุดจากสถาบัน</p>
                  <div className="space-y-3">
                    {[1,2,3].map((i) => (
                      <div key={i} className="flex gap-3 items-start py-3 border-b border-border/60 last:border-0">
                        <div className="w-16 h-16 shrink-0 rounded-lg bg-slate-100" />
                        <div className="space-y-1.5 flex-1">
                          <div className="h-3 rounded bg-slate-100 w-16" />
                          <div className="h-3 rounded bg-slate-100 w-full" />
                          <div className="h-3 rounded bg-slate-100 w-3/4" />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 h-9 rounded-xl border border-border bg-slate-50" />
                </div>
              </aside>

            </div>

            {/* Back button */}
            <div className="mt-8">
              <span className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-5 py-3 text-sm font-semibold text-muted shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                กลับหน้าข่าวทั้งหมด
              </span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

// ── RenderBlock — read-only block renderer (used by NewsPreview) ──────────────

function RenderBlock({ block }) {
  switch (block.type) {
    case "paragraph": {
      const sizeCls = FONT_SIZES.find(s => s.key === (block.fontSize ?? "base"))?.cls ?? "text-base leading-8";
      return block.content
        ? <p className={`text-foreground/80 whitespace-pre-wrap ${sizeCls}`}>{block.content}</p>
        : null;
    }
    case "heading1":
      return block.content
        ? <h2 className="text-3xl font-extrabold text-foreground leading-tight">{block.content}</h2>
        : null;
    case "heading2":
      return block.content
        ? <h2 className="text-2xl font-extrabold text-foreground leading-tight">{block.content}</h2>
        : null;
    case "heading3":
      return block.content
        ? <h3 className="text-lg font-bold text-foreground leading-tight">{block.content}</h3>
        : null;
    case "heading4":
      return block.content
        ? <h4 className="text-base font-bold text-foreground leading-tight">{block.content}</h4>
        : null;
    case "image": {
      const imgSize = block.imageSize ?? "16/9";
      return block.src ? (
        <figure>
          {imgSize === "full" ? (
            <img src={block.src} alt={block.alt || ""} className="w-full h-auto rounded-2xl block" />
          ) : (
            <div className="relative w-full overflow-hidden rounded-2xl" style={{ aspectRatio: imgSize }}>
              <img src={block.src} alt={block.alt || ""} className="h-full w-full object-cover"
                style={{ objectPosition: block.objectPosition ?? "center" }} />
            </div>
          )}
          {block.caption && (
            <figcaption className="mt-2 text-center text-xs text-muted">{block.caption}</figcaption>
          )}
        </figure>
      ) : null;
    }
    case "spacer":
      return <div className="h-6" />;
    default:
      return null;
  }
}

// ── NewsPreview — full-screen read-only article view ──────────────────────────

export function NewsPreview({ item, onClose, onEdit }) {
  const { news: allNews } = useNews();
  const sidebarNews = useMemo(() => publishedNews(allNews).slice(0, 8), [allNews]);

  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  const catColor = CAT_COLORS[item.category] ?? "bg-gray-100 text-gray-700";
  const statusCfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.draft;
  const blocks = item.blocks ?? [];
  const readMin = estimatedReadTime(item);
  const dateStr = item.publishedAt
    ? new Date(item.publishedAt + "T00:00:00").toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })
    : todayThai();

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">

      {/* ── Top bar ── */}
      <div className="flex items-center gap-3 border-b border-border bg-white px-4 py-3 shrink-0 shadow-sm">
        <button type="button" onClick={onClose}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted hover:text-foreground transition-colors">
          ← ปิด
        </button>
        <div className="h-4 w-px bg-border" />
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusCfg.color}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
          {statusCfg.label}
        </span>
        <span className="text-sm font-semibold text-foreground truncate max-w-sm">{item.title}</span>
        <div className="flex-1" />
        {onEdit && (
          <button type="button" onClick={() => { onClose(); onEdit(item); }}
            className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-1.5 text-sm font-medium text-muted hover:border-primary hover:text-primary transition-colors">
            ✏️ แก้ไข
          </button>
        )}
      </div>

      {/* ── Page body ── */}
      <div className="flex-1 overflow-y-auto bg-slate-50">

        {/* Preview banner */}
        <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-slate-200 bg-slate-50/95 backdrop-blur-sm px-5 py-2">
          <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            👁 ตัวอย่างการแสดงผล (Preview)
          </span>
          <span className="text-xs text-muted">หน้าตาที่ผู้ใช้งานจะเห็นเมื่อเผยแพร่แล้ว</span>
        </div>

        {/* Content — matches public page layout exactly */}
        <div className="w-full max-w-[1600px] mx-auto px-5 md:px-10 py-8">
          <div className="flex gap-6 items-start">

            {/* ── Main article ── */}
            <article className="flex-1 min-w-0 bg-white rounded-2xl shadow-sm border border-border overflow-hidden">

              {/* Hero image */}
              {item.image && (() => {
                const ha = item.heroAspect ?? "21/9";
                return ha === "full" ? (
                  <img src={item.image} alt={item.title} className="w-full h-auto block" />
                ) : (
                  <div className="relative w-full overflow-hidden" style={{ aspectRatio: ha, minHeight: "200px" }}>
                    <img src={item.image} alt={item.title} className="h-full w-full object-cover"
                      style={{ objectPosition: item.imagePosition ?? "center" }} />
                  </div>
                );
              })()}

              <div className="p-8 lg:p-10">
                {/* Category + Headline */}
                <div className="mb-5">
                  <span className={`rounded-full px-3.5 py-1 text-sm font-bold ${catColor}`}>
                    {item.category}
                  </span>
                  <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-foreground md:text-4xl">
                    {item.title}
                  </h1>
                </div>

                {/* Meta */}
                <div className="mb-8 flex flex-wrap items-center gap-x-5 gap-y-1 border-b border-border pb-6">
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-muted">
                    <span className="text-base">✍️</span> {item.author || "—"}
                  </span>
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-muted">
                    <span className="text-base">📅</span> {dateStr}
                  </span>
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-muted">
                    <span className="text-base">⏱️</span> {readMin} นาที
                  </span>
                </div>

                {/* Excerpt */}
                {item.excerpt && (
                  <p className="mb-8 border-l-4 border-primary pl-5 text-lg font-medium leading-relaxed text-foreground">
                    {item.excerpt}
                  </p>
                )}

                {/* Body blocks */}
                {blocks.length > 0 && (
                  <div className="space-y-5">
                    {blocks.map(b => <RenderBlock key={b.id} block={b} />)}
                  </div>
                )}

                {/* Tags */}
                {(item.tags ?? []).length > 0 && (
                  <div className="mt-10 flex flex-wrap items-center gap-2 border-t border-border pt-6">
                    <span className="text-xs text-muted">แท็ก:</span>
                    {(item.tags ?? []).map(tag => (
                      <span key={tag} className="rounded-full bg-surface-muted px-3 py-0.5 text-xs font-medium text-muted">#{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </article>

            {/* ── Sidebar ── */}
            <aside className="w-64 shrink-0">
              <div className="sticky top-6 rounded-2xl border border-border bg-white p-5">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-primary mb-1">ข่าวล่าสุด</h3>
                <p className="text-xs text-muted mb-4">อัปเดตล่าสุดจากสถาบัน</p>
                <div className="flex flex-col">
                  {sidebarNews.map((n) => {
                    const isActive = n.id === item.id;
                    const nc = CAT_COLORS[n.category] ?? "bg-gray-100 text-gray-700";
                    return (
                      <div key={n.id}
                        className={`flex gap-3 items-start py-3 border-b border-border/60 last:border-0 rounded-lg px-2 -mx-2 ${isActive ? "bg-primary/5" : ""}`}>
                        {n.image && (
                          <div className="w-16 h-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                            <img src={n.image} alt={n.title} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex flex-col gap-1 min-w-0">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold w-fit ${nc}`}>{n.category}</span>
                          <p className={`text-sm font-semibold leading-snug line-clamp-2 ${isActive ? "text-primary" : "text-foreground"}`}>
                            {n.title}
                          </p>
                          <time className="text-[11px] text-muted">{formatDate(n.publishedAt)}</time>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-border py-2.5 text-xs font-semibold text-muted">
                  ดูข่าวทั้งหมด →
                </div>
              </div>
            </aside>

          </div>

          {/* Back button — bottom */}
          <div className="mt-8">
            <span className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-5 py-3 text-sm font-semibold text-muted shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              กลับหน้าข่าวทั้งหมด
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
