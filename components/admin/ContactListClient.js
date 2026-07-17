"use client";

import { useState, useEffect, useRef } from "react";
import { useContact } from "./ContactContext";

const inputCls = "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-accent-soft placeholder:text-muted";
const labelCls = "text-xs font-medium text-foreground";

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);

const DragHandle = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
    <path d="M7 2a2 2 0 110 4 2 2 0 010-4zm6 0a2 2 0 110 4 2 2 0 010-4zM7 8a2 2 0 110 4 2 2 0 010-4zm6 0a2 2 0 110 4 2 2 0 010-4zM7 14a2 2 0 110 4 2 2 0 010-4zm6 0a2 2 0 110 4 2 2 0 010-4z" />
  </svg>
);

const COLOR_OPTIONS = [
  { value: "bg-blue-50 border-blue-200 text-blue-700",      dot: "bg-blue-500",   label: "น้ำเงิน" },
  { value: "bg-green-50 border-green-200 text-green-700",   dot: "bg-green-500",  label: "เขียว" },
  { value: "bg-violet-50 border-violet-200 text-violet-700", dot: "bg-violet-500", label: "ม่วง" },
  { value: "bg-amber-50 border-amber-200 text-amber-700",   dot: "bg-amber-500",  label: "ทอง" },
  { value: "bg-red-50 border-red-200 text-red-700",         dot: "bg-red-500",    label: "แดง" },
  { value: "bg-teal-50 border-teal-200 text-teal-700",      dot: "bg-teal-500",   label: "เขียวน้ำ" },
];

// ── Delete button ──
function DeleteButton({ onDelete }) {
  const [confirm, setConfirm] = useState(false);
  if (confirm) return (
    <span className="flex items-center gap-1.5">
      <button onClick={onDelete} className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-700 transition-colors">ยืนยัน</button>
      <button onClick={() => setConfirm(false)} className="rounded-lg border border-border px-2.5 py-1 text-xs text-muted hover:text-foreground transition-colors">ยกเลิก</button>
    </span>
  );
  return (
    <button onClick={() => setConfirm(true)} className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-200 text-red-400 hover:bg-red-50 transition-colors">
      <XIcon />
    </button>
  );
}

const SPAN_OPTS = [
  { value: 0.5, label: "½",  title: "½ ช่อง (12.5%)" },
  { value: 1,   label: "1",  title: "1 ช่อง (25%)" },
  { value: 1.5, label: "1½", title: "1½ ช่อง (37.5%)" },
  { value: 2,   label: "2",  title: "2 ช่อง (50%)" },
  { value: 2.5, label: "2½", title: "2½ ช่อง (62.5%)" },
  { value: 3,   label: "3",  title: "3 ช่อง (75%)" },
  { value: 3.5, label: "3½", title: "3½ ช่อง (87.5%)" },
  { value: 4,   label: "4",  title: "เต็มแถว (100%)" },
];
// grid-cols-8: span 0.5 → col-span-1, span 1 → col-span-2, … span 4 → col-span-8
const SPAN_CLASS = {
  0.5: "col-span-1", 1: "col-span-2", 1.5: "col-span-3", 2: "col-span-4",
  2.5: "col-span-5", 3: "col-span-6", 3.5: "col-span-7", 4: "col-span-8",
};

