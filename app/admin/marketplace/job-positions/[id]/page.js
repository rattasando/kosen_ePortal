"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import AdminTopBar from "@/components/admin/ui/AdminTopBar";
import { useJobs } from "@/components/admin/contexts/JobContext";

// ── Constants ─────────────────────────────────────────────────
const JOB_TYPES    = ["ฝึกงาน", "งานประจำ"];
const JOB_FIELDS   = [
    "วิศวกรรมคอมพิวเตอร์", "วิศวกรรมเครื่องกล", "วิศวกรรมไฟฟ้า",
    "วิศวกรรมอุตสาหการ", "วิศวกรรมเมคคาทรอนิกส์", "วิศวกรรมโยธา",
    "วิศวกรรมเคมี", "การออกแบบอุตสาหกรรม",
];
const JOB_STATUSES = ["เปิดรับ", "เต็มแล้ว", "ปิดรับ"];
const COUNTRIES    = ["ไทย", "ญี่ปุ่น", "สหรัฐอเมริกา", "เกาหลีใต้", "จีน", "สิงคโปร์", "อื่นๆ"];

const STATUS_CONFIG = {
    เปิดรับ:  { color: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
    เต็มแล้ว: { color: "bg-blue-100 text-blue-700 border-blue-200",          dot: "bg-blue-500" },
    ปิดรับ:   { color: "bg-gray-100 text-gray-500 border-gray-200",          dot: "bg-gray-400" },
};

const TYPE_CONFIG = {
    ฝึกงาน:   { color: "bg-sky-50 text-sky-700 border-sky-200" },
    งานประจำ: { color: "bg-violet-50 text-violet-700 border-violet-200" },
};

const inputCls  = "w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-accent-soft placeholder:text-muted";
const selectCls = "w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-accent-soft";

// ── Helpers ───────────────────────────────────────────────────
function formatDate(str) {
    if (!str) return "";
    const d = new Date(str);
    if (isNaN(d)) return str;
    return d.toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });
}
function isExpired(str) {
    if (!str) return false;
    return new Date(str) < new Date();
}

// ── Shared UI ─────────────────────────────────────────────────
function Section({ icon, title, description, children }) {
    return (
        <div className="card p-0 overflow-hidden">
            <div className="flex items-center gap-3 border-b border-border px-5 py-3.5 bg-surface-muted">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-soft text-sm">{icon}</span>
                <div>
                    <p className="text-sm font-semibold text-foreground">{title}</p>
                    {description && <p className="text-xs text-muted">{description}</p>}
                </div>
            </div>
            <div className="p-5">{children}</div>
        </div>
    );
}

