"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useUsers } from "./contexts/UserContext";
import { formatDateTime } from "@/lib/utils/newsUtils";
import StatCard from "./ui/StatCard";

// ── Constants ─────────────────────────────────────────────────
const ROLES    = ["superadmin", "admin", "staff", "viewer"];
const STATUSES = ["active", "inactive", "suspended"];
const DEPARTMENTS = [
  "ฝ่ายไอทีและระบบ", "ฝ่ายวิชาการ", "ฝ่ายกิจการนักศึกษา",
  "ฝ่ายทุนการศึกษา", "ฝ่ายสหกิจศึกษา", "ฝ่ายประชาสัมพันธ์",
  "ฝ่ายการเงิน", "ฝ่ายแผนและงบประมาณ",
];
const UNIVERSITIES    = ["ส่วนกลาง", "KOSEN-Chulabhorn"];
const PAGE_SIZE_OPTIONS = [10, 20, 50];

const ROLE_CONFIG = {
  superadmin: { label: "Super Admin", color: "bg-red-100 text-red-700 border-red-200",          dot: "bg-red-500",     icon: "👑" },
  admin:      { label: "Admin",       color: "bg-violet-100 text-violet-700 border-violet-200", dot: "bg-violet-500",  icon: "🔑" },
  staff:      { label: "Staff",       color: "bg-blue-100 text-blue-700 border-blue-200",       dot: "bg-blue-500",    icon: "👔" },
  viewer:     { label: "Viewer",      color: "bg-gray-100 text-gray-600 border-gray-200",       dot: "bg-gray-400",    icon: "👁" },
};

const STATUS_CONFIG = {
  active:    { label: "ใช้งาน",     color: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  inactive:  { label: "ไม่ใช้งาน", color: "bg-amber-100 text-amber-700 border-amber-200",       dot: "bg-amber-400" },
  suspended: { label: "ระงับ",      color: "bg-red-100 text-red-700 border-red-200",             dot: "bg-red-500" },
};

const SORT_OPTIONS = [
  { value: "default",  label: "⇅ ค่าเริ่มต้น" },
  { value: "id_asc",   label: "🔢 เรียงตามรหัส" },
  { value: "name_az",  label: "ก–ฮ (ชื่อไทย)" },
  { value: "name_za",  label: "ฮ–ก (ชื่อไทย)" },
  { value: "login",    label: "🕐 เข้าใช้ล่าสุด" },
];

// ── Input style constants ─────────────────────────────────────
const inputCls  = "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-accent-soft placeholder:text-muted";
const selectCls = "rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-accent-soft";
const labelCls  = "text-xs font-medium text-foreground";
const chipBase  = "inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-accent-soft px-2.5 py-1 text-xs font-semibold text-primary hover:border-red-400 hover:bg-red-50 hover:text-red-500 transition-colors";
const XIcon     = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);

// ── Filter persistence ────────────────────────────────────────
const FILTER_KEY = "user-list-filters";
function loadFilters() {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(sessionStorage.getItem(FILTER_KEY)) ?? {}; }
  catch { return {}; }
}
function saveFilters(data) {
  try { sessionStorage.setItem(FILTER_KEY, JSON.stringify(data)); }
  catch { /* ignore */ }
}