// ── Size picker (dropdown) ──
function SizeToggle({ span, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = SPAN_OPTS.find((o) => o.value === (span ?? 1)) ?? SPAN_OPTS[1];

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title="ปรับขนาด"
        className={`flex h-7 items-center gap-1 rounded-lg border px-2 text-xs font-bold transition-colors ${open ? "border-primary bg-primary text-white" : "border-border text-muted hover:border-primary hover:text-primary"}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 4a1 1 0 000 2h14a1 1 0 100-2H3zm0 4a1 1 0 000 2h10a1 1 0 100-2H3zm0 4a1 1 0 000 2h6a1 1 0 100-2H3z" clipRule="evenodd" />
        </svg>
        {current.label}
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-50 rounded-xl border border-border bg-surface shadow-xl p-1.5 min-w-[7rem]">
          <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted">ขนาด card</p>
          <div className="grid grid-cols-4 gap-0.5">
            {SPAN_OPTS.map((o) => (
              <button
                key={o.value}
                onClick={() => { onChange(o.value); setOpen(false); }}
                title={o.title}
                className={`rounded-lg py-1 text-xs font-bold transition-colors ${(span ?? 1) === o.value ? "bg-primary text-white" : "text-muted hover:bg-surface-muted hover:text-foreground"}`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Section Header ──
function SectionHeader({ title, desc, onAdd }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        <p className="text-xs text-muted">{desc}</p>
      </div>
      <button onClick={onAdd} className="btn-primary text-xs px-3 py-1.5">+ เพิ่ม</button>
    </div>
  );
}

// ── Drag-sortable wrapper ──
function useDrag(items, onReorder) {
  const dragIdx = useRef(null);
  const [overIdx, setOverIdx] = useState(null);

  const dragProps = (idx) => ({
    draggable: true,
    onDragStart: () => { dragIdx.current = idx; },
    onDragOver: (e) => { e.preventDefault(); setOverIdx(idx); },
    onDragLeave: () => setOverIdx(null),
    onDrop: (e) => {
      e.preventDefault();
      if (dragIdx.current !== null && dragIdx.current !== idx) {
        onReorder(dragIdx.current, idx);
      }
      dragIdx.current = null;
      setOverIdx(null);
    },
    onDragEnd: () => { dragIdx.current = null; setOverIdx(null); },
  });

  return { dragProps, overIdx };
}

// ══════════════════════════════
//  MAIN OFFICE SECTION
// ══════════════════════════════
function MainInfoModal({ item, onClose, onSave }) {
  const isEdit = !!item;
  const [form, setForm] = useState(
    item ? { ...item, linesText: item.lines.join("\n") } :
    { id: "", icon: "📌", label: "", linesText: "", href: "", span: 1 }
  );

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSave = () => {
    if (!form.label.trim()) return;
    onSave({ ...form, lines: form.linesText.split("\n").map((l) => l.trim()).filter(Boolean) });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <p className="text-sm font-semibold text-foreground">{isEdit ? "แก้ไขข้อมูลติดต่อ" : "เพิ่มข้อมูลติดต่อ"}</p>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-surface-muted transition-colors"><XIcon /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={`mb-1 block ${labelCls}`}>ไอคอน</label>
              <input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} className={inputCls} placeholder="📍" />
            </div>
            <div className="col-span-2">
              <label className={`mb-1 block ${labelCls}`}>ชื่อหัวข้อ <span className="text-red-500">*</span></label>
              <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className={inputCls} placeholder="เช่น โทรศัพท์" />
            </div>
          </div>
          <div>
            <label className={`mb-1 block ${labelCls}`}>เนื้อหา (แต่ละบรรทัด = 1 ข้อความ)</label>
            <textarea value={form.linesText} onChange={(e) => setForm({ ...form, linesText: e.target.value })}
              rows={3} className={`${inputCls} resize-none`} placeholder={"เนื้อหาบรรทัดที่ 1\nเนื้อหาบรรทัดที่ 2"} />
          </div>
          <div>
            <label className={`mb-1 block ${labelCls}`}>ลิงก์ (href) — ไม่บังคับ</label>
            <input value={form.href} onChange={(e) => setForm({ ...form, href: e.target.value })} className={inputCls} placeholder="tel:... หรือ mailto:..." />
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm text-muted hover:text-foreground transition-colors">ยกเลิก</button>
          <button onClick={handleSave} className="btn-primary">{isEdit ? "บันทึก" : "เพิ่ม"}</button>
        </div>
      </div>
    </div>
  );
}

function MainInfoSection() {
  const { main, addMainItem, updateMainItem, deleteMainItem, reorderMain } = useContact();
  const [modal, setModal] = useState(null);
  const { dragProps, overIdx } = useDrag(main, reorderMain);

  const nextId = () => {
    const nums = main.map((i) => parseInt(i.id.replace("C", ""), 10)).filter(Boolean);
    return `C${String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3, "0")}`;
  };

  const handleSave = (form) => {
    if (modal?.item) updateMainItem(modal.item.id, form);
    else addMainItem({ ...form, id: nextId() });
  };

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 space-y-4">
      <SectionHeader title="ข้อมูลสำนักงานกลาง" desc="ที่อยู่ โทรศัพท์ อีเมล และเวลาทำการ" onAdd={() => setModal({})} />
      <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">⚠️ Preview นี้แคบกว่าหน้าจริงเนื่องจาก sidebar — ถ้า text ตกบรรทัดในหน้าจริง ให้เพิ่มขนาด card</p>
      <div className="grid gap-5 grid-cols-8">
        {main.map((item, idx) => {
          const span = item.span ?? 1;
          return (
            <div
              key={item.id}
              {...dragProps(idx)}
              className={`relative rounded-xl border p-6 transition-all select-none flex flex-col gap-2 ${overIdx === idx ? "border-primary bg-accent-soft/30" : "border-border"} ${SPAN_CLASS[span] ?? "col-span-2"}`}
            >
              {/* top toolbar */}
              <div className="flex items-center justify-between gap-2">
                <div className="cursor-grab text-muted active:cursor-grabbing"><DragHandle /></div>
                <div className="flex items-center gap-1">
                  <SizeToggle span={span} onChange={(s) => updateMainItem(item.id, { span: s })} />
                  <button onClick={() => setModal({ item })} className="rounded-lg border border-border px-2.5 py-1 text-xs text-muted hover:border-primary hover:text-primary transition-colors">แก้ไข</button>
                  <DeleteButton onDelete={() => deleteMainItem(item.id)} />
                </div>
              </div>
              {/* preview — ตรงกับ public/contact */}
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-2xl">
                {item.icon}
              </div>
              <p className="text-sm font-semibold uppercase tracking-wide text-muted mb-1">{item.label}</p>
              {item.href ? (
                <a href={item.href} className="font-medium text-primary hover:underline text-base leading-relaxed"
                  {...(item.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                  {item.lines[0]}
                </a>
              ) : (
                <div className="space-y-0.5">
                  {item.lines.map((line, i) => (
                    <p key={i} className="text-base font-medium text-foreground leading-relaxed">{line}</p>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {modal !== null && <MainInfoModal item={modal.item} onClose={() => setModal(null)} onSave={handleSave} />}
    </div>
  );
}

// ══════════════════════════════
//  UNIVERSITIES SECTION
// ══════════════════════════════
function UniversityModal({ item, onClose, onSave }) {
  const isEdit = !!item;
  const [form, setForm] = useState(
    item ? { ...item } :
    { id: "", name: "", fullName: "", location: "", phone: "", email: "", color: COLOR_OPTIONS[0].value, dot: COLOR_OPTIONS[0].dot, span: 1 }
  );

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSave = () => {
    if (!form.name.trim() || !form.fullName.trim()) return;
    onSave(form);
    onClose();
  };

  const selectedColor = COLOR_OPTIONS.find((c) => c.value === form.color) ?? COLOR_OPTIONS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-lg rounded-2xl border border-border bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <p className="text-sm font-semibold text-foreground">{isEdit ? "แก้ไขข้อมูลมหาวิทยาลัย" : "เพิ่มมหาวิทยาลัย"}</p>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-surface-muted transition-colors"><XIcon /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`mb-1 block ${labelCls}`}>ชื่อย่อ <span className="text-red-500">*</span></label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="KMITL" />
            </div>
            <div>
              <label className={`mb-1 block ${labelCls}`}>ที่ตั้ง</label>
              <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className={inputCls} placeholder="กรุงเทพมหานคร" />
            </div>
          </div>
          <div>
            <label className={`mb-1 block ${labelCls}`}>ชื่อเต็ม <span className="text-red-500">*</span></label>
            <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className={inputCls} placeholder="ชื่อเต็มภาษาไทย" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`mb-1 block ${labelCls}`}>โทรศัพท์</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} placeholder="+66 2 xxx xxxx" />
            </div>
            <div>
              <label className={`mb-1 block ${labelCls}`}>อีเมล</label>
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} placeholder="kosen@uni.ac.th" />
            </div>
          </div>
          <div>
            <label className={`mb-2 block ${labelCls}`}>สีธีม</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button key={c.value} type="button" onClick={() => setForm({ ...form, color: c.value, dot: c.dot })}
                  className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${c.value} ${form.color === c.value ? "ring-2 ring-primary/40 ring-offset-1" : ""}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />{c.label}
                </button>
              ))}
            </div>
            <div className={`mt-2 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${form.color}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${selectedColor.dot}`} />
              {form.name || "ชื่อย่อ"}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm text-muted hover:text-foreground transition-colors">ยกเลิก</button>
          <button onClick={handleSave} className="btn-primary">{isEdit ? "บันทึก" : "เพิ่ม"}</button>
        </div>
      </div>
    </div>
  );
}

function UniversitiesSection() {
  const { universities, addUniversity, updateUniversity, deleteUniversity, reorderUniversities } = useContact();
  const [modal, setModal] = useState(null);
  const { dragProps, overIdx } = useDrag(universities, reorderUniversities);

  const nextId = () => {
    const nums = universities.map((i) => parseInt(i.id.replace("U", ""), 10)).filter(Boolean);
    return `U${String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3, "0")}`;
  };

  const handleSave = (form) => {
    if (modal?.item) updateUniversity(modal.item.id, form);
    else addUniversity({ ...form, id: nextId() });
  };

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 space-y-4">
      <SectionHeader title="มหาวิทยาลัยพาร์ทเนอร์" desc="ข้อมูลติดต่อแต่ละสถาบัน" onAdd={() => setModal({})} />
      <div className="grid gap-5 grid-cols-8">
        {universities.map((u, idx) => {
          const span = u.span ?? 1;
          return (
            <div
              key={u.id}
              {...dragProps(idx)}
              className={`rounded-xl border p-6 flex flex-col gap-2 transition-all select-none ${overIdx === idx ? "border-primary bg-accent-soft/30" : "border-border"} ${SPAN_CLASS[span] ?? "col-span-2"}`}
            >
              {/* top toolbar */}
              <div className="flex items-center justify-between gap-2">
                <div className="cursor-grab text-muted active:cursor-grabbing"><DragHandle /></div>
                <div className="flex items-center gap-1">
                  <SizeToggle span={span} onChange={(s) => updateUniversity(u.id, { span: s })} />
                  <button onClick={() => setModal({ item: u })} className="rounded-lg border border-border px-2.5 py-1 text-xs text-muted hover:border-primary hover:text-primary transition-colors">แก้ไข</button>
                  <DeleteButton onDelete={() => deleteUniversity(u.id)} />
                </div>
              </div>
              {/* preview — ตรงกับ public/contact */}
              <div className="mb-3">
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-sm font-bold ${u.color}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${u.dot}`} />{u.name}
                </span>
              </div>
              <h3 className="text-base font-bold text-foreground leading-snug mb-3">{u.fullName}</h3>
              <div className="space-y-2">
                {u.location && (
                  <div className="flex items-center gap-2 text-base text-muted">
                    <span>📍</span><span>{u.location}</span>
                  </div>
                )}
                {u.phone && (
                  <div className="flex items-center gap-2 text-base">
                    <span>📞</span>
                    <a href={`tel:${u.phone.replace(/\s/g,"")}`} className="text-primary hover:underline font-medium">{u.phone}</a>
                  </div>
                )}
                {u.email && (
                  <div className="flex items-center gap-2 text-base">
                    <span>✉️</span>
                    <a href={`mailto:${u.email}`} className="text-primary hover:underline font-medium">{u.email}</a>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {modal !== null && <UniversityModal item={modal.item} onClose={() => setModal(null)} onSave={handleSave} />}
    </div>
  );
}

