"use client";

import { useState } from "react";
import { useNewsCategory } from "./contexts/NewsCategoryContext";

// ── Preset color options ──────────────────────────────────────────
const COLOR_PRESETS = [
  { label: "น้ำเงิน",       value: "bg-blue-100 text-blue-700",      dot: "bg-blue-500" },
  { label: "ม่วง",          value: "bg-violet-100 text-violet-700",   dot: "bg-violet-500" },
  { label: "ชมพู",          value: "bg-pink-100 text-pink-700",       dot: "bg-pink-500" },
  { label: "แดง",           value: "bg-rose-100 text-rose-700",       dot: "bg-rose-500" },
  { label: "ส้ม",           value: "bg-orange-100 text-orange-700",   dot: "bg-orange-500" },
  { label: "เหลือง",        value: "bg-yellow-100 text-yellow-700",   dot: "bg-yellow-500" },
  { label: "เขียวอ่อน",    value: "bg-lime-100 text-lime-700",       dot: "bg-lime-500" },
  { label: "เขียว",         value: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  { label: "เทอร์ควอยซ์",  value: "bg-teal-100 text-teal-700",       dot: "bg-teal-500" },
  { label: "ฟ้า",           value: "bg-sky-100 text-sky-700",         dot: "bg-sky-500" },
  { label: "คราม",          value: "bg-indigo-100 text-indigo-700",   dot: "bg-indigo-500" },
  { label: "เทา",           value: "bg-slate-100 text-slate-700",     dot: "bg-slate-500" },
];

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);
const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);
const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const inputCls = "rounded-lg border border-border bg-surface px-3 py-1.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-accent-soft placeholder:text-muted";

// ── ColorPicker (compact — dots only) ────────────────────────────
function ColorPicker({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {COLOR_PRESETS.map((p) => (
        <button
          key={p.value}
          type="button"
          title={p.label}
          onClick={() => onChange(p.value)}
          className={`flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-semibold transition-all ${p.value} ${
            value === p.value
              ? "ring-2 ring-offset-1 ring-current scale-105"
              : "opacity-50 hover:opacity-90"
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${p.dot}`} />
          {p.label}
        </button>
      ))}
    </div>
  );
}

// ── Inline edit row ───────────────────────────────────────────────
function EditRow({ cat, onSave, onCancel }) {
  const [name,    setName]    = useState(cat.name);
  const [color,   setColor]   = useState(cat.color);
  const [saving,  setSaving]  = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await onSave({ name: name.trim(), color, order: cat.order });
    setSaving(false);
  };

  return (
    <tr className="bg-accent-soft/30 border-y-2 border-primary/20">
      <td colSpan={3} className="px-4 py-3">
        <div className="space-y-3">
          {/* Name + preview */}
          <div className="flex items-center gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") onCancel(); }}
              autoFocus
              maxLength={100}
              placeholder="ชื่อหมวดหมู่"
              className={`${inputCls} w-48`}
            />
            <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${color}`}>
              {name || "ตัวอย่าง"}
            </span>
          </div>
          {/* Color picker */}
          <ColorPicker value={color} onChange={setColor} />
          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              <CheckIcon />
              {saving ? "กำลังบันทึก..." : "บันทึก"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground transition-colors"
            >
              <XIcon />
              ยกเลิก
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
}

// ── AddRow (แถวสุดท้ายสำหรับเพิ่ม) ───────────────────────────────
function AddRow({ onSave, onCancel }) {
  const [name,   setName]   = useState("");
  const [color,  setColor]  = useState(COLOR_PRESETS[0].value);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await onSave({ name: name.trim(), color });
    setSaving(false);
  };

  return (
    <tr className="bg-emerald-50/40 border-y-2 border-emerald-200/60">
      <td colSpan={3} className="px-4 py-3">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") onCancel(); }}
              autoFocus
              maxLength={100}
              placeholder="ชื่อหมวดหมู่ใหม่..."
              className={`${inputCls} w-48`}
            />
            <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${color}`}>
              {name || "ตัวอย่าง"}
            </span>
          </div>
          <ColorPicker value={color} onChange={setColor} />
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              <CheckIcon />
              {saving ? "กำลังบันทึก..." : "เพิ่ม"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground transition-colors"
            >
              <XIcon />
              ยกเลิก
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
}

// ── Main ─────────────────────────────────────────────────────────
export default function NewsCategoriesListClient() {
  const { categories, ready, addCategory, updateCategory, deleteCategory } = useNewsCategory();
  const [showAdd,      setShowAdd]      = useState(false);
  const [editId,       setEditId]       = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  if (!ready) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-muted">
        <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        กำลังโหลด...
      </div>
    );
  }

  return (
    <div className="space-y-4 p-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted">{categories.length} หมวดหมู่</p>
        {!showAdd && !editId && (
          <button onClick={() => setShowAdd(true)} className="btn-primary text-xs px-3 py-1.5">
            + เพิ่มหมวดหมู่
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-muted">
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted">ชื่อหมวดหมู่</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted">Badge</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted w-20"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {categories.length === 0 && !showAdd ? (
              <tr>
                <td colSpan={3} className="py-12 text-center text-sm text-muted">
                  ยังไม่มีหมวดหมู่ — กด "+ เพิ่มหมวดหมู่" เพื่อเริ่มต้น
                </td>
              </tr>
            ) : categories.map((cat) =>
              editId === cat.id ? (
                <EditRow
                  key={cat.id}
                  cat={cat}
                  onSave={async (form) => {
                    await updateCategory(cat.id, form);
                    setEditId(null);
                  }}
                  onCancel={() => setEditId(null)}
                />
              ) : (
                <tr key={cat.id} className="hover:bg-surface-muted/60 transition-colors">
                  <td className="px-4 py-3 font-semibold text-foreground">{cat.name}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${cat.color}`}>
                      {cat.name}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        title="แก้ไข"
                        onClick={() => { setEditId(cat.id); setShowAdd(false); }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted hover:border-amber-400 hover:text-amber-500 transition-colors"
                      >
                        <EditIcon />
                      </button>
                      <button
                        title="ลบ"
                        onClick={() => setDeleteTarget(cat)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted hover:border-red-400 hover:text-red-500 transition-colors"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            )}

            {/* Add row — แสดงท้ายตาราง */}
            {showAdd && (
              <AddRow
                onSave={async (form) => {
                  await addCategory(form);
                  setShowAdd(false);
                }}
                onCancel={() => setShowAdd(false)}
              />
            )}
          </tbody>
        </table>
      </div>

      {/* Delete confirm */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setDeleteTarget(null); }}
        >
          <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-2xl">
            <h3 className="text-base font-bold text-foreground">ยืนยันการลบ</h3>
            <p className="mt-2 text-sm text-muted">
              ต้องการลบหมวดหมู่{" "}
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${deleteTarget.color}`}>
                {deleteTarget.name}
              </span>{" "}
              ใช่หรือไม่? ข่าวที่อยู่ในหมวดนี้จะยังคงอยู่ แต่จะไม่แสดงสีหมวดหมู่
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={async () => { await deleteCategory(deleteTarget.id); setDeleteTarget(null); }}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 transition-colors"
              >
                ลบหมวดหมู่
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
