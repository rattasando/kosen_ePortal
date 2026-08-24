"use client";

import { useState } from "react";
import { useNewsCategory } from "./contexts/NewsCategoryContext";

// ── Preset color options ──────────────────────────────────────────
const COLOR_PRESETS = [
  { label: "น้ำเงิน",    value: "bg-blue-100 text-blue-700",     dot: "bg-blue-500" },
  { label: "ม่วง",      value: "bg-violet-100 text-violet-700",  dot: "bg-violet-500" },
  { label: "ชมพู",      value: "bg-pink-100 text-pink-700",      dot: "bg-pink-500" },
  { label: "แดง",       value: "bg-rose-100 text-rose-700",      dot: "bg-rose-500" },
  { label: "ส้ม",       value: "bg-orange-100 text-orange-700",  dot: "bg-orange-500" },
  { label: "เหลือง",    value: "bg-yellow-100 text-yellow-700",  dot: "bg-yellow-500" },
  { label: "เขียวอ่อน", value: "bg-lime-100 text-lime-700",      dot: "bg-lime-500" },
  { label: "เขียว",     value: "bg-emerald-100 text-emerald-700",dot: "bg-emerald-500" },
  { label: "เทอร์ควอยซ์", value: "bg-teal-100 text-teal-700",   dot: "bg-teal-500" },
  { label: "ฟ้า",       value: "bg-sky-100 text-sky-700",        dot: "bg-sky-500" },
  { label: "คราม",      value: "bg-indigo-100 text-indigo-700",  dot: "bg-indigo-500" },
  { label: "เทา",       value: "bg-slate-100 text-slate-700",    dot: "bg-slate-500" },
];

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
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

const inputCls = "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-accent-soft placeholder:text-muted";

function emptyForm() {
  return { name: "", color: COLOR_PRESETS[0].value };
}

// ── ColorPicker ───────────────────────────────────────────────────
function ColorPicker({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {COLOR_PRESETS.map((p) => (
        <button
          key={p.value}
          type="button"
          title={p.label}
          onClick={() => onChange(p.value)}
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${p.value} ${
            value === p.value
              ? "ring-2 ring-offset-1 ring-current scale-105"
              : "opacity-60 hover:opacity-100"
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${p.dot}`} />
          {p.label}
        </button>
      ))}
    </div>
  );
}

// ── CategoryForm (add / edit) ────────────────────────────────────
function CategoryForm({ initial, onSave, onCancel, title }) {
  const [form, setForm] = useState(initial ?? emptyForm());
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border bg-surface p-5">
      <p className="text-sm font-semibold text-foreground">{title}</p>

      <div className="space-y-1">
        <label className="text-xs font-medium text-foreground">ชื่อหมวดหมู่</label>
        <input
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="เช่น ประกาศ, กิจกรรม..."
          maxLength={100}
          required
          className={inputCls}
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-foreground">สี</label>
        <ColorPicker value={form.color} onChange={(c) => setForm((f) => ({ ...f, color: c }))} />
        <div className="flex items-center gap-2 pt-1">
          <span className="text-xs text-muted">ตัวอย่าง:</span>
          <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${form.color}`}>
            {form.name || "ชื่อหมวดหมู่"}
          </span>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onCancel}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors">
          ยกเลิก
        </button>
        <button type="submit" disabled={saving || !form.name.trim()}
          className="btn-primary disabled:opacity-50">
          {saving ? "กำลังบันทึก..." : "บันทึก"}
        </button>
      </div>
    </form>
  );
}

// ── Main ─────────────────────────────────────────────────────────
export default function NewsCategoriesListClient() {
  const { categories, ready, addCategory, updateCategory, deleteCategory } = useNewsCategory();
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-foreground">หมวดหมู่ข่าว</h2>
          <p className="text-xs text-muted mt-0.5">{categories.length} หมวดหมู่</p>
        </div>
        {!showAdd && (
          <button onClick={() => setShowAdd(true)} className="btn-primary">
            + เพิ่มหมวดหมู่
          </button>
        )}
      </div>

      {/* Add form */}
      {showAdd && (
        <CategoryForm
          title="เพิ่มหมวดหมู่ใหม่"
          onSave={async (form) => {
            await addCategory(form);
            setShowAdd(false);
          }}
          onCancel={() => setShowAdd(false)}
        />
      )}

      {/* List */}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-muted">
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted">ID</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted">หมวดหมู่</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted">ตัวอย่าง Badge</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted">ลำดับ</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {categories.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-16 text-center text-sm text-muted">
                  ยังไม่มีหมวดหมู่ — กด "เพิ่มหมวดหมู่" เพื่อเริ่มต้น
                </td>
              </tr>
            ) : categories.map((cat) => (
              <tr key={cat.id} className="hover:bg-surface-muted/60 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-muted">{cat.id}</td>
                <td className="px-4 py-3 font-semibold text-foreground">{cat.name}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${cat.color}`}>
                    {cat.name}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-muted">{cat.order}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      title="แก้ไข"
                      onClick={() => setEditId(cat.id)}
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
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit inline form (below the row — simple approach: separate modal-like card) */}
      {editId && (() => {
        const cat = categories.find((c) => c.id === editId);
        if (!cat) return null;
        return (
          <CategoryForm
            key={editId}
            title={`แก้ไขหมวดหมู่ — ${cat.name}`}
            initial={{ name: cat.name, color: cat.color }}
            onSave={async (form) => {
              await updateCategory(editId, { ...form, order: cat.order });
              setEditId(null);
            }}
            onCancel={() => setEditId(null)}
          />
        );
      })()}

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setDeleteTarget(null); }}>
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
              <button onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors">
                ยกเลิก
              </button>
              <button onClick={async () => { await deleteCategory(deleteTarget.id); setDeleteTarget(null); }}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 transition-colors">
                ลบหมวดหมู่
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
