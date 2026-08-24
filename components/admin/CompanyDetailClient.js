"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import AdminTopBar from "@/components/admin/ui/AdminTopBar";
import { useCompanies } from "@/components/admin/contexts/CompanyContext";

// ── Helpers ────────────────────────────────────────────────────────────────────

/** แปลง ISO datetime / string ใดก็ได้ → "YYYY-MM-DD" สำหรับ input[type=date] */
function toDateVal(v) {
  return v ? String(v).slice(0, 10) : "";
}

// ── Constants ──────────────────────────────────────────────────────────────────

const INDUSTRIES = [
  "ยานยนต์", "อิเล็กทรอนิกส์", "เทคโนโลยีสารสนเทศ", "เคมีและวัสดุ",
  "ก่อสร้างและโยธา", "พลังงานและสาธารณูปโภค", "อุตสาหกรรมการผลิต", "นิคมอุตสาหกรรม",
];
const STATUSES     = ["ร่วมมือ", "รอดำเนินการ", "อยู่ระหว่างพิจารณา", "ระงับ"];
const MOU_STATUSES = ["มี MOU", "ไม่มี MOU"];
const TYPES        = ["บริษัทจำกัด", "บริษัทมหาชนจำกัด", "รัฐวิสาหกิจ", "หน่วยงานวิจัย"];

