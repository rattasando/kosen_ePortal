"use client";

import { useState, useEffect } from "react";
import { useContact } from "./ContactContext";

const inputCls    = "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-accent-soft placeholder:text-muted";
const labelCls    = "text-xs font-medium text-foreground";

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);

const COLOR_OPTIONS = [
  { value: "bg-blue-50 border-blue-200 text-blue-700",   dot: "bg-blue-500",   label: "น้ำเงิน" },
  { value: "bg-green-50 border-green-200 text-green-700", dot: "bg-green-500", label: "เขียว" },
  { value: "bg-violet-50 border-violet-200 text-violet-700", dot: "bg-violet-500", label: "ม่วง" },
  { value: "bg-amber-50 border-amber-200 text-amber-700", dot: "bg-amber-500",  label: "ทอง" },
  { value: "bg-red-50 border-red-200 text-red-700",       dot: "bg-red-500",   label: "แดง" },
  { value: "bg-teal-50 border-teal-200 text-teal-700",    dot: "bg-teal-500",  label: "เขียวน้ำ" },
];

// ── Generic confirm-delete button ──
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

// ══════════════════════════════
//  MAIN OFFICE SECTION
// ══════════════════════════════
function MainInfoModal({ item, onClose, onSave }) {
  const isEdit = !!item;
  const [form, setForm] = useState(
    item ? { ...item, linesText: item.lines.join("\n") } :
    { id: "", icon: "📌", label: "", linesText: "", href: "" }
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
  const { main, addMainItem, updateMainItem, deleteMainItem } = useContact();
  const [modal, setModal] = useState(null);

  const nextId = () => {
    const nums = main.map((i) => parseInt(i.id.replace("C", ""), 10)).filter(Boolean);
    return `C${String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3, "0")}`;
  };

  const handleSave = (form) => {
    if (modal?.item) {
      updateMainItem(modal.item.id, form);
    } else {
      addMainItem({ ...form, id: nextId() });
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 space-y-4">
      <SectionHeader title="ข้อมูลสำนักงานกลาง" desc="ที่อยู่ โทรศัพท์ อีเมล และเวลาทำการ" onAdd={() => setModal({})} />
      <div className="grid gap-3 sm:grid-cols-2">
        {main.map((item) => (
          <div key={item.id} className="flex items-start gap-3 rounded-xl border border-border p-4">
            <span className="text-2xl mt-0.5">{item.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-1">{item.label}</p>
              {item.lines.map((line, i) => (
                <p key={i} className="text-sm text-foreground leading-relaxed">{line}</p>
              ))}
              {item.href && <p className="mt-1 text-xs font-mono text-primary truncate">{item.href}</p>}
            </div>
            <div className="flex shrink-0 gap-1">
              <button onClick={() => setModal({ item })} className="rounded-lg border border-border px-2.5 py-1 text-xs text-muted hover:border-primary hover:text-primary transition-colors">แก้ไข</button>
              <DeleteButton onDelete={() => deleteMainItem(item.id)} />
            </div>
          </div>
        ))}
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
    { id: "", name: "", fullName: "", location: "", phone: "", email: "", color: COLOR_OPTIONS[0].value, dot: COLOR_OPTIONS[0].dot }
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
            {/* Preview */}
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
  const { universities, addUniversity, updateUniversity, deleteUniversity } = useContact();
  const [modal, setModal] = useState(null);

  const nextId = () => {
    const nums = universities.map((i) => parseInt(i.id.replace("U", ""), 10)).filter(Boolean);
    return `U${String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3, "0")}`;
  };

  const handleSave = (form) => {
    if (modal?.item) {
      updateUniversity(modal.item.id, form);
    } else {
      addUniversity({ ...form, id: nextId() });
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 space-y-4">
      <SectionHeader title="มหาวิทยาลัยพาร์ทเนอร์" desc="ข้อมูลติดต่อแต่ละสถาบัน" onAdd={() => setModal({})} />
      <div className="grid gap-3 md:grid-cols-2">
        {universities.map((u) => (
          <div key={u.id} className="rounded-xl border border-border p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${u.color}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${u.dot}`} />{u.name}
              </span>
              <div className="flex gap-1">
                <button onClick={() => setModal({ item: u })} className="rounded-lg border border-border px-2.5 py-1 text-xs text-muted hover:border-primary hover:text-primary transition-colors">แก้ไข</button>
                <DeleteButton onDelete={() => deleteUniversity(u.id)} />
              </div>
            </div>
            <p className="text-sm font-bold text-foreground leading-snug">{u.fullName}</p>
            <div className="space-y-1.5 text-xs text-muted">
              <p>📍 {u.location}</p>
              <p>📞 <a href={`tel:${u.phone.replace(/\s/g,"")}`} className="text-primary hover:underline font-medium">{u.phone}</a></p>
              <p>✉️ <a href={`mailto:${u.email}`} className="text-primary hover:underline font-medium">{u.email}</a></p>
            </div>
          </div>
        ))}
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
  const [form, setForm] = useState(item ?? { id: "", icon: "🔗", label: "", handle: "", href: "" });

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
  const { social, addSocial, updateSocial, deleteSocial } = useContact();
  const [modal, setModal] = useState(null);

  const nextId = () => {
    const nums = social.map((i) => parseInt(i.id.replace("S", ""), 10)).filter(Boolean);
    return `S${String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3, "0")}`;
  };

  const handleSave = (form) => {
    if (modal?.item) {
      updateSocial(modal.item.id, form);
    } else {
      addSocial({ ...form, id: nextId() });
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 space-y-4">
      <SectionHeader title="โซเชียลมีเดีย" desc="ช่องทาง Social ของโครงการ" onAdd={() => setModal({})} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {social.map((s) => (
          <div key={s.id} className="flex flex-col gap-3 rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-xl">{s.icon}</div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground">{s.label}</p>
                <p className="text-xs text-muted truncate">{s.handle}</p>
              </div>
            </div>
            {s.href && s.href !== "#" && (
              <p className="text-xs font-mono text-primary truncate">{s.href}</p>
            )}
            <div className="flex gap-1 mt-auto">
              <button onClick={() => setModal({ item: s })} className="flex-1 rounded-lg border border-border py-1.5 text-xs text-muted hover:border-primary hover:text-primary transition-colors">แก้ไข</button>
              <DeleteButton onDelete={() => deleteSocial(s.id)} />
            </div>
          </div>
        ))}
      </div>
      {modal !== null && <SocialModal item={modal.item} onClose={() => setModal(null)} onSave={handleSave} />}
    </div>
  );
}

// ══════════════════════════════
//  MAIN EXPORT
// ══════════════════════════════
export default function ContactListClient() {
  const { ready, main, universities, social } = useContact();

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
