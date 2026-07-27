"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminTopBar from "@/components/admin/ui/AdminTopBar";
import { useCompanies } from "@/components/admin/contexts/CompanyContext";

// ── Constants ──────────────────────────────────────────────────────────────────

const INDUSTRIES = [
  "ยานยนต์", "อิเล็กทรอนิกส์", "เทคโนโลยีสารสนเทศ", "เคมีและวัสดุ",
  "ก่อสร้างและโยธา", "พลังงานและสาธารณูปโภค", "อุตสาหกรรมการผลิต", "นิคมอุตสาหกรรม",
];
const STATUSES   = ["ร่วมมือ", "รอดำเนินการ", "ระงับ"];
const MOU_STATUSES = ["มี MOU", "ไม่มี MOU"];
const TYPES = ["บริษัทจำกัด", "บริษัทมหาชนจำกัด", "รัฐวิสาหกิจ", "หน่วยงานวิจัย"];

const STATUS_BADGE = {
  ร่วมมือ:     "bg-emerald-100 text-emerald-700 border border-emerald-200",
  รอดำเนินการ: "bg-amber-100 text-amber-700 border border-amber-200",
  ระงับ:       "bg-red-100 text-red-700 border border-red-200",
};
const MOU_BADGE = {
  "มี MOU":    "bg-blue-100 text-blue-700 border border-blue-200",
  "ไม่มี MOU": "bg-gray-100 text-gray-500 border border-gray-200",
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function InfoRow({ label, value, link, mono }) {
  if (!value) return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-1">{label}</p>
      <p className="text-sm text-muted italic">—</p>
    </div>
  );
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-1">{label}</p>
      {link ? (
        <a href={link} target="_blank" rel="noopener noreferrer"
          className={`text-sm text-primary hover:underline break-all ${mono ? "font-mono" : ""}`}>
          {value}
        </a>
      ) : (
        <p className={`text-sm text-foreground break-words ${mono ? "font-mono" : ""}`}>{value}</p>
      )}
    </div>
  );
}

function SectionCard({ icon, title, children, cols = 2 }) {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border bg-surface-muted px-5 py-3">
        <span className="text-base leading-none">{icon}</span>
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted">{title}</h3>
      </div>
      <div className={`grid gap-x-8 gap-y-4 p-5 ${cols === 2 ? "sm:grid-cols-2" : cols === 3 ? "sm:grid-cols-3" : ""}`}>
        {children}
      </div>
    </div>
  );
}

// ── Edit Field ─────────────────────────────────────────────────────────────────