const STATUS_CONFIG = {
  ร่วมมือ:              { badge: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  รอดำเนินการ:          { badge: "bg-amber-100 text-amber-700 border-amber-200",      dot: "bg-amber-500"   },
  อยู่ระหว่างพิจารณา:  { badge: "bg-blue-100 text-blue-700 border-blue-200",         dot: "bg-blue-400"    },
  ระงับ:                { badge: "bg-red-100 text-red-700 border-red-200",            dot: "bg-red-500"     },
};
const MOU_CONFIG = {
  "มี MOU":    "bg-blue-100 text-blue-700 border-blue-200",
  "ไม่มี MOU": "bg-gray-100 text-gray-500 border-gray-200",
};

// ── CSS — เหมือน alumni/student ───────────────────────────────────────────────

const inputCls    = "w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-accent-soft placeholder:text-muted";
const selectCls   = "w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-accent-soft";
const roInputCls  = "w-full rounded-xl border border-transparent bg-surface-muted/50 px-3 py-2 text-sm font-medium text-foreground outline-none cursor-default select-text";
const roSelectCls = "w-full rounded-xl border border-transparent bg-surface-muted/50 px-3 py-2 text-sm font-medium text-foreground outline-none cursor-default";

// ── Shared UI — เหมือน alumni/student ─────────────────────────────────────────

function Section({ icon, title, description, children, action }) {
  return (
    <div className="card p-0 overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5 bg-surface-muted">
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-soft text-sm">{icon}</span>
          <div>
            <p className="text-sm font-semibold text-foreground">{title}</p>
            {description && <p className="text-xs text-muted">{description}</p>}
          </div>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function EField({ label, required, hint, span2, children }) {
  return (
    <div className={span2 ? "sm:col-span-2" : ""}>
      <label className="flex items-center gap-1 text-xs font-medium text-foreground mb-1.5">
        {label}{required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

// ── Delete Modal ───────────────────────────────────────────────────────────────

function DeleteModal({ name, id, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm rounded-2xl border border-border bg-surface shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col items-center px-6 pt-8 pb-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-foreground">ยืนยันการลบข้อมูล</h2>
          <p className="mt-2 text-sm text-muted">คุณต้องการลบข้อมูลของ</p>
          <p className="mt-1 font-semibold text-foreground">{name}</p>
          <p className="text-xs text-muted">รหัส {id}</p>
          <div className="mt-3 w-full rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-600">
            ⚠️ การดำเนินการนี้ไม่สามารถย้อนกลับได้
          </div>
        </div>
        <div className="flex gap-3 border-t border-border px-6 py-4">
          <button onClick={onCancel} className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-surface-muted transition-colors">ยกเลิก</button>
          <button onClick={onConfirm} className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 transition-colors">ลบข้อมูล</button>
        </div>
      </div>
    </div>
  );
}

// ── Hero card — update real-time ตาม d ────────────────────────────────────────

function CompanyHeroCard({ d, editing }) {
  const stCfg  = STATUS_CONFIG[d.status];
  const mouCls = MOU_CONFIG[d.mouStatus] ?? "bg-gray-100 text-gray-500 border-gray-200";
  return (
    <div className="card p-0 overflow-hidden">
      <div className={`h-1.5 w-full bg-gradient-to-r ${editing ? "from-amber-400 via-primary to-indigo-400" : "from-primary via-blue-400 to-indigo-400"}`} />
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-6">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-2xl font-extrabold text-primary ring-4 ring-accent-soft">
          {(d.name || "?").charAt(0)}
        </div>
        <div className="flex-1 min-w-0 space-y-1.5">
          <h1 className="text-lg font-extrabold text-foreground leading-tight">
            {d.name || <span className="font-normal italic text-muted">ชื่อบริษัท</span>}
          </h1>
          {d.nameEn && <p className="text-sm text-muted">{d.nameEn}</p>}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {stCfg && (
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${stCfg.badge} border-current/20`}>
                <span className={`h-1.5 w-1.5 rounded-full ${stCfg.dot}`} />
                {d.status}
              </span>
            )}
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${mouCls}`}>
              {d.mouStatus}
            </span>
            {d.industry && (
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-muted px-2.5 py-0.5 text-xs text-muted">🏭 {d.industry}</span>
            )}
            {d.type && (
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-muted px-2.5 py-0.5 text-xs text-muted">{d.type}</span>
            )}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className={`text-3xl font-extrabold leading-none ${d.openPositions > 0 ? "text-primary" : "text-muted"}`}>
            {d.openPositions ?? 0}
          </p>
          <p className="text-xs text-muted mt-0.5">ตำแหน่งเปิดรับ</p>
        </div>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────

export default function CompanyDetailClient({ id }) {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { getCompany, updateCompany, deleteCompany, ready } = useCompanies();

  const [editing,    setEditing]    = useState(() => searchParams.get("edit") === "1");
  const [form,       setForm]       = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [saveError,  setSaveError]  = useState(null);
  const [showDelete, setShowDelete] = useState(false);

  // sync กับ ?edit=1 ถ้า URL เปลี่ยน
  useEffect(() => {
    if (searchParams.get("edit") === "1" && !editing) setEditing(true);
  }, [searchParams]);

  if (!ready) {
    return (
      <>
        <AdminTopBar title="ข้อมูลบริษัท" description="กำลังโหลด..." />
        <div className="flex items-center justify-center py-24 text-muted text-sm">กำลังโหลดข้อมูล...</div>
      </>
    );
  }

  const company = getCompany(id);
  if (!company) {
    return (
      <>
        <AdminTopBar title="ข้อมูลบริษัท" description="ไม่พบบริษัท" />
        <div className="p-6 space-y-4">
          <Link href="/admin/companies/list" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            กลับรายชื่อบริษัท
          </Link>
          <div className="card p-12 text-center">
            <p className="text-4xl mb-3">🏢</p>
            <p className="font-semibold text-foreground">ไม่พบบริษัทรหัส {id}</p>
            <p className="text-sm text-muted mt-1">อาจถูกลบไปแล้ว หรือรหัสไม่ถูกต้อง</p>
          </div>
        </div>
      </>
    );
  }

  // activeForm — form state ใน edit mode (fallback เป็น company ถ้าเปิดด้วย ?edit=1)
  const activeForm = form ?? (editing ? company : null);
  // d — source of truth สำหรับ display
  const d = editing ? (activeForm ?? company) : company;

  const iCls = editing ? inputCls   : roInputCls;
  const sCls = editing ? selectCls  : roSelectCls;

  const set = (k) => (e) => setForm((f) => ({ ...(f ?? company), [k]: e.target.value }));

  const handleEdit = () => {
    setForm({ ...company });
    setEditing(true);
    setSaveError(null);
  };

  const handleCancel = () => {
    setForm(null);
    setEditing(false);
    setSaveError(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!activeForm?.name?.trim()) return;
    setSaving(true);
    setSaveError(null);
    try {
      await updateCompany(id, { ...activeForm, openPositions: parseInt(activeForm.openPositions, 10) || 0 });
      setEditing(false);
      setForm(null);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    await deleteCompany(id);
    router.push("/admin/companies/list");
  };

  const isValid = !!d.name?.trim();
  const hasMOU  = d.mouStatus === "มี MOU";

  return (
    <>
      <AdminTopBar
        title={editing ? `แก้ไขข้อมูล — ${d.name || "บริษัท"}` : d.name}
        description={`${company.id} · ${company.industry}`}
      />

      {/* Error banner */}
      {saveError && (
        <div className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-red-200 bg-red-50 px-6 py-2.5 text-sm text-red-700">
          <span>⚠️ {saveError}</span>
          <button onClick={() => setSaveError(null)} className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium hover:bg-red-100 transition-colors">ปิด ×</button>
        </div>
      )}

      {/* Sticky top bar — เหมือน student/alumni */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-surface/95 px-6 py-2.5 backdrop-blur">
        <Link href="/admin/companies/list"
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          กลับรายชื่อบริษัท
        </Link>

        {editing ? (
          <div className="flex gap-2">
            <button type="button" onClick={handleCancel}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3.5 py-1.5 text-sm font-medium text-muted hover:text-foreground transition-colors">
              ยกเลิก
            </button>
            <button form="company-form" type="submit" disabled={!isValid || saving}
              className="inline-flex items-center gap-1.5 rounded-xl btn-primary disabled:opacity-40 disabled:cursor-not-allowed text-sm px-3.5 py-1.5">
              {saving ? (
                <><Spinner />กำลังบันทึก...</>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  บันทึก
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button onClick={handleEdit}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3.5 py-1.5 text-sm font-medium text-foreground hover:border-primary hover:text-primary transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
              แก้ไข
            </button>
            <button onClick={() => setShowDelete(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3.5 py-1.5 text-sm font-medium text-foreground hover:border-red-400 hover:text-red-500 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              ลบ
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6 space-y-5">
        <form id="company-form" onSubmit={handleSave} className="space-y-5">

          {/* ── Hero card ── */}
          <CompanyHeroCard d={d} editing={editing} />

          {/* ── 3-col grid ── */}
          <div className="grid gap-5 lg:grid-cols-3">

            {/* ── Left col — สถานะ + ความร่วมมือ ── */}
            <div className="space-y-5">

              <Section icon="📋" title="ข้อมูลความร่วมมือ">
                <div className="space-y-4">
                  <EField label="สถานะความร่วมมือ">
                    <select value={d.status ?? ""} onChange={set("status")} disabled={!editing} className={sCls}>
                      {STATUSES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </EField>
                  <EField label="ตำแหน่งฝึกงานที่เปิดรับ (คน)">
                    <input type="number" min="0" value={d.openPositions ?? 0} onChange={set("openPositions")}
                      readOnly={!editing} className={iCls} />
                  </EField>
                  <EField label="สถานะ MOU">
                    <select value={d.mouStatus ?? ""} onChange={set("mouStatus")} disabled={!editing} className={sCls}>
                      {MOU_STATUSES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </EField>
                  <EField label="วันหมดอายุ MOU" hint={editing && !hasMOU ? "เปิดใช้งานเมื่อเลือก มี MOU" : undefined}>
                    <input type="date"
                      value={toDateVal(d.mouExpiry)}
                      onChange={set("mouExpiry")}
                      readOnly={!editing || !hasMOU}
                      className={(!editing || !hasMOU) ? roInputCls + " opacity-50" : inputCls}
                    />
                  </EField>
                </div>
              </Section>

              <Section icon="🔑" title="รหัสบริษัท">
                <p className="font-mono text-xl font-bold text-foreground">{company.id}</p>
              </Section>

            </div>

            {/* ── Right col (2-span) — ข้อมูลหลัก ── */}
            <div className="lg:col-span-2 space-y-5">

              {/* ข้อมูลทั่วไป */}
              <Section icon="🏢" title="ข้อมูลทั่วไป">
                <div className="grid gap-4 sm:grid-cols-2">
                  <EField label="ชื่อบริษัท (ภาษาไทย)" required={editing} span2>
                    <input value={d.name ?? ""} onChange={set("name")} readOnly={!editing}
                      className={iCls} placeholder={editing ? "บริษัท ..." : ""} />
                  </EField>
                  <EField label="ชื่อบริษัท (ภาษาอังกฤษ)" span2>
                    <input value={d.nameEn ?? ""} onChange={set("nameEn")} readOnly={!editing}
                      className={iCls} placeholder={editing ? "Company Name Co., Ltd." : ""} />
                  </EField>
                  <EField label="อุตสาหกรรม">
                    <select value={d.industry ?? ""} onChange={set("industry")} disabled={!editing} className={sCls}>
                      {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
                    </select>
                  </EField>
                  <EField label="ประเภทนิติบุคคล">
                    <select value={d.type ?? ""} onChange={set("type")} disabled={!editing} className={sCls}>
                      {TYPES.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </EField>
                  <EField label="คำอธิบายบริษัท" span2>
                    <textarea value={d.description ?? ""} onChange={set("description")} readOnly={!editing}
                      rows={editing ? 3 : 2}
                      placeholder={editing ? "สรุปย่อเกี่ยวกับบริษัท ธุรกิจหลัก และสาขาที่รับนักศึกษา..." : ""}
                      className={`${iCls} resize-none`} />
                  </EField>
                </div>
              </Section>

              {/* ที่ตั้ง */}
              <Section icon="📍" title="ที่ตั้ง">
                <div className="grid gap-4 sm:grid-cols-2">
                  <EField label="ประเทศ">
                    <input value={d.country ?? ""} onChange={set("country")} readOnly={!editing}
                      className={iCls} placeholder={editing ? "เช่น ไทย, ญี่ปุ่น" : ""} />
                  </EField>
                  <EField label="จังหวัด / เมือง">
                    <input value={d.province ?? ""} onChange={set("province")} readOnly={!editing}
                      className={iCls} placeholder={editing ? "กรุงเทพมหานคร" : ""} />
                  </EField>
                  <EField label="ที่อยู่เต็ม" span2>
                    <input value={d.address ?? ""} onChange={set("address")} readOnly={!editing}
                      className={iCls} placeholder={editing ? "เลขที่ ถนน แขวง/ตำบล เขต/อำเภอ รหัสไปรษณีย์" : ""} />
                  </EField>
                </div>
              </Section>

              {/* ช่องทางออนไลน์ */}
              <Section icon="🌐" title="ช่องทางออนไลน์">
                <div className="grid gap-4 sm:grid-cols-2">
                  <EField label="เว็บไซต์">
                    {!editing && d.website ? (
                      <a href={d.website} target="_blank" rel="noopener noreferrer"
                        className="block truncate rounded-xl border border-transparent bg-surface-muted/50 px-3 py-2 text-sm font-medium text-primary hover:underline">
                        {d.website}
                      </a>
                    ) : (
                      <input value={d.website ?? ""} onChange={set("website")} readOnly={!editing}
                        className={iCls} placeholder={editing ? "https://www.company.com" : ""} />
                    )}
                  </EField>
                  <EField label="LinkedIn">
                    {!editing && d.linkedin ? (
                      <a href={d.linkedin} target="_blank" rel="noopener noreferrer"
                        className="block truncate rounded-xl border border-transparent bg-surface-muted/50 px-3 py-2 text-sm font-medium text-primary hover:underline">
                        {d.linkedin}
                      </a>
                    ) : (
                      <input value={d.linkedin ?? ""} onChange={set("linkedin")} readOnly={!editing}
                        className={iCls} placeholder={editing ? "https://linkedin.com/company/..." : ""} />
                    )}
                  </EField>
                </div>
              </Section>

              {/* ผู้ประสานงาน */}
              <Section icon="👤" title="ผู้ประสานงาน">
                <div className="grid gap-4 sm:grid-cols-2">
                  <EField label="ชื่อผู้ประสานงาน">
                    <input value={d.contactName ?? ""} onChange={set("contactName")} readOnly={!editing}
                      className={iCls} placeholder={editing ? "คุณ..." : ""} />
                  </EField>
                  <EField label="โทรศัพท์">
                    {!editing && d.contactTel ? (
                      <a href={`tel:${d.contactTel}`}
                        className="block rounded-xl border border-transparent bg-surface-muted/50 px-3 py-2 text-sm font-medium text-primary hover:underline">
                        {d.contactTel}
                      </a>
                    ) : (
                      <input type="tel" value={d.contactTel ?? ""} onChange={set("contactTel")} readOnly={!editing}
                        className={iCls} placeholder={editing ? "0x-xxxx-xxxx" : ""} />
                    )}
                  </EField>
                  <EField label="อีเมลติดต่อ" span2>
                    {!editing && d.contactEmail ? (
                      <a href={`mailto:${d.contactEmail}`}
                        className="block truncate rounded-xl border border-transparent bg-surface-muted/50 px-3 py-2 text-sm font-medium text-primary hover:underline">
                        {d.contactEmail}
                      </a>
                    ) : (
                      <input type="email" value={d.contactEmail ?? ""} onChange={set("contactEmail")} readOnly={!editing}
                        className={iCls} placeholder={editing ? "hr@company.com" : ""} />
                    )}
                  </EField>
                </div>
              </Section>

              {/* หมายเหตุ */}
              <Section icon="📝" title="หมายเหตุ" description={editing ? "ข้อมูลเพิ่มเติมสำหรับ admin" : undefined}>
                <textarea value={d.note ?? ""} onChange={set("note")} readOnly={!editing} rows={2}
                  placeholder={editing ? "บันทึกเพิ่มเติมสำหรับ admin..." : ""}
                  className={`${iCls} resize-none`} />
              </Section>

            </div>
          </div>
        </form>
      </div>

      {showDelete && (
        <DeleteModal
          name={company.name}
          id={company.id}
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
        />
      )}
    </>
  );
}