// ══════════════════════════════
//  SOCIAL MEDIA SECTION
// ══════════════════════════════
function SocialModal({ item, onClose, onSave }) {
  const isEdit = !!item;
  const [form, setForm] = useState(item ?? { id: "", icon: "🔗", label: "", handle: "", href: "", span: 1 });

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSave = () => {
    if (!form.label.trim()) return;
    onSave(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <p className="text-sm font-semibold text-foreground">{isEdit ? "แก้ไขโซเชียลมีเดีย" : "เพิ่มโซเชียลมีเดีย"}</p>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-surface-muted transition-colors"><XIcon /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={`mb-1 block ${labelCls}`}>ไอคอน</label>
              <input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} className={inputCls} placeholder="📘" />
            </div>
            <div className="col-span-2">
              <label className={`mb-1 block ${labelCls}`}>ชื่อแพลตฟอร์ม <span className="text-red-500">*</span></label>
              <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className={inputCls} placeholder="Facebook" />
            </div>
          </div>
          <div>
            <label className={`mb-1 block ${labelCls}`}>Handle / ชื่อบัญชี</label>
            <input value={form.handle} onChange={(e) => setForm({ ...form, handle: e.target.value })} className={inputCls} placeholder="@thai_kosen" />
          </div>
          <div>
            <label className={`mb-1 block ${labelCls}`}>URL ลิงก์</label>
            <input value={form.href} onChange={(e) => setForm({ ...form, href: e.target.value })} className={inputCls} placeholder="https://facebook.com/..." />
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm text-muted hover:text-foreground transition-colors">ยกเลิก</button>
          <button onClick={handleSave} className="btn-primary">{isEdit ? "บันทึก" : "เพิ่ม"}</button>
        </div>
      </div>
    </div>
  );
}

