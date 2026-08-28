"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMappings } from "@/components/admin/contexts/MappingContext";
import { useStudents } from "@/components/admin/contexts/StudentContext";
import { useJobs } from "@/components/admin/contexts/JobContext";
import { useInternships } from "@/components/admin/contexts/InternshipContext";

const MAPPING_STATUSES = ["สมัครแล้ว", "ผ่านการคัดเลือก", "ไม่ผ่านการคัดเลือก"];
const JOB_TYPES        = ["ฝึกงาน", "งานประจำ"];
const INTERNSHIP_STATUSES = ["อยู่ในระหว่างฝึกงาน", "เสร็จสิ้น", "ยกเลิก"];

const STATUS_CONFIG = {
    สมัครแล้ว:          { color: "bg-blue-100 text-blue-700 border-blue-200",          dot: "bg-blue-500" },
    ผ่านการคัดเลือก:    { color: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
    ไม่ผ่านการคัดเลือก: { color: "bg-red-100 text-red-700 border-red-200",             dot: "bg-red-500" },
};

const INTERNSHIP_STATUS_CONFIG = {
    "อยู่ในระหว่างฝึกงาน": { color: "bg-sky-100 text-sky-700 border-sky-200",             dot: "bg-sky-500",     label: "กำลังฝึกงาน" },
    "เสร็จสิ้น":           { color: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", label: "ฝึกงานเสร็จสิ้น" },
    "ยกเลิก":              { color: "bg-red-100 text-red-700 border-red-200",             dot: "bg-red-500",     label: "ยกเลิกการฝึกงาน" },
};

const TYPE_BADGE = {
    ฝึกงาน:   "bg-sky-50 text-sky-700 border-sky-200",
    งานประจำ: "bg-violet-50 text-violet-700 border-violet-200",
};

const inputCls = "w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-accent-soft placeholder:text-muted";

function formatDate(str) {
    if (!str) return "—";
    const d = new Date(str);
    if (isNaN(d)) return str;
    return d.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
}

function InfoRow({ label, value }) {
    if (!value) return null;
    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">{label}</span>
            <span className="text-sm font-medium text-foreground">{value}</span>
        </div>
    );
}

function EField({ label, required, children }) {
    return (
        <div className="space-y-1.5">
            <label className="flex items-center gap-1 text-xs font-medium text-foreground">
                {label}{required && <span className="text-red-500">*</span>}
            </label>
            {children}
        </div>
    );
}

// ── Searchable picker ─────────────────────────────────────────
function SearchPicker({ label, required, placeholder, items, renderItem, renderSelected, value, onChange, filterFn }) {
    const [query, setQuery] = useState("");
    const [open, setOpen]   = useState(false);
    const ref               = useRef(null);
    const selected          = value ? items.find(i => i.id === value) : null;

    useEffect(() => {
        const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const filtered = useMemo(() => {
        if (!query.trim()) return items.slice(0, 50);
        return items.filter(item => filterFn(item, query.toLowerCase())).slice(0, 50);
    }, [items, query, filterFn]);

    return (
        <div className="space-y-1.5" ref={ref}>
            <label className="flex items-center gap-1 text-xs font-medium text-foreground">
                {label}{required && <span className="text-red-500">*</span>}
            </label>
            {selected ? (
                <div className="flex items-start gap-2 rounded-xl border border-primary bg-accent-soft/40 px-3 py-2">
                    <div className="flex-1 min-w-0">{renderSelected(selected)}</div>
                    <button type="button" onClick={() => { onChange(""); setQuery(""); }}
                        className="mt-0.5 shrink-0 flex h-5 w-5 items-center justify-center rounded-full hover:bg-primary/20 text-primary/60 hover:text-primary transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            ) : (
                <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                    <input type="text" value={query}
                        onChange={e => { setQuery(e.target.value); setOpen(true); }}
                        onFocus={() => setOpen(true)}
                        placeholder={placeholder}
                        className="w-full rounded-xl border border-border bg-surface pl-9 pr-4 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-accent-soft placeholder:text-muted" />
                    {open && (
                        <div className="absolute z-20 mt-1 w-full rounded-xl border border-border bg-surface shadow-lg overflow-hidden">
                            {filtered.length === 0 ? (
                                <div className="px-4 py-3 text-xs text-muted text-center">ไม่พบรายการ</div>
                            ) : (
                                <div className="max-h-52 overflow-y-auto divide-y divide-border">
                                    {filtered.map(item => (
                                        <button key={item.id} type="button"
                                            className="w-full px-3 py-2.5 text-left hover:bg-accent-soft/50 transition-colors"
                                            onMouseDown={e => { e.preventDefault(); onChange(item.id); setOpen(false); setQuery(""); }}>
                                            {renderItem(item)}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Delete Modal ──────────────────────────────────────────────
function DeleteModal({ studentName, jobTitle, onConfirm, onCancel }) {
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
                    <h2 className="text-lg font-bold text-foreground">ยืนยันการลบ Mapping</h2>
                    <p className="mt-2 text-sm font-semibold text-foreground">{studentName}</p>
                    <p className="text-xs text-muted">→ {jobTitle}</p>
                    <div className="mt-3 w-full rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-600">⚠️ การดำเนินการนี้ไม่สามารถย้อนกลับได้</div>
                </div>
                <div className="flex gap-3 border-t border-border px-6 py-4">
                    <button onClick={onCancel} className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-surface-muted transition-colors">ยกเลิก</button>
                    <button onClick={onConfirm} className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 transition-colors">ลบ Mapping</button>
                </div>
            </div>
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────
export default function MappingDetailPage() {
    const { id }       = useParams();
    const router       = useRouter();
    const searchParams = useSearchParams();
    const { mappings, ready, updateMapping, deleteMapping } = useMappings();
    const { students } = useStudents();
    const { jobs }     = useJobs();
    const { internships, addInternship, updateInternship } = useInternships();

    const mapping          = mappings.find(m => m.id === id) ?? null;
    const student          = mapping ? students.find(s => s.id === mapping.studentId) : null;
    const job              = mapping ? jobs.find(j => j.id === mapping.jobId) : null;
    const linkedInternship = mapping ? internships.find(i => i.applicationId === mapping.id) : null;

    const [editing, setEditing]             = useState(() => searchParams.get("edit") === "1");
    const [form, setForm]                   = useState(() => mapping ? { ...mapping } : {});
    const [jobTypeFilter, setJobTypeFilter] = useState("ทั้งหมด");
    const [showDelete, setShowDelete]       = useState(false);
    const [saving, setSaving]               = useState(false);

    const emptyInternForm = () => ({
        startDate: new Date().toISOString().slice(0, 10),
        endDate: "",
        supervisorName: "",
        advisorName: "",
        status: "อยู่ในระหว่างฝึกงาน",
        grade: "",
        note: "",
    });
    const [internForm, setInternForm]       = useState(emptyInternForm);
    const [internSaving, setInternSaving]   = useState(false);
    const [showInternForm, setShowInternForm] = useState(false);
    const [editingIntern, setEditingIntern] = useState(false);

    useEffect(() => { if (mapping && !form.id) setForm({ ...mapping }); }, [mapping]);
    useEffect(() => {
        if (linkedInternship) {
            setInternForm({
                startDate:      linkedInternship.startDate      ?? "",
                endDate:        linkedInternship.endDate        ?? "",
                supervisorName: linkedInternship.supervisorName ?? "",
                advisorName:    linkedInternship.advisorName    ?? "",
                status:         linkedInternship.status         ?? "อยู่ในระหว่างฝึกงาน",
                grade:          linkedInternship.grade          ?? "",
                note:           linkedInternship.note           ?? "",
            });
        }
    }, [linkedInternship?.id]);

    // ── useMemo ต้องอยู่ก่อน early return เสมอ (Rules of Hooks) ──
    const studentMappings = useMemo(() =>
        (form.studentId && mapping)
            ? mappings.filter(m => m.studentId === form.studentId && m.id !== mapping.id)
            : [],
        [form.studentId, mappings, mapping?.id]
    );

    if (!ready) return <div className="flex items-center justify-center py-24 text-sm text-muted">กำลังโหลดข้อมูล...</div>;
    if (!mapping) return (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
            <p className="text-4xl">🔗</p>
            <p className="text-sm font-medium text-foreground">ไม่พบ Mapping: {id}</p>
            <Link href="/admin/marketplace/applications" className="text-sm text-primary hover:underline">← กลับรายการ</Link>
        </div>
    );

    const d    = editing ? form : mapping;
    const sCfg = STATUS_CONFIG[d.status] ?? STATUS_CONFIG["สมัครแล้ว"];

    // current student/job based on form values (may differ from mapping when editing)
    const formStudent = students.find(s => s.id === form.studentId);
    const formJob     = jobs.find(j => j.id === form.jobId);

    // duplicate check (exclude self)
    const duplicate = editing && form.studentId && form.jobId &&
        mappings.some(m => m.id !== mapping.id && m.studentId === form.studentId && m.jobId === form.jobId);
    const isValid = !editing || (form.studentId && form.jobId && !duplicate);

    // original refs
    const origStudent = student;
    const origJob     = job;
    const origStatus  = mapping.status ?? "สมัครแล้ว";
    const origCfg     = STATUS_CONFIG[origStatus] ?? STATUS_CONFIG["สมัครแล้ว"];

    const restoreOriginal = () => {
        setForm({ ...mapping });
        setJobTypeFilter("ทั้งหมด");
    };

    // internship link

    const handleStartInternship = async () => {
        const nums = internships.map(i => parseInt(i.id.replace("INT-", ""), 10)).filter(Boolean);
        const newId = `INT-${String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3, "0")}`;
        addInternship({
            id: newId,
            applicationId: mapping.id,
            studentId: mapping.studentId,
            jobId: mapping.jobId,
            ...internForm,
            createdAt: new Date().toISOString().slice(0, 10),
        });
        setShowInternForm(false);
    };

    const handleSaveInternship = async () => {
        if (!linkedInternship) return;
        setInternSaving(true);
        updateInternship(linkedInternship.id, internForm);
        await new Promise(r => setTimeout(r, 300));
        setInternSaving(false);
        setEditingIntern(false);
    };

    const handleSave = async () => {
        if (!isValid) return;
        setSaving(true);
        updateMapping(mapping.id, {
            studentId:   form.studentId,
            jobId:       form.jobId,
            status:      form.status,
            appliedDate: form.appliedDate,
            note:        form.note,
        });
        await new Promise(r => setTimeout(r, 300));
        setSaving(false);
        setEditing(false);
        router.replace(`/admin/marketplace/applications/${mapping.id}`);
    };

    const cancelEdit = () => {
        setEditing(false);
        setForm({ ...mapping });
        setJobTypeFilter("ทั้งหมด");
        router.replace(`/admin/marketplace/applications/${mapping.id}`);
    };

    const handleDelete = () => {
        deleteMapping(mapping.id);
        router.push("/admin/marketplace/applications");
    };

    const studentName = student ? `${student.prefix}${student.name} ${student.lastname}` : mapping.studentId;
    const jobTitle    = job?.title ?? mapping.jobId;

    // displayed values for hero (view=mapping, edit=form-resolved)
    const heroStudent = editing ? formStudent : student;
    const heroJob     = editing ? formJob : job;
    const heroName    = heroStudent ? `${heroStudent.prefix}${heroStudent.name} ${heroStudent.lastname}` : (form.studentId || mapping.studentId);
    const heroTitle   = heroJob?.title ?? (form.jobId || mapping.jobId);

    return (
        <>
            {showDelete && (
                <DeleteModal
                    studentName={studentName}
                    jobTitle={jobTitle}
                    onConfirm={handleDelete}
                    onCancel={() => setShowDelete(false)}
                />
            )}

            {/* ── Sticky top bar ── */}
            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-surface/95 px-6 py-2.5 backdrop-blur">
                <Link href="/admin/marketplace/applications"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                    กลับรายการ
                </Link>
                <div className="flex items-center gap-2">
                    {editing ? (
                        <>
                            <button type="button" onClick={cancelEdit}
                                className="inline-flex items-center rounded-lg border border-border px-3.5 py-1.5 text-sm font-medium text-muted hover:text-foreground transition-colors">
                                ยกเลิก
                            </button>
                            <button type="button" onClick={handleSave} disabled={saving || !isValid}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-primary bg-primary px-3.5 py-1.5 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed">
                                {saving
                                    ? <><svg className="h-3.5 w-3.5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>กำลังบันทึก...</>
                                    : <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                        บันทึก
                                    </>}
                            </button>
                        </>
                    ) : (
                        <>
                            <button type="button" onClick={() => { setForm({ ...mapping }); setEditing(true); }}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-1.5 text-sm font-medium text-muted hover:border-amber-400 hover:text-amber-600 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                </svg>
                                แก้ไข
                            </button>
                            <button type="button" onClick={() => setShowDelete(true)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-1.5 text-sm font-medium text-muted hover:border-red-400 hover:text-red-500 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                ลบ
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="p-6 space-y-5 max-w-6xl">

                {/* ── Hero connection card ── */}
                <div className="card p-0 overflow-hidden">
                    <div className={`h-1.5 w-full ${sCfg.dot}`} />
                    <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
                        {/* student → job */}
                        <div className="flex items-center gap-3 min-w-0 flex-1 flex-wrap">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xl">👤</div>
                            <div className="min-w-0">
                                <p className="text-xs text-muted">นักเรียน</p>
                                <p className="text-base font-bold text-foreground truncate">{heroName}</p>
                                {heroStudent && <p className="text-xs text-muted truncate">{heroStudent.university} · {heroStudent.major}</p>}
                            </div>
                            <div className="shrink-0 flex items-center gap-1.5 px-2">
                                <div className="h-px w-6 bg-border" />
                                <div className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-bold ${sCfg.color}`}>→</div>
                                <div className="h-px w-6 bg-border" />
                            </div>
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xl">💼</div>
                            <div className="min-w-0">
                                <p className="text-xs text-muted">ตำแหน่งงาน</p>
                                <p className="text-base font-bold text-foreground truncate">{heroTitle}</p>
                                {heroJob && <p className="text-xs text-muted truncate">{heroJob.companyName} · {heroJob.type}</p>}
                            </div>
                        </div>
                        {/* metadata */}
                        <div className="flex items-center gap-5 shrink-0 sm:border-l sm:border-border sm:pl-6">
                            <div className="text-center">
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted mb-1.5">สถานะ</p>
                                <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold ${sCfg.color}`}>
                                    <span className={`h-2 w-2 rounded-full ${sCfg.dot}`} />{d.status}
                                </span>
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted mb-1.5">วันที่สมัคร</p>
                                <p className="text-sm font-semibold text-foreground">{formatDate(d.appliedDate)}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted mb-1.5">รหัส</p>
                                <p className="text-sm font-mono font-medium text-muted">{mapping.id}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Edit mode ── */}
                {editing && (
                    <div className="card p-0 overflow-hidden">
                        {/* Edit card header: title + save/cancel + restore */}
                        <div className="border-b border-border bg-surface-muted px-5 py-3">
                            <div className="flex items-center justify-between gap-2 mb-2">
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">ข้อมูลเดิม (อ้างอิง)</p>
                                <button type="button" onClick={restoreOriginal}
                                    className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1 text-[11px] font-medium text-muted hover:border-primary hover:text-primary transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                                    </svg>
                                    คืนค่าเดิม
                                </button>
                            </div>
                            <div className="flex items-start gap-4 flex-wrap">
                                <div className="flex items-start gap-2">
                                    <span className="text-xs text-muted mt-0.5 shrink-0">👤</span>
                                    <div>
                                        <p className="text-xs font-semibold text-foreground">
                                            {origStudent ? `${origStudent.prefix}${origStudent.name} ${origStudent.lastname}` : mapping.studentId}
                                        </p>
                                        {origStudent && <p className="text-[10px] text-muted">{origStudent.id} · {origStudent.university}</p>}
                                    </div>
                                </div>
                                <span className="text-muted self-center text-sm">→</span>
                                <div className="flex items-start gap-2 flex-1 min-w-0">
                                    <span className="text-xs text-muted mt-0.5 shrink-0">💼</span>
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold text-foreground truncate">
                                            {origJob ? origJob.title : mapping.jobId}
                                        </p>
                                        {origJob && <p className="text-[10px] text-muted truncate">{origJob.companyName} · {origJob.type}</p>}
                                    </div>
                                </div>
                                <span className={`shrink-0 self-center inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${origCfg.color}`}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${origCfg.dot}`} />{origStatus}
                                </span>
                            </div>
                        </div>

                        <div className="p-5 space-y-5">

                            {/* Student picker */}
                            <div className="rounded-xl border border-border p-4 space-y-3">
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted">👤 นักเรียน</p>
                                <SearchPicker
                                    label="เลือกนักเรียน" required
                                    placeholder="พิมพ์ชื่อ, รหัส, หรือมหาวิทยาลัย..."
                                    items={students}
                                    value={form.studentId}
                                    onChange={v => setForm(p => ({ ...p, studentId: v }))}
                                    filterFn={(s, q) => [s.id, s.name, s.lastname, s.nameEn, s.lastnameEn, s.nickname, s.university, s.major]
                                        .some(v => String(v ?? "").toLowerCase().includes(q))}
                                    renderItem={s => {
                                        const stuMaps   = mappings.filter(m => m.studentId === s.id && m.id !== mapping.id);
                                        const hasActive = stuMaps.some(m => ["สมัครแล้ว", "ผ่านการคัดเลือก"].includes(m.status));
                                        return (
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <p className="text-sm font-medium text-foreground">{s.prefix}{s.name} {s.lastname}</p>
                                                    <p className="text-xs text-muted">{s.id} · {s.university}</p>
                                                    {s.major && <p className="text-[10px] text-muted/70">{s.major} ปี {s.year}</p>}
                                                </div>
                                                <div className="shrink-0 flex flex-col items-end gap-1">
                                                    {stuMaps.length > 0 ? (
                                                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${hasActive ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-gray-100 text-gray-500 border-gray-200"}`}>
                                                            {stuMaps.length} mapping
                                                        </span>
                                                    ) : (
                                                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">ยังไม่มี</span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    }}
                                    renderSelected={s => (
                                        <div>
                                            <p className="text-sm font-semibold text-foreground">{s.prefix}{s.name} {s.lastname}</p>
                                            <p className="text-xs text-muted">{s.id} · {s.university} · {s.major}</p>
                                        </div>
                                    )}
                                />
                                {studentMappings.length > 0 && (
                                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                                        <p className="text-xs font-semibold text-amber-700 mb-1.5">⚠️ นักเรียนคนนี้มี Mapping อื่นอยู่ {studentMappings.length} รายการ</p>
                                        <div className="space-y-1">
                                            {studentMappings.map(m => {
                                                const j   = jobs.find(x => x.id === m.jobId);
                                                const cfg = STATUS_CONFIG[m.status] ?? STATUS_CONFIG["สมัครแล้ว"];
                                                return (
                                                    <div key={m.id} className="flex items-center justify-between gap-2">
                                                        <p className="text-[11px] text-amber-800 truncate">{j?.title ?? m.jobId} — {j?.companyName}</p>
                                                        <span className={`shrink-0 inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${cfg.color}`}>
                                                            <span className={`h-1 w-1 rounded-full ${cfg.dot}`} />{m.status}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Job / Status / Detail — merged block */}
                            <div className="rounded-xl border border-border overflow-hidden">
                                <div className="border-b border-border bg-surface-muted px-4 py-2.5">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">💼 ตำแหน่งงาน · สถานะ · รายละเอียด</p>
                                </div>
                                <div className="p-4 space-y-4">
                                    {/* Job picker */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between gap-2 flex-wrap">
                                            <label className="text-xs font-medium text-foreground">ตำแหน่งงาน <span className="text-red-500">*</span></label>
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                {["ทั้งหมด", ...JOB_TYPES].map(t => (
                                                    <button key={t} type="button"
                                                        onClick={() => { setJobTypeFilter(t); setForm(p => ({ ...p, jobId: "" })); }}
                                                        className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-all ${
                                                            jobTypeFilter === t
                                                                ? t === "ทั้งหมด" ? "border-primary bg-primary text-white" : `${TYPE_BADGE[t] ?? ""} border-current ring-1 ring-offset-1 ring-current`
                                                                : "border-border text-muted hover:border-primary hover:text-primary bg-surface"
                                                        }`}>
                                                        {t}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <SearchPicker
                                            label="เลือกตำแหน่งงาน" required
                                            placeholder="พิมพ์ชื่อตำแหน่ง, บริษัท, หรือสาขา..."
                                            items={jobTypeFilter === "ทั้งหมด" ? jobs : jobs.filter(j => j.type === jobTypeFilter)}
                                            value={form.jobId}
                                            onChange={v => setForm(p => ({ ...p, jobId: v }))}
                                            filterFn={(j, q) => [j.id, j.title, j.titleEn, j.companyName, j.field, j.type, j.location]
                                                .some(v => String(v ?? "").toLowerCase().includes(q))}
                                            renderItem={j => {
                                                const slotsFull = j.slots > 0 && j.applications >= j.slots;
                                                return (
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-medium text-foreground truncate">{j.title}</p>
                                                            <p className="text-xs text-muted truncate">{j.companyName}</p>
                                                            <p className="text-[10px] text-muted/70">{j.field} · {j.location}</p>
                                                        </div>
                                                        <div className="shrink-0 flex flex-col items-end gap-1">
                                                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${TYPE_BADGE[j.type] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>{j.type}</span>
                                                            {j.slots > 0 && (
                                                                <span className={`text-[10px] font-medium ${slotsFull ? "text-red-500" : "text-emerald-600"}`}>
                                                                    {j.applications}/{j.slots} คน
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            }}
                                            renderSelected={j => (
                                                <div>
                                                    <p className="text-sm font-semibold text-foreground">{j.title}</p>
                                                    <p className="text-xs text-muted">{j.companyName} · {j.field}</p>
                                                    <div className="mt-1 flex items-center gap-2">
                                                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${TYPE_BADGE[j.type] ?? ""}`}>{j.type}</span>
                                                        {j.slots > 0 && <span className="text-[10px] text-muted">รับ {j.slots} คน (สมัคร {j.applications} คน)</span>}
                                                    </div>
                                                </div>
                                            )}
                                        />
                                        {duplicate && (
                                            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-600">
                                                ⚠️ นักเรียนคนนี้มี Mapping กับตำแหน่งนี้อยู่แล้ว
                                            </div>
                                        )}
                                    </div>

                                    <div className="border-t border-border" />

                                    {/* Status */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-foreground">สถานะ <span className="text-red-500">*</span></label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {MAPPING_STATUSES.map(s => {
                                                const cfg = STATUS_CONFIG[s];
                                                return (
                                                    <button key={s} type="button"
                                                        onClick={() => setForm(p => ({ ...p, status: s }))}
                                                        className={`rounded-xl border p-2.5 text-left transition-all ${form.status === s ? `${cfg.color} border-current ring-2 ring-offset-1 ring-current` : "border-border hover:border-primary"}`}>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`h-2 w-2 shrink-0 rounded-full ${cfg.dot}`} />
                                                            <span className="text-xs font-medium leading-tight">{s}</span>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="border-t border-border" />

                                    {/* Date + Note */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <EField label="วันที่สมัคร">
                                            <input type="date" value={form.appliedDate ?? ""} onChange={e => setForm(p => ({ ...p, appliedDate: e.target.value }))} className={inputCls} />
                                        </EField>
                                        <EField label="หมายเหตุ">
                                            <textarea value={form.note ?? ""} onChange={e => setForm(p => ({ ...p, note: e.target.value }))} rows={3}
                                                placeholder="บันทึกเพิ่มเติม..." className={inputCls + " resize-none"} />
                                        </EField>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                )}

                {/* ── Row: Student card | Job card ── */}
                <div className="grid gap-5 lg:grid-cols-2">
                    {/* Student card */}
                    <div className="card p-0 overflow-hidden">
                        <div className="flex items-center gap-3 border-b border-border px-5 py-3.5 bg-surface-muted">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-soft text-sm">👤</span>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-foreground">ข้อมูลนักเรียน</p>
                                {student && <p className="text-xs text-muted font-mono">{student.id}</p>}
                            </div>
                            {student && (
                                <Link href={`/admin/students/${student.id}`}
                                    className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted hover:border-primary hover:text-primary transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                    </svg>
                                    ดูโปรไฟล์
                                </Link>
                            )}
                        </div>
                        {student ? (
                            <div className="p-5 space-y-4">
                                <div>
                                    <p className="text-xl font-bold text-foreground">{student.prefix}{student.name} {student.lastname}</p>
                                    {student.nameEn && <p className="text-sm text-muted">{student.nameEn} {student.lastnameEn}</p>}
                                    {student.nickname && <p className="text-xs text-muted">(ชื่อเล่น: {student.nickname})</p>}
                                </div>
                                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                                    <InfoRow label="มหาวิทยาลัย" value={student.university} />
                                    <InfoRow label="สาขาวิชา" value={student.major} />
                                    <InfoRow label="ชั้นปี" value={student.year ? `ปีที่ ${student.year}` : null} />
                                    <InfoRow label="เกรดเฉลี่ย (GPA)" value={student.gpa} />
                                    <InfoRow label="อีเมล" value={student.email} />
                                    <InfoRow label="เบอร์โทร" value={student.phone} />
                                </div>
                            </div>
                        ) : (
                            <div className="p-5">
                                <p className="text-sm font-mono text-muted">{mapping.studentId}</p>
                                <p className="text-xs text-muted mt-1">ไม่พบข้อมูลนักเรียนในระบบ</p>
                            </div>
                        )}
                    </div>

                    {/* Job card */}
                    <div className="card p-0 overflow-hidden">
                        <div className="flex items-center gap-3 border-b border-border px-5 py-3.5 bg-surface-muted">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-soft text-sm">💼</span>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-foreground">ข้อมูลตำแหน่งงาน</p>
                                {job && <p className="text-xs text-muted font-mono">{job.id}</p>}
                            </div>
                            {job && (
                                <Link href={`/admin/marketplace/job-positions/${job.id}`}
                                    className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted hover:border-primary hover:text-primary transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                    </svg>
                                    ดูตำแหน่ง
                                </Link>
                            )}
                        </div>
                        {job ? (
                            <div className="p-5 space-y-4">
                                <div>
                                    <p className="text-xl font-bold text-foreground">{job.title}</p>
                                    {job.titleEn && <p className="text-sm text-muted">{job.titleEn}</p>}
                                    <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                                        <span className="text-sm font-semibold text-foreground">{job.companyName}</span>
                                        <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${TYPE_BADGE[job.type] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>{job.type}</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                                    <InfoRow label="สาขาวิชา" value={job.field} />
                                    <InfoRow label="ที่ตั้ง" value={job.location ? `${job.location}${job.country ? ` · ${job.country}` : ""}` : null} />
                                    <InfoRow label="เงินเดือน/ค่าตอบแทน" value={job.salary} />
                                    <InfoRow label="ระยะเวลา" value={job.duration} />
                                    <InfoRow label="วันเริ่มงาน" value={formatDate(job.startDate)} />
                                    <InfoRow label="รับ/สมัครแล้ว" value={job.slots > 0 ? `${job.applications}/${job.slots} คน` : null} />
                                </div>
                            </div>
                        ) : (
                            <div className="p-5">
                                <p className="text-sm font-mono text-muted">{mapping.jobId}</p>
                                <p className="text-xs text-muted mt-1">ไม่พบข้อมูลตำแหน่งงานในระบบ</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Row: Note | System info (view mode only) ── */}
                {!editing && (
                    <div className="grid gap-5 lg:grid-cols-2">
                        <div className="card p-0 overflow-hidden">
                            <div className="flex items-center gap-3 border-b border-border px-5 py-3.5 bg-surface-muted">
                                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-soft text-sm">📝</span>
                                <p className="text-sm font-semibold text-foreground">หมายเหตุ</p>
                            </div>
                            <div className="p-5">
                                {d.note
                                    ? <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{d.note}</p>
                                    : <p className="text-sm text-muted italic">ไม่มีหมายเหตุ</p>}
                            </div>
                        </div>

                        <div className="card p-0 overflow-hidden">
                            <div className="flex items-center gap-3 border-b border-border px-5 py-3.5 bg-surface-muted">
                                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-soft text-sm">🗂️</span>
                                <p className="text-sm font-semibold text-foreground">ข้อมูลระบบ</p>
                            </div>
                            <div className="p-5 space-y-4">
                                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                                    <InfoRow label="รหัส Mapping" value={mapping.id} />
                                    <InfoRow label="วันที่สมัคร" value={formatDate(mapping.appliedDate)} />
                                    <InfoRow label="รหัสนักเรียน" value={mapping.studentId} />
                                    <InfoRow label="รหัสตำแหน่ง" value={mapping.jobId} />
                                </div>
                                <div className="pt-1 border-t border-border">
                                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted mb-2">สถานะทั้งหมด</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {MAPPING_STATUSES.map(s => {
                                            const cfg      = STATUS_CONFIG[s];
                                            const isActive = s === mapping.status;
                                            return (
                                                <span key={s} className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${isActive ? `${cfg.color} font-bold` : "border-border text-muted opacity-40"}`}>
                                                    <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />{s}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Internship details section ── */}
                {!editing && mapping.status === "ผ่านการคัดเลือก" && job?.type === "ฝึกงาน" && (
                    !linkedInternship && !showInternForm ? (
                        <div className="card flex items-center justify-between gap-4 px-5 py-4">
                            <div className="flex items-center gap-3">
                                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-soft text-sm">🎓</span>
                                <p className="text-sm text-muted">ยังไม่มีรายการฝึกงาน</p>
                            </div>
                            <button type="button" onClick={() => setShowInternForm(true)}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 hover:border-emerald-400 transition-colors shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                                เพิ่มการฝึกงาน
                            </button>
                        </div>
                    ) : linkedInternship && !editingIntern ? (
                        /* ── Internship VIEW mode ── */
                        <div className="card p-0 overflow-hidden">
                            <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5 bg-surface-muted">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-soft text-sm">🎓</span>
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">รายละเอียดการฝึกงาน</p>
                                        <p className="text-xs text-muted font-mono">{linkedInternship.id}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {(() => {
                                        const cfg = INTERNSHIP_STATUS_CONFIG[linkedInternship.status] ?? INTERNSHIP_STATUS_CONFIG["อยู่ในระหว่างฝึกงาน"];
                                        return (
                                            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${cfg.color}`}>
                                                <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />{cfg.label ?? linkedInternship.status}
                                            </span>
                                        );
                                    })()}
                                    <button type="button"
                                        onClick={() => { setInternForm({ startDate: linkedInternship.startDate ?? "", endDate: linkedInternship.endDate ?? "", supervisorName: linkedInternship.supervisorName ?? "", advisorName: linkedInternship.advisorName ?? "", status: linkedInternship.status ?? "อยู่ในระหว่างฝึกงาน", grade: linkedInternship.grade ?? "", note: linkedInternship.note ?? "" }); setEditingIntern(true); }}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted hover:border-primary hover:text-primary transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                                        แก้ไข
                                    </button>
                                </div>
                            </div>
                            <div className="p-5 space-y-4">
                                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                                    <InfoRow label="วันเริ่มต้น"             value={formatDate(linkedInternship.startDate)} />
                                    <InfoRow label="วันสิ้นสุด"             value={formatDate(linkedInternship.endDate)} />
                                    <InfoRow label="ผู้ดูแล (สถานประกอบการ)" value={linkedInternship.supervisorName} />
                                    <InfoRow label="อาจารย์ที่ปรึกษา"       value={linkedInternship.advisorName} />
                                    <InfoRow label="เกรด"                   value={linkedInternship.grade} />
                                </div>
                                {linkedInternship.note && (
                                    <div className="pt-3 border-t border-border">
                                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted mb-1">หมายเหตุ</p>
                                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{linkedInternship.note}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : editingIntern ? (
                        /* ── Internship EDIT mode — inline style matching view ── */
                        <div className="card p-0 overflow-hidden">
                            <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5 bg-surface-muted">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-soft text-sm">🎓</span>
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">รายละเอียดการฝึกงาน</p>
                                        <p className="text-xs text-muted font-mono">{linkedInternship.id}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button type="button" onClick={() => setEditingIntern(false)}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted hover:border-border hover:text-foreground transition-colors">
                                        ยกเลิก
                                    </button>
                                    <button type="button" onClick={handleSaveInternship} disabled={internSaving}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-primary bg-primary px-2.5 py-1.5 text-xs font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed">
                                        {internSaving
                                            ? <><svg className="h-3.5 w-3.5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>กำลังบันทึก...</>
                                            : <>บันทึก</>}
                                    </button>
                                </div>
                            </div>
                            <div className="p-5 space-y-4">
                                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                                    {[
                                        { label: "วันเริ่มต้น",              key: "startDate",      type: "date" },
                                        { label: "วันสิ้นสุด",              key: "endDate",        type: "date" },
                                        { label: "ผู้ดูแล (สถานประกอบการ)", key: "supervisorName", type: "text", placeholder: "ชื่อผู้ดูแล..." },
                                        { label: "อาจารย์ที่ปรึกษา",       key: "advisorName",    type: "text", placeholder: "ชื่ออาจารย์..." },
                                        { label: "เกรด",                    key: "grade",          type: "text", placeholder: "A, B+, ..." },
                                    ].map(({ label, key, type, placeholder }) => (
                                        <div key={key} className="flex flex-col gap-0.5">
                                            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">{label}</span>
                                            <input type={type} value={internForm[key]} placeholder={placeholder ?? ""}
                                                onChange={e => setInternForm(p => ({ ...p, [key]: e.target.value }))}
                                                className="bg-transparent border-b border-border focus:border-primary outline-none text-sm font-medium text-foreground py-0.5 w-full transition-colors" />
                                        </div>
                                    ))}
                                </div>
                                <div className="pt-1">
                                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted mb-2">สถานะการฝึกงาน</p>
                                    <div className="flex flex-wrap gap-2">
                                        {INTERNSHIP_STATUSES.map(s => {
                                            const cfg = INTERNSHIP_STATUS_CONFIG[s];
                                            const active = internForm.status === s;
                                            return (
                                                <button key={s} type="button" onClick={() => setInternForm(p => ({ ...p, status: s }))}
                                                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-all ${active ? `${cfg.color} border-current ring-2 ring-offset-1 ring-current` : "border-border text-muted hover:border-primary hover:text-foreground"}`}>
                                                    <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />{cfg.label ?? s}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="pt-3 border-t border-border">
                                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted mb-1">หมายเหตุ</p>
                                    <textarea value={internForm.note} rows={3} placeholder="บันทึกเพิ่มเติม..."
                                        onChange={e => setInternForm(p => ({ ...p, note: e.target.value }))}
                                        className="w-full bg-transparent border-b border-border focus:border-primary outline-none text-sm text-foreground leading-relaxed resize-none py-0.5 transition-colors" />
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* ── Internship CREATE form ── */
                        <div className="card p-0 overflow-hidden">
                            <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5 bg-surface-muted">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-soft text-sm">🎓</span>
                                    <p className="text-sm font-semibold text-foreground">เพิ่มรายละเอียดการฝึกงาน</p>
                                </div>
                                <button type="button" onClick={() => setShowInternForm(false)}
                                    className="text-xs font-medium text-muted hover:text-foreground transition-colors">
                                    ยกเลิก
                                </button>
                            </div>
                            <div className="p-5 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-foreground">วันเริ่มต้น</label>
                                        <input type="date" value={internForm.startDate} onChange={e => setInternForm(p => ({ ...p, startDate: e.target.value }))} className={inputCls} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-foreground">วันสิ้นสุด</label>
                                        <input type="date" value={internForm.endDate} onChange={e => setInternForm(p => ({ ...p, endDate: e.target.value }))} className={inputCls} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-foreground">ผู้ดูแล (สถานประกอบการ)</label>
                                        <input type="text" value={internForm.supervisorName} onChange={e => setInternForm(p => ({ ...p, supervisorName: e.target.value }))} placeholder="ชื่อผู้ดูแล..." className={inputCls} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-foreground">อาจารย์ที่ปรึกษา</label>
                                        <input type="text" value={internForm.advisorName} onChange={e => setInternForm(p => ({ ...p, advisorName: e.target.value }))} placeholder="ชื่ออาจารย์..." className={inputCls} />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-foreground">สถานะการฝึกงาน</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {INTERNSHIP_STATUSES.map(s => {
                                            const cfg = INTERNSHIP_STATUS_CONFIG[s];
                                            return (
                                                <button key={s} type="button"
                                                    onClick={() => setInternForm(p => ({ ...p, status: s }))}
                                                    className={`rounded-xl border p-2.5 text-left transition-all ${internForm.status === s ? `${cfg.color} border-current ring-2 ring-offset-1 ring-current` : "border-border hover:border-primary"}`}>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={`h-2 w-2 shrink-0 rounded-full ${cfg.dot}`} />
                                                        <span className="text-xs font-medium leading-tight">{cfg.label ?? s}</span>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-foreground">เกรด</label>
                                        <input type="text" value={internForm.grade} onChange={e => setInternForm(p => ({ ...p, grade: e.target.value }))} placeholder="A, B+, ..." className={inputCls} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-foreground">หมายเหตุ</label>
                                        <textarea value={internForm.note} onChange={e => setInternForm(p => ({ ...p, note: e.target.value }))} rows={3} placeholder="บันทึกเพิ่มเติม..." className={inputCls + " resize-none"} />
                                    </div>
                                </div>
                                <div className="flex justify-end pt-1">
                                    <button type="button" onClick={handleStartInternship}
                                        className="btn-primary inline-flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                        สร้างรายการฝึกงาน
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                )}

            </div>

            {/* duplicate warning bar */}
            {editing && duplicate && (
                <div className="sticky bottom-0 z-30 border-t border-red-200 bg-red-50 px-6 py-3">
                    <p className="text-sm text-red-600 font-medium text-center">⚠️ มี Mapping ซ้ำกัน — ไม่สามารถบันทึกได้จนกว่าจะเปลี่ยนนักเรียนหรือตำแหน่งงาน</p>
                </div>
            )}
        </>
    );
}
