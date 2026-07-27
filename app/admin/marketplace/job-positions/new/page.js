"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminTopBar from "@/components/admin/ui/AdminTopBar";
import { useJobs } from "@/components/admin/contexts/JobContext";

// ── Constants ─────────────────────────────────────────────────
const JOB_TYPES  = ["ฝึกงาน", "งานประจำ"];
const JOB_FIELDS = [
    "วิศวกรรมคอมพิวเตอร์", "วิศวกรรมเครื่องกล", "วิศวกรรมไฟฟ้า",
    "วิศวกรรมอุตสาหการ", "วิศวกรรมเมคคาทรอนิกส์", "วิศวกรรมโยธา",
    "วิศวกรรมเคมี", "การออกแบบอุตสาหกรรม",
];
const JOB_STATUSES = ["เปิดรับ", "เต็มแล้ว", "ปิดรับ"];
const COUNTRIES    = ["ไทย", "ญี่ปุ่น", "สหรัฐอเมริกา", "เกาหลีใต้", "จีน", "สิงคโปร์", "อื่นๆ"];

const inputCls  = "w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-accent-soft placeholder:text-muted";
const selectCls = "w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-accent-soft";

// ── Shared UI ─────────────────────────────────────────────────
function Field({ label, required, hint, hintError, children }) {
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

// ── Empty form ────────────────────────────────────────────────
const emptyForm = () => ({
    id: "",
    title: "",
    titleEn: "",
    companyName: "",
    type: "ฝึกงาน",
    field: "",
    location: "",
    country: "ไทย",
    salary: "",
    duration: "",
    startDate: "",
    deadline: "",
    slots: "",
    applications: 0,
    status: "เปิดรับ",
    description: "",
    requirements: "",
    welfare: "",
    tags: [],
    note: "",
});

// ── Page ──────────────────────────────────────────────────────
export default function AddJobPage() {
    const { jobs, addJob } = useJobs();
    const router = useRouter();

    const [form, setForm]   = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved]   = useState(false);

    const set    = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));
    const setNum = (key) => (e) => setForm(prev => ({ ...prev, [key]: parseInt(e.target.value, 10) || 0 }));

    const idDuplicate = form.id.trim() && jobs.some(j => j.id === form.id.trim());
    const isValid     = form.id.trim() && !idDuplicate &&
                        form.title.trim() && form.companyName.trim() &&
                        form.type && form.field && form.status;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isValid) return;
        setSaving(true);
        await new Promise(r => setTimeout(r, 500));
        addJob({
            ...form,
            id: form.id.trim(),
            slots: parseInt(form.slots, 10) || 0,
            applications: 0,
        });
        setSaving(false);
        setSaved(true);
    };

    const handleReset = () => {
        setSaved(false);
        setForm(emptyForm());
    };

    // ── Success state ──────────────────────────────────────────
    if (saved) {
        return (
            <>
                <AdminTopBar title="เพิ่มตำแหน่งงานสำเร็จ" />
                <div className="flex flex-col items-center gap-4 py-24 text-center p-6">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-lg font-bold text-foreground">เพิ่มตำแหน่งงานสำเร็จ!</p>
                        <p className="mt-1 text-sm text-muted">
                            {form.title} — {form.companyName} ถูกเพิ่มเข้าระบบแล้ว
                        </p>
                    </div>
                    <div className="mt-2 flex flex-wrap justify-center gap-3">
                        <Link href={`/admin/marketplace/job-positions/${form.id.trim()}`} className="btn-primary">
                            ดูข้อมูลตำแหน่งงาน
                        </Link>
                        <button onClick={handleReset}
                            className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-muted hover:text-foreground transition-colors">
                            เพิ่มตำแหน่งงานต่อไป
                        </button>
                        <Link href="/admin/marketplace/job-positions"
                            className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-muted hover:text-foreground transition-colors">
                            กลับรายการ
                        </Link>
                    </div>
                </div>
            </>
        );
    }

    // ── Form ──────────────────────────────────────────────────
    return (
        <>
            <AdminTopBar
                title="เพิ่มตำแหน่งงานใหม่"
                description="กรอกข้อมูลให้ครบถ้วนเพื่อสร้างตำแหน่งงานในระบบ"
            />

            <div className="p-6">
                <Link href="/admin/marketplace/job-positions"
                    className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                    กลับรายการตำแหน่งงาน
                </Link>

                <form onSubmit={handleSubmit} className="space-y-5">

                    {/* ══════════════════════════════════════════
                        Row 1 — สถานะ (narrow) | ข้อมูลตำแหน่ง (wide)
                    ══════════════════════════════════════════ */}
                    <div className="grid gap-5 xl:grid-cols-[320px_1fr]">

                        {/* ── สถานะและระบบ ── */}
                        <Section icon="🪪" title="สถานะและระบบ" description="รหัสตำแหน่งและสถานะปัจจุบัน">
                            <div className="space-y-4">

                                {/* Icon preview */}
                                <div className="flex justify-center">
                                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-accent-soft text-4xl">
                                        {form.type === "ฝึกงาน" ? "🎓" : "💼"}
                                    </div>
                                </div>

                                <Field label="รหัสตำแหน่งงาน" required
                                    hintError={!!idDuplicate}
                                    hint={idDuplicate ? "⚠️ รหัสนี้มีอยู่ในระบบแล้ว" : "เช่น JOB-011"}>
                                    <input type="text" value={form.id} onChange={set("id")} placeholder="JOB-011"
                                        className={inputCls + (idDuplicate ? " border-red-400" : "")} />
                                </Field>

                                <Field label="สถานะ" required>
                                    <select value={form.status} onChange={set("status")} className={selectCls}>
                                        {JOB_STATUSES.map(s => <option key={s}>{s}</option>)}
                                    </select>
                                </Field>

                                <Field label="ประเภท" required>
                                    <select value={form.type} onChange={set("type")} className={selectCls}>
                                        {JOB_TYPES.map(t => <option key={t}>{t}</option>)}
                                    </select>
                                </Field>

                                <Field label="จำนวนที่รับ (คน)">
                                    <input type="number" min="0" value={form.slots} onChange={set("slots")}
                                        placeholder="0" className={inputCls} />
                                </Field>
                            </div>
                        </Section>

                        {/* ── ข้อมูลตำแหน่งงาน ── */}
                        <Section icon="📋" title="ข้อมูลตำแหน่งงาน" description="ชื่อตำแหน่งและรายละเอียดบริษัท">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field label="ชื่อตำแหน่ง (ไทย)" required>
                                    <input type="text" value={form.title} onChange={set("title")}
                                        placeholder="วิศวกรซอฟต์แวร์ฝึกงาน" className={inputCls} />
                                </Field>
                                <Field label="ชื่อตำแหน่ง (EN)">
                                    <input type="text" value={form.titleEn} onChange={set("titleEn")}
                                        placeholder="Software Engineering Intern" className={inputCls} />
                                </Field>
                            </div>

                            <div className="mt-4">
                                <Field label="ชื่อบริษัท" required>
                                    <input type="text" value={form.companyName} onChange={set("companyName")}
                                        placeholder="บริษัท โตโยต้า มอเตอร์ ประเทศไทย จำกัด" className={inputCls} />
                                </Field>
                            </div>

                            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                <Field label="สาขาวิชา" required>
                                    <select value={form.field} onChange={set("field")} className={selectCls}>
                                        <option value="">-- เลือกสาขา --</option>
                                        {JOB_FIELDS.map(f => <option key={f}>{f}</option>)}
                                    </select>
                                </Field>
                                <Field label="เงินเดือน / ค่าตอบแทน">
                                    <input type="text" value={form.salary} onChange={set("salary")}
                                        placeholder="15,000 บาท/เดือน" className={inputCls} />
                                </Field>
                            </div>

                            {form.type === "ฝึกงาน" && (
                                <div className="mt-4">
                                    <Field label="ระยะเวลา">
                                        <input type="text" value={form.duration} onChange={set("duration")}
                                            placeholder="2 เดือน" className={inputCls} />
                                    </Field>
                                </div>
                            )}

                            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                <Field label="วันที่เริ่มงาน">
                                    <input type="date" value={form.startDate} onChange={set("startDate")} className={inputCls} />
                                </Field>
                                <Field label="วันปิดรับสมัคร">
                                    <input type="date" value={form.deadline} onChange={set("deadline")} className={inputCls} />
                                </Field>
                            </div>
                        </Section>
                    </div>

                    {/* ══════════════════════════════════════════
                        Row 2 — รายละเอียด | ที่ตั้ง
                    ══════════════════════════════════════════ */}
                    <div className="grid gap-5 xl:grid-cols-2">

                        {/* ── รายละเอียดและคุณสมบัติ ── */}
                        <Section icon="📄" title="รายละเอียดและคุณสมบัติ">
                            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted">รายละเอียดงาน</p>
                            <Field label="รายละเอียด">
                                <textarea value={form.description} onChange={set("description")} rows={5}
                                    placeholder="อธิบายลักษณะงาน ความรับผิดชอบ และสิ่งที่จะได้เรียนรู้..."
                                    className={inputCls + " resize-none"} />
                            </Field>
                            <div className="mt-5 border-t border-border pt-4">
                                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted">คุณสมบัติที่ต้องการ</p>
                                <Field label="คุณสมบัติ / ข้อกำหนด">
                                    <textarea value={form.requirements} onChange={set("requirements")} rows={4}
                                        placeholder="ระดับการศึกษา สาขา ทักษะ หรือประสบการณ์ที่ต้องการ..."
                                        className={inputCls + " resize-none"} />
                                </Field>
                            </div>
                            <div className="mt-5 border-t border-border pt-4">
                                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted">สวัสดิการ</p>
                                <Field label="สวัสดิการที่ได้รับ" hint="เช่น ค่าเดินทาง ประกันสุขภาพ โบนัส ที่พัก ฯลฯ">
                                    <textarea value={form.welfare} onChange={set("welfare")} rows={3}
                                        placeholder="ค่าเดินทาง · ประกันอุบัติเหตุ · อาหารกลางวัน · โบนัส..."
                                        className={inputCls + " resize-none"} />
                                </Field>
                            </div>
                            <div className="mt-5 border-t border-border pt-4">
                                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted">ทักษะ / เครื่องมือ</p>
                                <Field label="Tags" hint="คั่นด้วย comma เช่น Python, Java, SQL">
                                    <input value={Array.isArray(form.tags) ? form.tags.join(", ") : ""}
                                        onChange={(e) => {
                                            const arr = e.target.value.split(",").map((t) => t.trim()).filter(Boolean);
                                            setForm((f) => ({ ...f, tags: arr }));
                                        }}
                                        placeholder="Python, Java, SQL, AutoCAD..."
                                        className={inputCls} />
                                </Field>
                            </div>
                        </Section>

                        {/* ── ที่ตั้ง ── */}
                        <Section icon="📍" title="ที่ตั้ง" description="จังหวัดและประเทศที่ตั้งของตำแหน่งงาน">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field label="จังหวัด / เมือง">
                                    <input type="text" value={form.location} onChange={set("location")}
                                        placeholder="สมุทรปราการ" className={inputCls} />
                                </Field>
                                <Field label="ประเทศ">
                                    <select value={form.country} onChange={set("country")} className={selectCls}>
                                        {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                                    </select>
                                </Field>
                            </div>
                        </Section>
                    </div>

                    {/* ── หมายเหตุ ── */}
                    <Section icon="📝" title="หมายเหตุ" description="ข้อมูลเพิ่มเติม (ไม่บังคับ)">
                        <textarea value={form.note} onChange={set("note")} rows={3}
                            placeholder="บันทึกเพิ่มเติม เช่น เงื่อนไขพิเศษ หรือข้อมูลอื่นๆ..."
                            className={inputCls + " resize-none"} />
                    </Section>

                    {/* ── Bottom action bar ── */}
                    <div className="flex items-center justify-between rounded-2xl border border-border bg-surface px-5 py-4">
                        <p className="text-xs text-muted">
                            <span className="text-red-500">*</span> จำเป็นต้องกรอก
                        </p>
                        <div className="flex items-center gap-3">
                            <Link href="/admin/marketplace/job-positions"
                                className="rounded-xl border border-border px-5 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors">
                                ยกเลิก
                            </Link>
                            <button type="submit" disabled={!isValid || saving}
                                className="btn-primary inline-flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
                                {saving ? (
                                    <>
                                        <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                        </svg>
                                        กำลังบันทึก...
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        บันทึกข้อมูล
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                </form>
            </div>
        </>
    );
}