// View mode: label-left, value-right
function VRow({ label, value, mono, badge, badgeCls }) {
    if (value === null || value === undefined || value === "") return null;
    return (
        <div className="flex flex-col gap-0.5 sm:flex-row sm:items-start">
            <span className="w-44 shrink-0 text-xs text-muted">{label}</span>
            {badge ? (
                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${badgeCls}`}>{value}</span>
            ) : (
                <span className={`text-sm font-medium text-foreground ${mono ? "font-mono" : ""}`}>{value}</span>
            )}
        </div>
    );
}

// Edit mode: label-above, input-below
function EField({ label, required, hint, hintError, children }) {
    return (
        <div className="space-y-1.5">
            <label className="flex items-center gap-1 text-xs font-medium text-foreground">
                {label}{required && <span className="text-red-500">*</span>}
            </label>
            {children}
            {hint && <p className={`text-xs ${hintError ? "text-red-500 font-medium" : "text-muted"}`}>{hint}</p>}
        </div>
    );
}

function SectionDivider({ label }) {
    return <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</p>;
}
function SectionDividerBorder({ label }) {
    return <p className="pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted border-t border-border">{label}</p>;
}

// ── Spinner ───────────────────────────────────────────────────
function Spinner() {
    return (
        <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
    );
}

// ── Delete Modal ──────────────────────────────────────────────
function DeleteModal({ job, onConfirm, onCancel }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onCancel}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <div className="relative w-full max-w-sm rounded-2xl border border-border bg-surface shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex flex-col items-center px-6 pt-8 pb-4 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <h2 className="text-lg font-bold text-foreground">ยืนยันการลบตำแหน่งงาน</h2>
                    <p className="mt-2 text-sm text-muted">คุณต้องการลบตำแหน่ง</p>
                    <p className="mt-1 font-semibold text-foreground">{job.title}</p>
                    <p className="text-xs text-muted">{job.companyName}</p>
                    <div className="mt-3 w-full rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-600">
                        ⚠️ การดำเนินการนี้ไม่สามารถย้อนกลับได้
                    </div>
                </div>
                <div className="flex gap-3 border-t border-border px-6 py-4">
                    <button onClick={onCancel} className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-surface-muted transition-colors">ยกเลิก</button>
                    <button onClick={onConfirm} className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 transition-colors">ลบตำแหน่งงาน</button>
                </div>
            </div>
        </div>
    );
}

// ── Page shell ────────────────────────────────────────────────
export default function JobDetailPage() {
    const { id } = useParams();
    const { getJob, jobs, updateJob, deleteJob, ready } = useJobs();

    if (!ready) {
        return <div className="flex items-center justify-center py-24 text-muted text-sm">กำลังโหลดข้อมูล...</div>;
    }

    const job = getJob(id);
    if (!job) {
        return (
            <>
                <AdminTopBar title="ไม่พบตำแหน่งงาน" />
                <div className="flex flex-col items-center gap-4 py-24 text-center">
                    <span className="text-5xl">🔍</span>
                    <p className="text-sm text-muted">ไม่พบตำแหน่งงานรหัส <span className="font-mono font-bold text-foreground">{id}</span></p>
                    <Link href="/admin/marketplace/job-positions" className="btn-primary mt-2">กลับรายการตำแหน่งงาน</Link>
                </div>
            </>
        );
    }

    return <JobDetail key={id} job={job} jobs={jobs} updateJob={updateJob} deleteJob={deleteJob} />;
}

// ── Main detail component ─────────────────────────────────────
function JobDetail({ job, jobs, updateJob, deleteJob }) {
    const router      = useRouter();
    const searchParams = useSearchParams();
    const [editing, setEditing]     = useState(() => searchParams.get("edit") === "1");
    const [form, setForm]           = useState(() => ({ ...job }));
    const [saving, setSaving]       = useState(false);
    const [showDelete, setShowDelete] = useState(false);

    useEffect(() => {
        if (searchParams.get("edit") === "1" && !editing) setEditing(true);
    }, [searchParams]);

    const set = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));
    const setNum = (key) => (e) => setForm(prev => ({ ...prev, [key]: parseInt(e.target.value, 10) || 0 }));

    const isValid = form.title?.trim() && form.companyName?.trim() && form.type && form.field && form.status;

    const handleEdit   = () => { setForm({ ...job }); setEditing(true); };
    const handleCancel = () => { setForm({ ...job }); setEditing(false); };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!isValid) return;
        setSaving(true);
        await new Promise(r => setTimeout(r, 400));
        updateJob(job.id, { ...form });
        setSaving(false);
        setEditing(false);
    };

    const handleDelete = () => {
        deleteJob(job.id);
        router.push("/admin/marketplace/job-positions");
    };

    const d = editing ? form : job;
    const statusCfg = STATUS_CONFIG[d.status] ?? STATUS_CONFIG["ปิดรับ"];
    const typeCfg   = TYPE_CONFIG[d.type]   ?? { color: "bg-gray-100 text-gray-600 border-gray-200" };
    const expired   = isExpired(d.deadline);

    return (
        <>
            <AdminTopBar
                title={editing ? `แก้ไขตำแหน่งงาน — ${d.title}` : d.title}
                description={`${d.id} · ${d.companyName}`}
            />

            {/* ── Sticky top bar — เหมือน student/company ── */}
            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-surface/95 px-6 py-2.5 backdrop-blur">
                <Link href="/admin/marketplace/job-positions"
                    className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                    กลับรายการตำแหน่งงาน
                </Link>

                {editing ? (
                    <div className="flex items-center gap-2">
                        <button type="button" onClick={handleCancel}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3.5 py-1.5 text-sm font-medium text-muted hover:text-foreground transition-colors">
                            ยกเลิก
                        </button>
                        <button form="job-form" type="submit" disabled={!isValid || saving}
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
                    <div className="flex items-center gap-2">
                        <button type="button" onClick={handleEdit}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3.5 py-1.5 text-sm font-medium text-foreground hover:border-primary hover:text-primary transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                            แก้ไข
                        </button>
                        <button type="button" onClick={() => setShowDelete(true)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3.5 py-1.5 text-sm font-medium text-foreground hover:border-red-400 hover:text-red-500 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            ลบ
                        </button>
                    </div>
                )}
            </div>

            <div className="p-6">
                <form id="job-form" onSubmit={handleSave} className="space-y-5">

                    {/* ══════════════════════════════════════════════
                        Row 1 — สถานะ (narrow) | ข้อมูลตำแหน่งงาน (wide)
                    ══════════════════════════════════════════════ */}
                    <div className="grid gap-5 xl:grid-cols-[320px_1fr]">

                        {/* ── สถานะและระบบ ── */}
                        <Section icon="🪪" title="สถานะและระบบ" description="รหัสตำแหน่งและสถานะปัจจุบัน">
                            <div className="space-y-4">

                                {/* Icon */}
                                <div className="flex justify-center">
                                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-accent-soft text-4xl">
                                        {d.type === "ฝึกงาน" ? "🎓" : "💼"}
                                    </div>
                                </div>

                                {editing ? (
                                    <>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-foreground">รหัสตำแหน่งงาน</label>
                                            <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-muted px-3 py-2">
                                                <span className="text-sm font-mono font-semibold text-foreground">{job.id}</span>
                                                <span className="ml-auto rounded-full bg-surface px-2 py-0.5 text-[10px] font-semibold text-muted border border-border">ไม่สามารถเปลี่ยนได้</span>
                                            </div>
                                        </div>
                                        <EField label="สถานะ" required>
                                            <select value={form.status} onChange={set("status")} className={selectCls}>
                                                {JOB_STATUSES.map(s => <option key={s}>{s}</option>)}
                                            </select>
                                        </EField>
                                        <EField label="ประเภท" required>
                                            <select value={form.type} onChange={set("type")} className={selectCls}>
                                                {JOB_TYPES.map(t => <option key={t}>{t}</option>)}
                                            </select>
                                        </EField>
                                        <div className="grid grid-cols-2 gap-3">
                                            <EField label="จำนวนรับ (คน)">
                                                <input type="number" min="0" value={form.slots ?? ""} onChange={setNum("slots")} placeholder="0" className={inputCls} />
                                            </EField>
                                            <EField label="ผู้สมัคร (คน)">
                                                <input type="number" min="0" value={form.applications ?? ""} onChange={setNum("applications")} placeholder="0" className={inputCls} />
                                            </EField>
                                        </div>
                                    </>
                                ) : (
                                    <div className="space-y-2.5">
                                        <VRow label="รหัสตำแหน่งงาน" value={d.id} mono />
                                        <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center">
                                            <span className="w-44 shrink-0 text-xs text-muted">สถานะ</span>
                                            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusCfg.color}`}>
                                                <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
                                                {d.status}
                                            </span>
                                        </div>
                                        <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center">
                                            <span className="w-44 shrink-0 text-xs text-muted">ประเภท</span>
                                            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${typeCfg.color}`}>
                                                {d.type}
                                            </span>
                                        </div>
                                        <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center">
                                            <span className="w-44 shrink-0 text-xs text-muted">ผู้สมัคร / รับ</span>
                                            <span className="text-sm font-semibold text-foreground">
                                                {d.applications ?? 0}
                                                <span className="font-normal text-muted"> / {d.slots ?? "—"} คน</span>
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Section>

                        {/* ── ข้อมูลตำแหน่งงาน ── */}
                        <Section icon="📋" title="ข้อมูลตำแหน่งงาน" description="ชื่อตำแหน่งและรายละเอียดบริษัท">
                            {editing ? (
                                <>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <EField label="ชื่อตำแหน่ง (ไทย)" required>
                                            <input type="text" value={form.title} onChange={set("title")} placeholder="วิศวกรซอฟต์แวร์ฝึกงาน" className={inputCls} />
                                        </EField>
                                        <EField label="ชื่อตำแหน่ง (EN)">
                                            <input type="text" value={form.titleEn ?? ""} onChange={set("titleEn")} placeholder="Software Engineering Intern" className={inputCls} />
                                        </EField>
                                    </div>
                                    <div className="mt-4">
                                        <EField label="ชื่อบริษัท" required>
                                            <input type="text" value={form.companyName} onChange={set("companyName")} placeholder="บริษัท..." className={inputCls} />
                                        </EField>
                                    </div>
                                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                        <EField label="สาขาวิชา" required>
                                            <select value={form.field} onChange={set("field")} className={selectCls}>
                                                <option value="">-- เลือกสาขา --</option>
                                                {JOB_FIELDS.map(f => <option key={f}>{f}</option>)}
                                            </select>
                                        </EField>
                                        <EField label="เงินเดือน / ค่าตอบแทน">
                                            <input type="text" value={form.salary ?? ""} onChange={set("salary")} placeholder="15,000 บาท/เดือน" className={inputCls} />
                                        </EField>
                                    </div>
                                    {form.type === "ฝึกงาน" && (
                                        <div className="mt-4">
                                            <EField label="ระยะเวลา">
                                                <input type="text" value={form.duration ?? ""} onChange={set("duration")} placeholder="2 เดือน" className={inputCls} />
                                            </EField>
                                        </div>
                                    )}
                                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                        <EField label="วันที่เริ่มงาน">
                                            <input type="date" value={form.startDate ?? ""} onChange={set("startDate")} className={inputCls} />
                                        </EField>
                                        <EField label="วันปิดรับสมัคร">
                                            <input type="date" value={form.deadline ?? ""} onChange={set("deadline")} className={inputCls} />
                                        </EField>
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-2.5">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-xl font-bold text-foreground">{d.title}</span>
                                        {d.titleEn && <span className="text-sm text-muted">{d.titleEn}</span>}
                                    </div>
                                    <VRow label="บริษัท" value={d.companyName} />
                                    <VRow label="สาขาวิชา" value={d.field} />
                                    <VRow label="เงินเดือน / ค่าตอบแทน" value={d.salary} />
                                    {d.duration && <VRow label="ระยะเวลา" value={d.duration} />}
                                    {d.startDate && <VRow label="วันที่เริ่มงาน" value={formatDate(d.startDate)} />}
                                    {d.deadline && (
                                        <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center">
                                            <span className="w-44 shrink-0 text-xs text-muted">วันปิดรับสมัคร</span>
                                            <span className={`text-sm font-medium ${expired ? "text-red-500" : "text-foreground"}`}>
                                                {formatDate(d.deadline)}
                                                {expired && <span className="ml-2 text-xs font-normal text-red-400">(เกินกำหนด)</span>}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </Section>
                    </div>

                    {/* ══════════════════════════════════════════════
                        Row 2 — รายละเอียด | ที่ตั้ง
                    ══════════════════════════════════════════════ */}
                    <div className="grid gap-5 xl:grid-cols-2">

                        {/* ── รายละเอียดและคุณสมบัติ ── */}
                        <Section icon="📄" title="รายละเอียดและคุณสมบัติ">
                            {editing ? (
                                <>
                                    <SectionDivider label="รายละเอียดงาน" />
                                    <div className="mt-3">
                                        <EField label="รายละเอียด">
                                            <textarea value={form.description ?? ""} onChange={set("description")} rows={5}
                                                placeholder="อธิบายลักษณะงาน ความรับผิดชอบ และสิ่งที่จะได้เรียนรู้..."
                                                className={inputCls + " resize-none"} />
                                        </EField>
                                    </div>
                                    <div className="mt-5 border-t border-border pt-4">
                                        <SectionDivider label="คุณสมบัติที่ต้องการ" />
                                        <div className="mt-3">
                                            <EField label="คุณสมบัติ / ข้อกำหนด">
                                                <textarea value={form.requirements ?? ""} onChange={set("requirements")} rows={4}
                                                    placeholder="ระดับการศึกษา สาขา ทักษะ หรือประสบการณ์ที่ต้องการ..."
                                                    className={inputCls + " resize-none"} />
                                            </EField>
                                        </div>
                                    </div>
                                    <div className="mt-5 border-t border-border pt-4">
                                        <SectionDivider label="สวัสดิการ" />
                                        <div className="mt-3">
                                            <EField label="สวัสดิการที่ได้รับ" hint="เช่น ค่าเดินทาง ประกันสุขภาพ โบนัส ที่พัก ฯลฯ">
                                                <textarea value={form.welfare ?? ""} onChange={set("welfare")} rows={3}
                                                    placeholder="ค่าเดินทาง · ประกันอุบัติเหตุ · อาหารกลางวัน · โบนัส..."
                                                    className={inputCls + " resize-none"} />
                                            </EField>
                                        </div>
                                    </div>
                                    <div className="mt-5 border-t border-border pt-4">
                                        <SectionDivider label="ทักษะ / เครื่องมือ" />
                                        <div className="mt-3">
                                            <EField label="Tags" hint="คั่นด้วย comma เช่น Python, Java, SQL">
                                                <input value={Array.isArray(form.tags) ? form.tags.join(", ") : (form.tags ?? "")}
                                                    onChange={(e) => {
                                                        const arr = e.target.value.split(",").map((t) => t.trim()).filter(Boolean);
                                                        setForm((f) => ({ ...f, tags: arr }));
                                                    }}
                                                    placeholder="Python, Java, SQL, AutoCAD..."
                                                    className={inputCls} />
                                            </EField>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-4">
                                    {d.description && (
                                        <>
                                            <SectionDivider label="รายละเอียดงาน" />
                                            <p className="text-sm text-foreground leading-relaxed">{d.description}</p>
                                        </>
                                    )}
                                    {d.requirements && (
                                        <>
                                            <SectionDividerBorder label="คุณสมบัติที่ต้องการ" />
                                            <p className="text-sm text-foreground leading-relaxed">{d.requirements}</p>
                                        </>
                                    )}
                                    {d.welfare && (
                                        <>
                                            <SectionDividerBorder label="สวัสดิการ" />
                                            <p className="text-sm text-foreground leading-relaxed">{d.welfare}</p>
                                        </>
                                    )}
                                    {d.tags && d.tags.length > 0 && (
                                        <>
                                            <SectionDividerBorder label="ทักษะ / เครื่องมือ" />
                                            <div className="flex flex-wrap gap-1.5">
                                                {(Array.isArray(d.tags) ? d.tags : String(d.tags).split(",").map((t) => t.trim()).filter(Boolean)).map((tag) => (
                                                    <span key={tag} className="rounded-md border border-border bg-background px-2 py-0.5 text-xs text-muted font-mono">{tag}</span>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                    {!d.description && !d.requirements && !d.welfare && (!d.tags || !d.tags.length) && (
                                        <p className="text-sm text-muted">—</p>
                                    )}
                                </div>
                            )}
                        </Section>

                        {/* ── ที่ตั้งและการติดต่อ ── */}
                        <Section icon="📍" title="ที่ตั้งและการติดต่อ">
                            {editing ? (
                                <>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <EField label="จังหวัด / เมือง">
                                            <input type="text" value={form.location ?? ""} onChange={set("location")} placeholder="สมุทรปราการ" className={inputCls} />
                                        </EField>
                                        <EField label="ประเทศ">
                                            <select value={form.country ?? "ไทย"} onChange={set("country")} className={selectCls}>
                                                {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                                            </select>
                                        </EField>
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-2.5">
                                    <VRow label="จังหวัด / เมือง" value={d.location} />
                                    {d.country && (
                                        <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center">
                                            <span className="w-44 shrink-0 text-xs text-muted">ประเทศ</span>
                                            <span className="text-sm font-medium text-primary/70">🌏 {d.country}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </Section>
                    </div>

                    {/* ── หมายเหตุ ── */}
                    <Section icon="📝" title="หมายเหตุ" description="ข้อมูลเพิ่มเติม (ไม่บังคับ)">
                        {editing ? (
                            <textarea value={form.note ?? ""} onChange={set("note")} rows={3}
                                placeholder="บันทึกเพิ่มเติม..."
                                className={inputCls + " resize-none"} />
                        ) : (
                            d.note
                                ? <p className="text-sm text-foreground leading-relaxed">{d.note}</p>
                                : <p className="text-sm text-muted">—</p>
                        )}
                    </Section>

                </form>
            </div>

            {showDelete && (
                <DeleteModal
                    job={job}
                    onConfirm={handleDelete}
                    onCancel={() => setShowDelete(false)}
                />
            )}
        </>
    );
}