function EditField({ label, children, span2, required }) {
  return (
    <div className={span2 ? "sm:col-span-2" : ""}>
      <label className="block text-xs font-semibold text-foreground mb-1.5">
        {label}{required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted outline-none focus:border-primary focus:ring-2 focus:ring-accent-soft transition-colors";
const selectCls = inputCls + " cursor-pointer";

// ── Delete Confirm ─────────────────────────────────────────────────────────────

function DeleteConfirm({ name, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-surface shadow-2xl p-6 space-y-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-500 text-xl">🗑️</div>
        <div>
          <h2 className="font-bold text-foreground">ยืนยันการลบ</h2>
          <p className="text-sm text-muted mt-1">ต้องการลบ <span className="font-semibold text-foreground">{name}</span> ออกจากระบบ? การกระทำนี้ไม่สามารถยกเลิกได้</p>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="btn-secondary">ยกเลิก</button>
          <button onClick={onConfirm} className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 transition-colors">ลบบริษัท</button>
        </div>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────

export default function CompanyDetailClient({ id }) {
  const router = useRouter();
  const { getCompany, updateCompany, deleteCompany, ready } = useCompanies();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [showDelete, setShowDelete] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!ready) {
    return (
      <>
        <AdminTopBar title="Company Detail" description="กำลังโหลด..." />
        <div className="flex items-center justify-center py-24 text-muted text-sm">กำลังโหลดข้อมูล...</div>
      </>
    );
  }

  const company = getCompany(id);

  if (!company) {
    return (
      <>
        <AdminTopBar title="Company Detail" description="ไม่พบบริษัท" />
        <div className="p-6 space-y-4">
          <Link href="/admin/companies/list" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
            ← กลับไปรายชื่อบริษัท
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

  // ── Enter edit mode ─────────────────────────────────────────
  const startEdit = () => {
    setForm({ ...company });
    setEditing(true);
    setSaved(false);
  };

  const cancelEdit = () => {
    setEditing(false);
    setForm(null);
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.name?.trim()) return;
    updateCompany(id, { ...form, openPositions: parseInt(form.openPositions, 10) || 0 });
    setEditing(false);
    setForm(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleDelete = () => {
    deleteCompany(id);
    router.push("/admin/companies/list");
  };

  // ── Display data (show saved form or live company) ──────────
  const data = company;

  return (
    <>
      <AdminTopBar
        title={editing ? "แก้ไขข้อมูลบริษัท" : "ข้อมูลบริษัท"}
        description={editing ? `กำลังแก้ไข: ${data.name}` : data.name}
      />

      {showDelete && (
        <DeleteConfirm name={data.name} onClose={() => setShowDelete(false)} onConfirm={handleDelete} />
      )}

      <div className="p-6 space-y-5">

        {/* ── Back + Action bar ── */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/admin/companies/list"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            กลับไปรายชื่อบริษัท
          </Link>

          {!editing && (
            <div className="flex items-center gap-2">
              {saved && (
                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5">
                  ✓ บันทึกเรียบร้อยแล้ว
                </span>
              )}
              <button onClick={startEdit} className="btn-primary inline-flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                แก้ไขข้อมูล
              </button>
              <button onClick={() => setShowDelete(true)}
                className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted hover:border-red-400 hover:bg-red-50 hover:text-red-500 transition-colors inline-flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                ลบบริษัท
              </button>
            </div>
          )}
        </div>

        {/* ════════════════ VIEW MODE ════════════════ */}
        {!editing && (
          <>
            {/* Header card */}
            <div className="card p-5">
              <div className="flex flex-wrap items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-2xl font-black text-primary border border-border">
                  {data.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg font-bold text-foreground leading-tight">{data.name}</h1>
                  {data.nameEn && <p className="text-sm text-muted mt-0.5">{data.nameEn}</p>}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_BADGE[data.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {data.status}
                    </span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${MOU_BADGE[data.mouStatus] ?? "bg-gray-100 text-gray-500"}`}>
                      {data.mouStatus}
                    </span>
                    <span className="rounded-full border border-border bg-surface-muted px-2.5 py-1 text-xs font-semibold text-muted">
                      {data.industry}
                    </span>
                    <span className="rounded-full border border-border bg-surface-muted px-2.5 py-1 text-xs font-semibold text-muted">
                      {data.type}
                    </span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-3xl font-extrabold text-primary leading-none">{data.openPositions}</p>
                  <p className="text-xs text-muted mt-0.5">ตำแหน่งเปิดรับ</p>
                </div>
              </div>
              {data.description && (
                <p className="mt-4 text-sm text-muted leading-relaxed border-t border-border pt-4">{data.description}</p>
              )}
            </div>

            <div className="grid gap-5 lg:grid-cols-3">

              {/* Left: main info */}
              <div className="space-y-5 lg:col-span-2">

                <SectionCard icon="📍" title="ที่ตั้ง">
                  <InfoRow label="ประเทศ" value={data.country} />
                  <InfoRow label="จังหวัด / เมือง" value={data.province} />
                  <InfoRow label="ที่อยู่เต็ม" value={data.address} span2 />
                </SectionCard>

                <SectionCard icon="🌐" title="ช่องทางออนไลน์">
                  <InfoRow label="เว็บไซต์" value={data.website} link={data.website} />
                  <InfoRow label="LinkedIn" value={data.linkedin} link={data.linkedin} />
                </SectionCard>

                <SectionCard icon="👤" title="ผู้ประสานงาน">
                  <InfoRow label="ชื่อผู้ประสานงาน" value={data.contactName} />
                  <InfoRow label="โทรศัพท์" value={data.contactTel} link={`tel:${data.contactTel}`} />
                  <InfoRow label="อีเมล" value={data.contactEmail} link={`mailto:${data.contactEmail}`} span2 />
                </SectionCard>

              </div>

              {/* Right: status sidebar */}
              <div className="space-y-5">

                <div className="card p-5 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted">ข้อมูลความร่วมมือ</h3>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted">สถานะ</span>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_BADGE[data.status] ?? "bg-gray-100"}`}>{data.status}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted">MOU</span>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${MOU_BADGE[data.mouStatus] ?? "bg-gray-100"}`}>{data.mouStatus}</span>
                    </div>
                    {data.mouStatus === "มี MOU" && data.mouExpiry && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted">หมดอายุ MOU</span>
                        <span className="text-sm font-semibold text-foreground">{data.mouExpiry}</span>
                      </div>
                    )}
                    <div className="border-t border-border pt-3 flex items-center justify-between">
                      <span className="text-sm text-muted">ตำแหน่งเปิดรับ</span>
                      <span className={`text-xl font-extrabold ${data.openPositions > 0 ? "text-primary" : "text-muted"}`}>{data.openPositions} คน</span>
                    </div>
                  </div>
                </div>

                <div className="card p-5 space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted">รหัสบริษัท</h3>
                  <p className="font-mono text-lg font-bold text-foreground">{data.id}</p>
                </div>

                {data.note && (
                  <div className="card p-5 space-y-2 border-l-4 border-amber-400">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-amber-600">📝 หมายเหตุ</h3>
                    <p className="text-sm text-foreground">{data.note}</p>
                  </div>
                )}

                <button onClick={startEdit} className="w-full btn-primary">
                  ✏️ แก้ไขข้อมูลบริษัท
                </button>
              </div>
            </div>
          </>
        )}

        {/* ════════════════ EDIT MODE ════════════════ */}
        {editing && form && (
          <form onSubmit={handleSave} className="space-y-5">

            {/* ── ข้อมูลทั่วไป ── */}
            <div className="card overflow-hidden">
              <div className="flex items-center gap-2 border-b border-border bg-surface-muted px-5 py-3">
                <span className="text-base">🏢</span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted">ข้อมูลทั่วไป</h3>
              </div>
              <div className="p-5 grid gap-4 sm:grid-cols-2">
                <EditField label="ชื่อบริษัท (ภาษาไทย)" required span2>
                  <input required value={form.name} onChange={set("name")} className={inputCls} />
                </EditField>
                <EditField label="ชื่อบริษัท (ภาษาอังกฤษ)" span2>
                  <input value={form.nameEn || ""} onChange={set("nameEn")} placeholder="Company Name Co., Ltd." className={inputCls} />
                </EditField>
                <EditField label="อุตสาหกรรม">
                  <select value={form.industry} onChange={set("industry")} className={selectCls}>
                    {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
                  </select>
                </EditField>
                <EditField label="ประเภทนิติบุคคล">
                  <select value={form.type} onChange={set("type")} className={selectCls}>
                    {TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </EditField>
                <EditField label="คำอธิบายบริษัท" span2>
                  <textarea value={form.description || ""} onChange={set("description")} rows={3} className={inputCls + " resize-none"} placeholder="สรุปย่อเกี่ยวกับบริษัท..." />
                </EditField>
              </div>
            </div>

            {/* ── ที่ตั้ง ── */}
            <div className="card overflow-hidden">
              <div className="flex items-center gap-2 border-b border-border bg-surface-muted px-5 py-3">
                <span className="text-base">📍</span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted">ที่ตั้ง</h3>
              </div>
              <div className="p-5 grid gap-4 sm:grid-cols-2">
                <EditField label="ประเทศ">
                  <input value={form.country || ""} onChange={set("country")} placeholder="เช่น ไทย, ญี่ปุ่น" className={inputCls} />
                </EditField>
                <EditField label="จังหวัด / เมือง">
                  <input value={form.province || ""} onChange={set("province")} className={inputCls} />
                </EditField>
                <EditField label="ที่อยู่เต็ม" span2>
                  <input value={form.address || ""} onChange={set("address")} className={inputCls} />
                </EditField>
              </div>
            </div>

            {/* ── ช่องทางออนไลน์ ── */}
            <div className="card overflow-hidden">
              <div className="flex items-center gap-2 border-b border-border bg-surface-muted px-5 py-3">
                <span className="text-base">🌐</span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted">ช่องทางออนไลน์</h3>
              </div>
              <div className="p-5 grid gap-4 sm:grid-cols-2">
                <EditField label="เว็บไซต์">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-xs">🔗</span>
                    <input value={form.website || ""} onChange={set("website")} placeholder="https://..." className={inputCls + " pl-8"} />
                  </div>
                </EditField>
                <EditField label="LinkedIn">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-xs font-bold">in</span>
                    <input value={form.linkedin || ""} onChange={set("linkedin")} placeholder="https://linkedin.com/company/..." className={inputCls + " pl-8"} />
                  </div>
                </EditField>
              </div>
            </div>

            {/* ── ผู้ประสานงาน ── */}
            <div className="card overflow-hidden">
              <div className="flex items-center gap-2 border-b border-border bg-surface-muted px-5 py-3">
                <span className="text-base">👤</span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted">ผู้ประสานงาน</h3>
              </div>
              <div className="p-5 grid gap-4 sm:grid-cols-2">
                <EditField label="ชื่อผู้ประสานงาน">
                  <input value={form.contactName || ""} onChange={set("contactName")} className={inputCls} />
                </EditField>
                <EditField label="โทรศัพท์">
                  <input value={form.contactTel || ""} onChange={set("contactTel")} className={inputCls} />
                </EditField>
                <EditField label="อีเมล" span2>
                  <input type="email" value={form.contactEmail || ""} onChange={set("contactEmail")} className={inputCls} />
                </EditField>
              </div>
            </div>

            {/* ── สถานะและ MOU ── */}
            <div className="card overflow-hidden">
              <div className="flex items-center gap-2 border-b border-border bg-surface-muted px-5 py-3">
                <span className="text-base">📋</span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted">สถานะและ MOU</h3>
              </div>
              <div className="p-5 grid gap-4 sm:grid-cols-2">
                <EditField label="สถานะความร่วมมือ">
                  <select value={form.status} onChange={set("status")} className={selectCls}>
                    {STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </EditField>
                <EditField label="ตำแหน่งฝึกงานที่เปิดรับ (คน)">
                  <input type="number" min="0" value={form.openPositions} onChange={set("openPositions")} className={inputCls} />
                </EditField>
                <EditField label="สถานะ MOU">
                  <select value={form.mouStatus} onChange={set("mouStatus")} className={selectCls}>
                    {MOU_STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </EditField>
                <EditField label="วันหมดอายุ MOU">
                  <input type="date" value={form.mouExpiry || ""} onChange={set("mouExpiry")}
                    className={inputCls + (form.mouStatus !== "มี MOU" ? " opacity-40 cursor-not-allowed" : "")}
                    disabled={form.mouStatus !== "มี MOU"} />
                </EditField>
                <EditField label="หมายเหตุ" span2>
                  <input value={form.note || ""} onChange={set("note")} placeholder="บันทึกสำหรับ admin..." className={inputCls} />
                </EditField>
              </div>
            </div>

            {/* ── Save/Cancel bar ── */}
            <div className="sticky bottom-0 -mx-6 px-6 py-4 bg-surface border-t border-border flex items-center justify-between gap-3 shadow-lg">
              <p className="text-xs text-muted">* จำเป็นต้องกรอก</p>
              <div className="flex gap-2">
                <button type="button" onClick={cancelEdit} className="btn-secondary">ยกเลิก</button>
                <button type="submit" className="btn-primary inline-flex items-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  บันทึกการแก้ไข
                </button>
              </div>
            </div>

          </form>
        )}

      </div>
    </>
  );
}
