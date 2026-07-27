"use client";

import { useState, useCallback, useRef, useEffect } from "react";

// ── Block type definitions ─────────────────────────────────────────────────

const BLOCK_TYPES = [
  { type: "paragraph", label: "ย่อหน้า",          icon: "¶",  desc: "ข้อความทั่วไป" },
  { type: "heading2",  label: "หัวข้อใหญ่ (H2)",  icon: "H2", desc: "หัวข้อหลัก" },
  { type: "heading3",  label: "หัวข้อย่อย (H3)",  icon: "H3", desc: "หัวข้อรอง" },
  { type: "image",     label: "รูปภาพ",            icon: "🖼", desc: "แทรกรูปจาก URL" },
  { type: "spacer",    label: "เว้นวรรค",          icon: "↕",  desc: "เพิ่มช่องว่าง" },
];

function uid() { return Math.random().toString(36).slice(2, 9); }
export function makeBlock(type) {
  return { id: uid(), type, content: "", src: "", alt: "", caption: "" };
}

// ── Preview: render one block ──────────────────────────────────────────────

function BlockView({ block }) {
  switch (block.type) {
    case "heading2":
      return (
        <h2 className="text-2xl font-extrabold text-foreground leading-tight">
          {block.content || <em className="font-normal text-base text-muted">หัวข้อ H2 ว่าง</em>}
        </h2>
      );
    case "heading3":
      return (
        <h3 className="text-lg font-bold text-foreground leading-tight">
          {block.content || <em className="font-normal text-sm text-muted">หัวข้อ H3 ว่าง</em>}
        </h3>
      );
    case "paragraph":
      return block.content
        ? <p className="text-sm leading-loose text-foreground whitespace-pre-wrap">{block.content}</p>
        : <p className="text-sm italic text-muted">ย่อหน้าว่าง</p>;
    case "image":
      return (
        <figure>
          {block.src
            ? <img src={block.src} alt={block.alt || ""} className="w-full max-h-80 object-cover rounded-xl border border-border" />
            : <div className="flex h-28 items-center justify-center rounded-xl border-2 border-dashed border-border text-xs text-muted">ยังไม่มี URL รูปภาพ</div>
          }
          {block.caption && (
            <figcaption className="mt-1.5 text-center text-xs text-muted">{block.caption}</figcaption>
          )}
        </figure>
      );
    case "spacer":
      return <div className="flex items-center gap-2 py-2"><div className="flex-1 border-t border-dashed border-border/60" /><span className="text-[10px] text-muted/50 shrink-0 select-none">เว้นวรรค</span><div className="flex-1 border-t border-dashed border-border/60" /></div>;
    default:
      return null;
  }
}

// ── Add block menu ─────────────────────────────────────────────────────────