// ── Helpers ───────────────────────────────────────────────────
function RoleBadge({ role }) {
  const cfg = ROLE_CONFIG[role] ?? ROLE_CONFIG.viewer;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${cfg.color}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.inactive;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${cfg.color}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function HighlightText({ text, terms }) {
  if (!text || !terms?.length) return <>{text}</>;
  const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const parts = text.split(new RegExp(`(${escaped.join("|")})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="rounded bg-amber-100 text-amber-800 px-0.5 not-italic">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

// ── Pagination ────────────────────────────────────────────────
function Pagination({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null;
  const pages = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push("…");
    pages.push(totalPages);
  }
  const btn = "flex h-8 min-w-[2rem] items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors";
  return (
    <div className="flex items-center gap-1">
      <button disabled={page === 1} onClick={() => onPage(page - 1)}
        className={`${btn} border border-border text-muted hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed`}>‹</button>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="px-1 text-sm text-muted select-none">…</span>
        ) : (
          <button key={p} onClick={() => onPage(p)}
            className={`${btn} border ${p === page ? "border-primary bg-primary text-white" : "border-border text-muted hover:border-primary hover:text-primary"}`}>
            {p}
          </button>
        )
      )}
      <button disabled={page === totalPages} onClick={() => onPage(page + 1)}
        className={`${btn} border border-border text-muted hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed`}>›</button>
    </div>
  );
}

// ── Permission matrix ─────────────────────────────────────────
const PERM_MATRIX = {
  superadmin: [true, true,  true,  true],
  admin:      [true, true,  true,  false],
  staff:      [true, true,  false, false],
  viewer:     [true, false, false, false],
};
const PERM_LABELS = ["ดูข้อมูล", "แก้ไขข้อมูล", "ลบข้อมูล", "จัดการผู้ใช้"];

function PermissionTable({ role }) {
  const perms = PERM_MATRIX[role] ?? PERM_MATRIX.viewer;
  return (
    <div className="grid grid-cols-2 gap-2">
      {PERM_LABELS.map((label, i) => (
        <div key={label} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium ${perms[i] ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-border bg-surface-muted text-muted line-through"}`}>
          <span>{perms[i] ? "✓" : "✗"}</span>{label}
        </div>
      ))}
    </div>
  );
}

// ── Password strength ─────────────────────────────────────────
function pwStrength(pw) {
  if (!pw) return null;
  let score = 0;
  if (pw.length >= 8)  score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { label: "อ่อนแอ",    color: "bg-red-500",    width: "w-1/4" };
  if (score === 2) return { label: "พอใช้",     color: "bg-amber-400",  width: "w-2/4" };
  if (score === 3) return { label: "ดี",        color: "bg-blue-500",   width: "w-3/4" };
  return              { label: "แข็งแกร่ง",  color: "bg-emerald-500", width: "w-full" };
}

// ── PasswordField (show/hide toggle) ─────────────────────────
function PasswordField({ value, onChange, placeholder, showStrength }) {
  const [show, setShow] = useState(false);
  const strength = showStrength ? pwStrength(value) : null;
  return (
    <div>
      <div className="relative mt-1">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={inputCls + " pr-10"}
          autoComplete="new-password"
        />
        <button type="button" onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors text-xs select-none">
          {show ? "ซ่อน" : "แสดง"}
        </button>
      </div>
      {strength && value && (
        <div className="mt-1.5 flex items-center gap-2">
          <div className="h-1.5 flex-1 rounded-full bg-border overflow-hidden">
            <div className={`h-full rounded-full transition-all ${strength.color} ${strength.width}`} />
          </div>
          <span className="text-xs text-muted w-16 text-right">{strength.label}</span>
        </div>
      )}
    </div>
  );
}

// ── Empty form ────────────────────────────────────────────────
function emptyForm() {
  return { id: "", username: "", password: "", name: "", nameEn: "", email: "",
    role: "staff", department: DEPARTMENTS[0], university: UNIVERSITIES[0],
    tel: "", lastLogin: "", status: "active",
    createdAt: new Date().toISOString().slice(0, 10),
    passwordUpdatedAt: new Date().toISOString().slice(0, 10), note: "" };
}