function SocialSection() {
  const { social, addSocial, updateSocial, deleteSocial, reorderSocial } = useContact();
  const [modal, setModal] = useState(null);
  const { dragProps, overIdx } = useDrag(social, reorderSocial);

  const nextId = () => {
    const nums = social.map((i) => parseInt(i.id.replace("S", ""), 10)).filter(Boolean);
    return `S${String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3, "0")}`;
  };

  const handleSave = (form) => {
    if (modal?.item) updateSocial(modal.item.id, form);
    else addSocial({ ...form, id: nextId() });
  };

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 space-y-4">
      <SectionHeader title="โซเชียลมีเดีย" desc="ช่องทาง Social ของโครงการ" onAdd={() => setModal({})} />
      <div className="grid gap-5 grid-cols-8">
        {social.map((s, idx) => {
          const span = s.span ?? 1;
          return (
            <div
              key={s.id}
              {...dragProps(idx)}
              className={`flex flex-col gap-2 rounded-xl border p-6 transition-all select-none ${overIdx === idx ? "border-primary bg-accent-soft/30" : "border-border"} ${SPAN_CLASS[span] ?? "col-span-2"}`}
            >
              {/* top toolbar */}
              <div className="flex items-center justify-between gap-1">
                <div className="cursor-grab text-muted active:cursor-grabbing"><DragHandle /></div>
                <div className="flex items-center gap-1">
                  <SizeToggle span={span} onChange={(sv) => updateSocial(s.id, { span: sv })} />
                  <button onClick={() => setModal({ item: s })} className="rounded-lg border border-border px-2.5 py-1 text-xs text-muted hover:border-primary hover:text-primary transition-colors">แก้ไข</button>
                  <DeleteButton onDelete={() => deleteSocial(s.id)} />
                </div>
              </div>
              {/* preview — ตรงกับ public/contact */}
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-2xl">{s.icon}</div>
                <div className="min-w-0">
                  <p className="text-base font-bold text-foreground">{s.label}</p>
                  <p className="text-sm text-muted truncate">{s.handle}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {modal !== null && <SocialModal item={modal.item} onClose={() => setModal(null)} onSave={handleSave} />}
    </div>
  );
}

// ══════════════════════════════
//  MAIN EXPORT
// ══════════════════════════════
export default function ContactListClient() {
  const { ready } = useContact();

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
      <MainInfoSection />
      <UniversitiesSection />
      <SocialSection />
    </div>
  );
}