function AddBlockMenu({ onAdd }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative flex justify-center py-1" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-dashed border-border text-lg leading-none text-muted hover:border-primary hover:text-primary transition-colors"
        title="เพิ่มบล็อก">
        +
      </button>
      {open && (
        <div className="absolute top-full mt-1 z-20 w-52 rounded-xl border border-border bg-surface shadow-xl overflow-hidden">
          {BLOCK_TYPES.map((t) => (
            <button
              key={t.type}
              type="button"
              onClick={() => { onAdd(t.type); setOpen(false); }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-surface-muted">
              <span className="w-7 shrink-0 rounded-md bg-primary/10 py-0.5 text-center text-[11px] font-bold text-primary">{t.icon}</span>
              <div>
                <p className="text-sm font-medium text-foreground">{t.label}</p>
                <p className="text-[11px] text-muted">{t.desc}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Single block editor ────────────────────────────────────────────────────

const fieldCls = "w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-accent-soft placeholder:text-muted";

function BlockItem({ block, index, total, onUpdate, onMove, onDelete }) {
  const typeInfo = BLOCK_TYPES.find((t) => t.type === block.type);

  return (
    <div className="rounded-xl border border-border bg-surface shadow-sm">
      {/* Block toolbar */}
      <div className="flex items-center gap-2 border-b border-border bg-surface-muted/60 px-3 py-1.5 rounded-t-xl">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
          <span>{typeInfo?.icon}</span> {typeInfo?.label}
        </span>
        <div className="flex-1" />
        <button type="button" disabled={index === 0} onClick={() => onMove(index, -1)} title="ขึ้น"
          className="flex h-6 w-6 items-center justify-center rounded text-xs text-muted hover:bg-surface hover:text-foreground disabled:opacity-30 transition-colors">▲</button>
        <button type="button" disabled={index === total - 1} onClick={() => onMove(index, 1)} title="ลง"
          className="flex h-6 w-6 items-center justify-center rounded text-xs text-muted hover:bg-surface hover:text-foreground disabled:opacity-30 transition-colors">▼</button>
        <div className="h-4 w-px bg-border mx-0.5" />
        <button type="button" onClick={() => onDelete(index)} title="ลบบล็อก"
          className="flex h-6 w-6 items-center justify-center rounded text-xs text-muted hover:bg-red-50 hover:text-red-500 transition-colors">✕</button>
      </div>

      {/* Block content editor */}
      <div className="p-3">
        {block.type === "paragraph" && (
          <textarea
            value={block.content}
            onChange={(e) => onUpdate(index, "content", e.target.value)}
            rows={4}
            placeholder="พิมพ์ข้อความย่อหน้า..."
            className={`${fieldCls} resize-y min-h-[80px]`}
          />
        )}

        {block.type === "heading2" && (
          <input
            value={block.content}
            onChange={(e) => onUpdate(index, "content", e.target.value)}
            placeholder="หัวข้อใหญ่..."
            className={`${fieldCls} text-xl font-extrabold`}
          />
        )}

        {block.type === "heading3" && (
          <input
            value={block.content}
            onChange={(e) => onUpdate(index, "content", e.target.value)}
            placeholder="หัวข้อย่อย..."
            className={`${fieldCls} text-base font-bold`}
          />
        )}

        {block.type === "image" && (
          <div className="space-y-2">
            <input
              value={block.src}
              onChange={(e) => onUpdate(index, "src", e.target.value)}
              placeholder="URL รูปภาพ (https://... หรือ /images/...)"
              className={fieldCls}
            />
            {block.src && (
              <img src={block.src} alt={block.alt || ""} className="h-32 w-full rounded-lg border border-border object-cover" />
            )}
            <div className="grid grid-cols-2 gap-2">
              <input
                value={block.alt}
                onChange={(e) => onUpdate(index, "alt", e.target.value)}
                placeholder="Alt text (SEO)"
                className={`${fieldCls} text-xs`}
              />
              <input
                value={block.caption}
                onChange={(e) => onUpdate(index, "caption", e.target.value)}
                placeholder="Caption (ใต้รูป)"
                className={`${fieldCls} text-xs`}
              />
            </div>
          </div>
        )}

        {block.type === "spacer" && (
          <div className="flex items-center justify-center py-3">
            <div className="flex-1 border-t-2 border-dashed border-border/40" />
            <span className="mx-3 text-xs text-muted select-none">เว้นวรรค</span>
            <div className="flex-1 border-t-2 border-dashed border-border/40" />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main BlockEditor export ────────────────────────────────────────────────

export default function BlockEditor({ blocks, onChange }) {
  const [preview, setPreview] = useState(false);

  const addBlock = useCallback((type, afterIndex) => {
    const next = [...blocks];
    const insertAt = afterIndex === undefined ? next.length : afterIndex + 1;
    next.splice(insertAt, 0, makeBlock(type));
    onChange(next);
  }, [blocks, onChange]);

  const updateBlock = useCallback((index, key, value) => {
    onChange(blocks.map((b, i) => i === index ? { ...b, [key]: value } : b));
  }, [blocks, onChange]);

  const deleteBlock = useCallback((index) => {
    onChange(blocks.filter((_, i) => i !== index));
  }, [blocks, onChange]);

  const moveBlock = useCallback((index, dir) => {
    const next = [...blocks];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }, [blocks, onChange]);

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-3 flex items-center gap-2">
        <span className="text-xs text-muted">{blocks.length} บล็อก</span>
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setPreview((v) => !v)}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-semibold transition-colors ${
            preview
              ? "border-primary bg-primary text-white"
              : "border-border text-muted hover:border-primary hover:text-primary"
          }`}>
          {preview ? "✏️ แก้ไข" : "👁 พรีวิว"}
        </button>
      </div>

      {preview ? (
        /* ── Preview mode ── */
        <div className="min-h-24 rounded-xl border border-border bg-white p-6 space-y-4">
          {blocks.length === 0
            ? <p className="text-center text-sm text-muted italic">ยังไม่มีบล็อก — กลับไปแก้ไขเพื่อเพิ่มเนื้อหา</p>
            : blocks.map((b) => <BlockView key={b.id} block={b} />)
          }
        </div>
      ) : (
        /* ── Edit mode ── */
        <div>
          {blocks.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-border py-10 text-center space-y-3">
              <p className="text-sm text-muted">ยังไม่มีบล็อก</p>
              <AddBlockMenu onAdd={(type) => addBlock(type)} />
            </div>
          ) : (
            <div>
              {blocks.map((block, index) => (
                <div key={block.id}>
                  <BlockItem
                    block={block}
                    index={index}
                    total={blocks.length}
                    onUpdate={updateBlock}
                    onMove={moveBlock}
                    onDelete={deleteBlock}
                  />
                  <AddBlockMenu onAdd={(type) => addBlock(type, index)} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