// ── Add/Edit Modal ────────────────────────────────────────────
function UserModal({ item, onClose, onSave, isNew }) {
  const [form, setForm]         = useState(() => item ? { ...item } : emptyForm());
  const [pwConfirm, setPwConfirm] = useState("");
  const [showChangePw, setShowChangePw] = useState(false);
  const [newPw, setNewPw]       = useState("");
  const [newPwConfirm, setNewPwConfirm] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const pwMatch = isNew ? form.password === pwConfirm : newPw === newPwConfirm;
  const isValid = form.name.trim() && form.email.trim() && form.id.trim() && form.username.trim() &&
    (!isNew || (form.password.trim() && pwMatch)) &&
    (!showChangePw || (newPw.trim() && pwMatch));

  const handleSave = () => {
    const out = { ...form };
    if (showChangePw && newPw.trim()) {
      out.password = newPw.trim();
      out.passwordUpdatedAt = new Date().toISOString().slice(0, 10);
    }
    onSave(out);
  };

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-xl rounded-2xl border border-border bg-surface shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-bold text-foreground">
            {isNew ? "เพิ่มผู้ใช้งานใหม่" : "แก้ไขข้อมูลผู้ใช้งาน"}
          </h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-surface-muted hover:text-foreground transition-colors">
            <XIcon />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5 space-y-4">
          {/* ID + Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>รหัสผู้ใช้ *</label>
              <input className={inputCls + " mt-1"} placeholder="USR001" value={form.id}
                onChange={(e) => set("id", e.target.value)} readOnly={!isNew} />
            </div>
            <div>
              <label className={labelCls}>สถานะ</label>
              <select className={selectCls + " w-full mt-1"} value={form.status} onChange={(e) => set("status", e.target.value)}>
                {STATUSES.map((s) => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
              </select>
            </div>
          </div>

          {/* Name TH / EN */}
          <div>
            <label className={labelCls}>ชื่อ-นามสกุล *</label>
            <input className={inputCls + " mt-1"} placeholder="ชื่อภาษาไทย" value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>ชื่อ-นามสกุล (English)</label>
            <input className={inputCls + " mt-1"} placeholder="Full name in English" value={form.nameEn} onChange={(e) => set("nameEn", e.target.value)} />
          </div>

          {/* Email + Tel */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>อีเมล *</label>
              <input className={inputCls + " mt-1"} type="email" placeholder="user@kosen.ac.th" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>เบอร์โทร</label>
              <input className={inputCls + " mt-1"} placeholder="08X-XXX-XXXX" value={form.tel} onChange={(e) => set("tel", e.target.value)} />
            </div>
          </div>

          {/* Role */}
          <div>
            <label className={labelCls}>บทบาท (Role)</label>
            <select className={selectCls + " w-full mt-1"} value={form.role} onChange={(e) => set("role", e.target.value)}>
              {ROLES.map((r) => <option key={r} value={r}>{ROLE_CONFIG[r].label}</option>)}
            </select>
            <p className="mt-1 text-xs text-muted">
              {form.role === "superadmin" && "เข้าถึงทุกส่วนของระบบ รวมถึงการจัดการผู้ใช้งาน"}
              {form.role === "admin" && "จัดการข้อมูลหลักได้ ยกเว้น User Management"}
              {form.role === "staff" && "จัดการข้อมูลที่ได้รับมอบหมายเท่านั้น"}
              {form.role === "viewer" && "ดูข้อมูลได้อย่างเดียว ไม่สามารถแก้ไขได้"}
            </p>
          </div>

          {/* Department + University */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>ฝ่าย/แผนก</label>
              <select className={selectCls + " w-full mt-1"} value={form.department} onChange={(e) => set("department", e.target.value)}>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>สังกัด</label>
              <select className={selectCls + " w-full mt-1"} value={form.university} onChange={(e) => set("university", e.target.value)}>
                {UNIVERSITIES.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          {/* ── Account credentials section ── */}
          <div className="rounded-xl border border-border bg-surface-muted p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">ข้อมูลบัญชีผู้ใช้งาน</p>

            {/* Username */}
            <div>
              <label className={labelCls}>ชื่อผู้ใช้ (Username) *</label>
              <input className={inputCls + " mt-1"} placeholder="firstname.lastname" value={form.username}
                onChange={(e) => set("username", e.target.value.toLowerCase().replace(/\s/g, ""))}
                autoComplete="username" />
              <p className="mt-1 text-xs text-muted">ใช้สำหรับเข้าสู่ระบบ ตัวพิมพ์เล็กและไม่มีช่องว่าง</p>
            </div>

            {/* Password (new user) */}
            {isNew && (
              <>
                <div>
                  <label className={labelCls}>รหัสผ่าน *</label>
                  <PasswordField value={form.password} onChange={(e) => set("password", e.target.value)}
                    placeholder="ตั้งรหัสผ่าน" showStrength />
                </div>
                <div>
                  <label className={labelCls}>ยืนยันรหัสผ่าน *</label>
                  <div className="mt-1">
                    <PasswordField value={pwConfirm} onChange={(e) => setPwConfirm(e.target.value)}
                      placeholder="พิมพ์รหัสผ่านอีกครั้ง" />
                  </div>
                  {pwConfirm && !pwMatch && (
                    <p className="mt-1 text-xs text-red-500">รหัสผ่านไม่ตรงกัน</p>
                  )}
                </div>
              </>
            )}

            {/* Change password (edit) */}
            {!isNew && (
              <div>
                {!showChangePw ? (
                  <button type="button" onClick={() => setShowChangePw(true)}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                    🔒 เปลี่ยนรหัสผ่าน
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-foreground">เปลี่ยนรหัสผ่าน</p>
                      <button type="button" onClick={() => { setShowChangePw(false); setNewPw(""); setNewPwConfirm(""); }}
                        className="text-xs text-muted hover:text-foreground">ยกเลิก</button>
                    </div>
                    <div>
                      <label className={labelCls}>รหัสผ่านใหม่</label>
                      <PasswordField value={newPw} onChange={(e) => setNewPw(e.target.value)}
                        placeholder="รหัสผ่านใหม่" showStrength />
                    </div>
                    <div>
                      <label className={labelCls}>ยืนยันรหัสผ่านใหม่</label>
                      <div className="mt-1">
                        <PasswordField value={newPwConfirm} onChange={(e) => setNewPwConfirm(e.target.value)}
                          placeholder="พิมพ์รหัสผ่านใหม่อีกครั้ง" />
                      </div>
                      {newPwConfirm && !pwMatch && (
                        <p className="mt-1 text-xs text-red-500">รหัสผ่านไม่ตรงกัน</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Note */}
          <div>
            <label className={labelCls}>หมายเหตุ</label>
            <textarea className={inputCls + " mt-1 resize-none"} rows={2} placeholder="หมายเหตุ (ถ้ามี)" value={form.note} onChange={(e) => set("note", e.target.value)} />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:bg-surface-muted transition-colors">ยกเลิก</button>
          <button disabled={!isValid} onClick={handleSave}
            className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed">
            {isNew ? "เพิ่มผู้ใช้งาน" : "บันทึก"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Detail Modal ──────────────────────────────────────────────
function UserDetail({ user, onClose, onEdit, onDelete, onSavePassword }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showPw, setShowPw]               = useState(false);
  const [newPw, setNewPw]                 = useState("");
  const [newPwConfirm, setNewPwConfirm]   = useState("");
  const [pwSaved, setPwSaved]             = useState(false);
  const roleCfg = ROLE_CONFIG[user.role] ?? ROLE_CONFIG.viewer;
  const pwMatch = newPw === newPwConfirm;
  const pwValid = newPw.trim().length >= 4 && pwMatch;

  const handleSavePw = () => {
    if (!pwValid) return;
    onSavePassword(user.id, newPw.trim());
    setPwSaved(true);
    setNewPw(""); setNewPwConfirm("");
    setTimeout(() => { setShowPw(false); setPwSaved(false); }, 1500);
  };

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-start justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl">{roleCfg.icon}</div>
            <div>
              <p className="font-bold text-foreground leading-tight">{user.name}</p>
              <p className="text-xs text-muted">{user.nameEn}</p>
            </div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-surface-muted hover:text-foreground transition-colors mt-1">
            <XIcon />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5 space-y-5">
          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <RoleBadge role={user.role} />
            <StatusBadge status={user.status} />
            <span className="inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-xs text-muted">{user.id}</span>
          </div>

          {/* Info */}
          <div className="rounded-xl border border-border bg-surface-muted p-4 space-y-3 text-sm">
            {[
              ["✉️", "อีเมล",           user.email],
              ["📞", "โทรศัพท์",        user.tel || "—"],
              ["🏢", "ฝ่าย/แผนก",      user.department],
              ["🏫", "สังกัด",          user.university],
              ["📅", "สร้างเมื่อ",      formatDateTime(user.createdAt)],
              ["🕐", "เข้าใช้ล่าสุด",  user.lastLogin ? formatDateTime(user.lastLogin) : "ยังไม่เคย"],
            ].map(([icon, label, value]) => (
              <div key={label} className="flex items-start gap-2">
                <span className="w-5 shrink-0">{icon}</span>
                <span className="w-28 shrink-0 text-muted">{label}</span>
                <span className="text-foreground font-medium break-all">{value}</span>
              </div>
            ))}
          </div>

          {/* Account credentials */}
          <div className="rounded-xl border border-border bg-surface-muted p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">บัญชีผู้ใช้งาน</p>
            <div className="flex items-center gap-2 text-sm">
              <span className="w-5 shrink-0">👤</span>
              <span className="w-28 shrink-0 text-muted">Username</span>
              <span className="font-mono font-semibold text-foreground">{user.username || "—"}</span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <span className="w-5 shrink-0">🔒</span>
              <span className="w-28 shrink-0 text-muted">รหัสผ่าน</span>
              <div className="flex-1 min-w-0">
                <span className="font-mono text-muted tracking-widest">••••••••</span>
                {user.passwordUpdatedAt && (
                  <p className="text-xs text-muted mt-0.5">อัปเดตล่าสุด: {user.passwordUpdatedAt}</p>
                )}
              </div>
            </div>

            {/* Inline change password */}
            {!showPw ? (
              <button onClick={() => setShowPw(true)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline mt-1">
                🔑 เปลี่ยนรหัสผ่าน
              </button>
            ) : pwSaved ? (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 font-medium">
                ✓ เปลี่ยนรหัสผ่านสำเร็จ
              </div>
            ) : (
              <div className="space-y-2 pt-1 border-t border-border">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-foreground">ตั้งรหัสผ่านใหม่</p>
                  <button onClick={() => { setShowPw(false); setNewPw(""); setNewPwConfirm(""); }}
                    className="text-xs text-muted hover:text-foreground">ยกเลิก</button>
                </div>
                <PasswordField value={newPw} onChange={(e) => setNewPw(e.target.value)}
                  placeholder="รหัสผ่านใหม่" showStrength />
                <PasswordField value={newPwConfirm} onChange={(e) => setNewPwConfirm(e.target.value)}
                  placeholder="ยืนยันรหัสผ่านใหม่" />
                {newPwConfirm && !pwMatch && (
                  <p className="text-xs text-red-500">รหัสผ่านไม่ตรงกัน</p>
                )}
                <button onClick={handleSavePw} disabled={!pwValid}
                  className="w-full rounded-lg bg-primary py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity">
                  บันทึกรหัสผ่านใหม่
                </button>
              </div>
            )}
          </div>

          {/* Permissions */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">สิทธิ์การเข้าถึง</p>
            <PermissionTable role={user.role} />
          </div>

          {user.note && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <span className="font-semibold">หมายเหตุ: </span>{user.note}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          {confirmDelete ? (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-red-600 font-medium">ยืนยันลบผู้ใช้นี้?</span>
              <button onClick={onDelete} className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700">ลบ</button>
              <button onClick={() => setConfirmDelete(false)} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted hover:bg-surface-muted">ยกเลิก</button>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)}
              className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">ลบผู้ใช้</button>
          )}
          <button onClick={onEdit} className="btn-primary">แก้ไข</button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────
export default function UserListClient() {
  const { users, ready, addUser, updateUser, deleteUser } = useUsers();

  const [searchInput, setSearchInput]   = useState("");
  const [keywords, setKeywords]         = useState(() => loadFilters().keywords ?? []);
  const [filterRole, setFilterRole]     = useState(() => loadFilters().filterRole ?? "ทั้งหมด");
  const [filterStatus, setFilterStatus] = useState(() => loadFilters().filterStatus ?? "ทั้งหมด");
  const [filterUni, setFilterUni]       = useState(() => loadFilters().filterUni ?? "ทั้งหมด");
  const [sortBy, setSortBy]             = useState(() => loadFilters().sortBy ?? "default");
  const [pageSize, setPageSize]         = useState(10);
  const [page, setPage]                 = useState(1);
  const [selected, setSelected]         = useState(null);
  const [editTarget, setEditTarget]     = useState(null);
  const [showAdd, setShowAdd]           = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    saveFilters({ keywords, filterRole, filterStatus, filterUni, sortBy });
  }, [keywords, filterRole, filterStatus, filterUni, sortBy]);

  // ── Keyword logic ──────────────────────────────────────────
  const addKeyword = (kw) => {
    const trimmed = kw.trim();
    if (!trimmed) return;
    setKeywords((prev) => prev.includes(trimmed) ? prev : [...prev, trimmed]);
    setSearchInput("");
    setPage(1);
  };
  const removeKeyword = (kw) => { setKeywords((prev) => prev.filter((k) => k !== kw)); setPage(1); };

  // ── Stats ──────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:  users.length,
    active: users.filter((u) => u.status === "active").length,
    admins: users.filter((u) => u.role === "superadmin" || u.role === "admin").length,
    staff:  users.filter((u) => u.role === "staff").length,
  }), [users]);

  const statusSummary = useMemo(
    () => STATUSES.map((s) => ({ label: s, count: users.filter((u) => u.status === s).length, cfg: STATUS_CONFIG[s] })),
    [users]
  );

  // ── Filter logic ───────────────────────────────────────────
  const matchField = (u, q) => {
    const s = (v) => (v || "").toLowerCase();
    return s(u.id).includes(q) || s(u.name).includes(q) || s(u.nameEn).includes(q) ||
      s(u.email).includes(q) || s(u.department).includes(q) || s(u.university).includes(q) ||
      s(u.role).includes(q) || s(u.tel).replace(/-/g, "").includes(q.replace(/-/g, ""));
  };

  const filtered = useMemo(() => {
    const base = users.filter((u) => {
      const matchKw  = keywords.length === 0 || keywords.every((kw) => matchField(u, kw.toLowerCase()));
      const matchLive = !searchInput.trim() || matchField(u, searchInput.trim().toLowerCase());
      const mRole    = filterRole === "ทั้งหมด" || u.role === filterRole;
      const mStatus  = filterStatus === "ทั้งหมด" || u.status === filterStatus;
      const mUni     = filterUni === "ทั้งหมด" || u.university === filterUni;
      return matchKw && matchLive && mRole && mStatus && mUni;
    });
    if (sortBy === "id_asc")  return [...base].sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
    if (sortBy === "name_az") return [...base].sort((a, b) => a.name.localeCompare(b.name, "th"));
    if (sortBy === "name_za") return [...base].sort((a, b) => b.name.localeCompare(a.name, "th"));
    if (sortBy === "login")   return [...base].sort((a, b) => (b.lastLogin || "").localeCompare(a.lastLogin || ""));
    return base;
  }, [users, keywords, searchInput, filterRole, filterStatus, filterUni, sortBy]);

  const clearFilters = () => {
    setKeywords([]); setSearchInput(""); setFilterRole("ทั้งหมด");
    setFilterStatus("ทั้งหมด"); setFilterUni("ทั้งหมด"); setSortBy("default"); setPage(1);
  };

  const hasActiveFilter = keywords.length > 0 || filterRole !== "ทั้งหมด" ||
    filterStatus !== "ทั้งหมด" || filterUni !== "ทั้งหมด" || sortBy !== "default";

  const activeTerms = useMemo(
    () => [...keywords, searchInput.trim()].filter(Boolean),
    [keywords, searchInput]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd   = Math.min(safePage * pageSize, filtered.length);

  // ── Handlers ──────────────────────────────────────────────
  const handleSaveNew  = (form) => { addUser(form); setShowAdd(false); };
  const handleSaveEdit = (form) => {
    updateUser(form.id, form); setEditTarget(null);
    if (selected?.id === form.id) setSelected(form);
  };
  const handleDelete = (id) => { deleteUser(id); setSelected(null); };
  const handleSavePassword = (id, newPassword) => {
    const updated = { password: newPassword, passwordUpdatedAt: new Date().toISOString().slice(0, 10) };
    updateUser(id, updated);
    if (selected?.id === id) setSelected((prev) => ({ ...prev, ...updated }));
  };

  if (!ready) {
    return <div className="flex items-center justify-center py-24 text-muted text-sm">กำลังโหลดข้อมูล...</div>;
  }

  return (
    <div className="space-y-6 p-6">

      {/* ── Stats ── */}
      <div className="admin-stat-grid">
        <StatCard label="ผู้ใช้งานทั้งหมด" value={stats.total}  icon="👥" />
        <StatCard label="ใช้งานอยู่"        value={stats.active} icon="🟢" />
        <StatCard label="Admin"             value={stats.admins} icon="🔑" />
        <StatCard label="Staff"             value={stats.staff}  icon="👔" />
      </div>

      {/* ── Status pills ── */}
      <div className="flex flex-wrap gap-2">
        {statusSummary.map(({ label, count, cfg }) => (
          <button key={label}
            onClick={() => { setFilterStatus(filterStatus === label ? "ทั้งหมด" : label); setPage(1); }}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold transition-all ${
              filterStatus === label
                ? cfg.color + " ring-2 ring-offset-1 ring-current"
                : "border-border bg-surface text-muted hover:border-primary hover:text-primary"
            }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
            <span className="rounded-full bg-black/10 px-1.5 py-0.5 text-[10px] font-bold">{count}</span>
          </button>
        ))}
      </div>

      {/* ── Search + Filters ── */}
      <div className="flex flex-col gap-3">

        {/* Row 1: Search + Add */}
        <div className="flex items-center gap-2">
          <div className="relative w-80 shrink-0">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none"
              xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
            <input ref={searchRef} type="text" value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addKeyword(searchInput); } }}
              placeholder="ชื่อ / รหัส / อีเมล แล้วกด Enter"
              className="w-full rounded-lg border border-border bg-surface pl-9 pr-4 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-accent-soft" />
          </div>
          <button onClick={() => addKeyword(searchInput)} disabled={!searchInput.trim()}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
            ค้นหา
          </button>
          <div className="ml-auto">
            <button onClick={() => setShowAdd(true)} className="btn-primary whitespace-nowrap">+ เพิ่มผู้ใช้งาน</button>
          </div>
        </div>

        {/* Row 2: Filter dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          <select value={filterRole} onChange={(e) => { setFilterRole(e.target.value); setPage(1); }} className={selectCls}>
            <option value="ทั้งหมด">👥 บทบาททั้งหมด</option>
            {ROLES.map((r) => <option key={r} value={r}>{ROLE_CONFIG[r].icon} {ROLE_CONFIG[r].label}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }} className={selectCls}>
            <option value="ทั้งหมด">◎ สถานะทั้งหมด</option>
            {STATUSES.map((s) => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
          </select>
          <select value={filterUni} onChange={(e) => { setFilterUni(e.target.value); setPage(1); }} className={selectCls}>
            <option value="ทั้งหมด">🏫 สังกัดทั้งหมด</option>
            {UNIVERSITIES.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
          <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(1); }} className={selectCls}>
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* ── Active filter chips ── */}
      {hasActiveFilter && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted">กรองด้วย:</span>
          {filterRole !== "ทั้งหมด" && (
            <button onClick={() => { setFilterRole("ทั้งหมด"); setPage(1); }} className={chipBase}>
              {ROLE_CONFIG[filterRole]?.icon} {ROLE_CONFIG[filterRole]?.label} <XIcon />
            </button>
          )}
          {filterStatus !== "ทั้งหมด" && (
            <button onClick={() => { setFilterStatus("ทั้งหมด"); setPage(1); }} className={chipBase}>
              ◎ {STATUS_CONFIG[filterStatus]?.label} <XIcon />
            </button>
          )}
          {filterUni !== "ทั้งหมด" && (
            <button onClick={() => { setFilterUni("ทั้งหมด"); setPage(1); }} className={chipBase}>
              🏫 {filterUni} <XIcon />
            </button>
          )}
          {sortBy !== "default" && (
            <button onClick={() => { setSortBy("default"); setPage(1); }} className={chipBase}>
              ⇅ {SORT_OPTIONS.find((o) => o.value === sortBy)?.label.replace(/^[^\s]+ /, "")} <XIcon />
            </button>
          )}
          {keywords.map((kw) => (
            <button key={kw} onClick={() => removeKeyword(kw)} className={chipBase}>
              🔍 &ldquo;{kw}&rdquo; <XIcon />
            </button>
          ))}
          <button onClick={clearFilters}
            className="text-xs font-medium text-muted hover:text-red-500 transition-colors underline underline-offset-2 ml-1">
            ล้างทั้งหมด
          </button>
        </div>
      )}

      {/* ── Table ── */}
      {paginated.length > 0 ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-muted text-xs font-semibold text-muted uppercase tracking-wide">
                  <th className="px-4 py-3">รหัส</th>
                  <th className="px-4 py-3">ชื่อ-นามสกุล</th>
                  <th className="px-4 py-3">บัญชีผู้ใช้</th>
                  <th className="px-4 py-3">บทบาท</th>
                  <th className="px-4 py-3">ฝ่าย / สังกัด</th>
                  <th className="px-4 py-3">เข้าใช้ล่าสุด</th>
                  <th className="px-4 py-3">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((u) => (
                  <tr key={u.id} onClick={() => setSelected(u)}
                    className="border-b border-border last:border-0 hover:bg-accent-soft cursor-pointer transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-muted whitespace-nowrap">{u.id}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-sm text-foreground leading-tight">
                        <HighlightText text={u.name} terms={activeTerms} />
                      </div>
                      {u.nameEn && (
                        <p className="text-xs text-muted mt-0.5">
                          <HighlightText text={u.nameEn} terms={activeTerms} />
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs text-foreground">
                        <HighlightText text={u.username || "—"} terms={activeTerms} />
                      </p>
                      <p className="text-xs text-muted mt-0.5">
                        <HighlightText text={u.email} terms={activeTerms} />
                      </p>
                    </td>
                    <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-foreground">
                        <HighlightText text={u.department} terms={activeTerms} />
                      </p>
                      <p className="text-xs text-muted mt-0.5">{u.university}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">{u.lastLogin || "—"}</td>
                    <td className="px-4 py-3"><StatusBadge status={u.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-surface py-16 text-center">
          <p className="text-2xl mb-2">🔍</p>
          <p className="text-sm font-medium text-foreground">ไม่พบผู้ใช้งาน</p>
          <p className="text-xs text-muted mt-1">ลองเปลี่ยนคำค้นหาหรือตัวกรอง</p>
          <button onClick={clearFilters} className="mt-4 text-sm font-medium text-primary hover:underline">
            ล้างตัวกรองทั้งหมด
          </button>
        </div>
      )}

      {/* ── Pagination footer ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-xs text-muted">
          {filtered.length === 0 ? "ไม่พบรายการ" : (
            <>แสดง{" "}
              <span className="font-semibold text-foreground">{rangeStart}–{rangeEnd}</span>{" "}
              จาก{" "}
              <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
              รายการ
              {filtered.length < users.length && (
                <> (กรองจากทั้งหมด{" "}
                  <span className="font-semibold text-foreground">{users.length}</span>{" "}รายการ)
                </>
              )}
            </>
          )}
        </p>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-muted">
            <span>แสดง</span>
            <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="rounded-lg border border-border bg-surface px-2 py-1.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-accent-soft">
              {PAGE_SIZE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            <span>รายการ/หน้า</span>
          </div>
          <Pagination page={safePage} totalPages={totalPages} onPage={setPage} />
        </div>
      </div>

      {/* ── Modals ── */}
      {selected && !editTarget && (
        <UserDetail user={selected} onClose={() => setSelected(null)}
          onEdit={() => setEditTarget(selected)} onDelete={() => handleDelete(selected.id)}
          onSavePassword={handleSavePassword} />
      )}
      {editTarget && (
        <UserModal item={editTarget} isNew={false} onClose={() => setEditTarget(null)} onSave={handleSaveEdit} />
      )}
      {showAdd && (
        <UserModal item={null} isNew onClose={() => setShowAdd(false)} onSave={handleSaveNew} />
      )}
    </div>
  );
}
