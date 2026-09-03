"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMappings } from "@/components/admin/contexts/MappingContext";
import { useStudents } from "@/components/admin/contexts/StudentContext";
import { useJobs } from "@/components/admin/contexts/JobContext";
import AdminTopBar from "@/components/admin/ui/AdminTopBar";

// ── Constants ─────────────────────────────────────────────────
const MAPPING_STATUSES = ["สมัครแล้ว", "ผ่านการคัดเลือก", "ไม่ผ่านการคัดเลือก"];
const JOB_TYPES        = ["ฝึกงาน", "งานประจำ"];

const STATUS_CONFIG = {
    สมัครแล้ว:          { color: "bg-blue-100 text-blue-700 border-blue-200",          dot: "bg-blue-500" },
    ผ่านการคัดเลือก:    { color: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
    ไม่ผ่านการคัดเลือก: { color: "bg-red-100 text-red-700 border-red-200",             dot: "bg-red-500" },
};

const TYPE_BADGE = {
    ฝึกงาน:   "bg-sky-50 text-sky-700 border-sky-200",
    งานประจำ: "bg-violet-50 text-violet-700 border-violet-200",
};

const inputCls = "w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-accent-soft placeholder:text-muted";

function nextId(mappings) {
    const nums = mappings.map(m => parseInt(m.id.replace("MAP-", ""), 10)).filter(Boolean);
    return `MAP-${String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3, "0")}`;
}

// ── EField ────────────────────────────────────────────────────
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

// ── SearchPicker ──────────────────────────────────────────────
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

// ── Page ──────────────────────────────────────────────────────
export default function NewMappingPage() {
    const router                  = useRouter();
    const { mappings, ready, addMapping } = useMappings();
    const { students }            = useStudents();
    const { jobs }                = useJobs();

    const [studentId, setStudentId]     = useState("");
    const [jobId, setJobId]             = useState("");
    const [status, setStatus]           = useState("สมัครแล้ว");
    const [appliedDate, setAppliedDate] = useState(new Date().toISOString().slice(0, 10));
    const [note, setNote]               = useState("");
    const [jobTypeFilter, setJobTypeFilter] = useState("ทั้งหมด");
    const [saving, setSaving]           = useState(false);

    const student = students.find(s => s.id === studentId) ?? null;
    const job     = jobs.find(j => j.id === jobId) ?? null;

    const studentMappings = useMemo(() =>
        studentId ? mappings.filter(m => m.studentId === studentId) : [],
        [studentId, mappings]
    );

    const duplicate = studentId && jobId && mappings.some(m => m.studentId === studentId && m.jobId === jobId);
    const isValid   = studentId && jobId && !duplicate;
    const sCfg      = STATUS_CONFIG[status] ?? STATUS_CONFIG["สมัครแล้ว"];

    const handleCreate = async () => {
        if (!isValid) return;
        setSaving(true);
        const newId = nextId(mappings);
        addMapping({ id: newId, studentId, jobId, status, appliedDate, note });
        // brief pause so context updates before navigating
        await new Promise(r => setTimeout(r, 300));
        router.push(`/admin/marketplace/applications/${newId}`);
    };

    return (
        <>
            <AdminTopBar
                title="เพิ่มการสมัครงาน"
                description="Marketplace › การสมัครงาน › เพิ่มใหม่"
            />

            {/* ── Sticky top bar ── */}
            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-surface/95 px-6 py-2.5 backdrop-blur">
                <Link href="/admin/marketplace/applications"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground transition-colors shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                    กลับรายการ
                </Link>

                {/* Breadcrumb */}
                <div className="flex flex-col items-center min-w-0 px-4">
                    <div className="flex items-center gap-1.5 text-xs text-muted">
                        <Link href="/admin/marketplace" className="hover:text-foreground transition-colors">Marketplace</Link>
                        <span>/</span>
                        <Link href="/admin/marketplace/applications" className="hover:text-foreground transition-colors">การสมัครงาน</Link>
                        <span>/</span>
                        <span className="text-foreground font-medium">เพิ่มใหม่</span>
                    </div>
                </div>

                {/* Save button */}
                <button type="button" onClick={handleCreate} disabled={saving || !isValid || !ready}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-primary bg-primary px-3.5 py-1.5 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed shrink-0">
                    {saving ? (
                        <>
                            <svg className="h-3.5 w-3.5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                            กำลังบันทึก...
                        </>
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

            <div className="p-6 space-y-5 max-w-6xl">

                {/* ── Preview hero card ── */}
                <div className="card p-0 overflow-hidden">
                    <div className={`h-1.5 w-full transition-colors ${isValid ? sCfg.dot : "bg-border"}`} />
                    <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3 min-w-0 flex-1 flex-wrap">
                            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl transition-colors ${student ? "bg-accent-soft" : "bg-surface-muted"}`}>👤</div>
                            <div className="min-w-0">
                                <p className="text-xs text-muted">นักเรียน</p>
                                {student ? (
                                    <>
                                        <p className="text-base font-bold text-foreground truncate">{student.prefix}{student.name} {student.lastname}</p>
                                        <p className="text-xs text-muted truncate">{student.university} · {student.major}</p>
                                    </>
                                ) : (
                                    <p className="text-sm text-muted italic">ยังไม่ได้เลือก</p>
                                )}
                            </div>
                            <div className="shrink-0 flex items-center gap-1.5 px-2">
                                <div className="h-px w-6 bg-border" />
                                <div className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors ${isValid ? sCfg.color : "border-border text-muted"}`}>→</div>
                                <div className="h-px w-6 bg-border" />
                            </div>
                            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl transition-colors ${job ? "bg-accent-soft" : "bg-surface-muted"}`}>💼</div>
                            <div className="min-w-0">
                                <p className="text-xs text-muted">ตำแหน่งงาน</p>
                                {job ? (
                                    <>
                                        <p className="text-base font-bold text-foreground truncate">{job.title}</p>
                                        <p className="text-xs text-muted truncate">{job.companyName} · {job.type}</p>
                                    </>
                                ) : (
                                    <p className="text-sm text-muted italic">ยังไม่ได้เลือก</p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-5 shrink-0 sm:border-l sm:border-border sm:pl-6">
                            <div className="text-center">
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted mb-1.5">สถานะ</p>
                                <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold ${sCfg.color}`}>
                                    <span className={`h-2 w-2 rounded-full ${sCfg.dot}`} />{status}
                                </span>
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted mb-1.5">วันที่สมัคร</p>
                                <p className="text-sm font-semibold text-foreground">
                                    {appliedDate ? new Date(appliedDate).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" }) : "—"}
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted mb-1.5">รหัส</p>
                                <p className="text-sm font-mono font-medium text-muted">{ready ? nextId(mappings) : "—"}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Form card ── */}
                <div className="card p-5 space-y-4">

                    {/* Pickers: student | job */}
                    <div className="grid gap-4 lg:grid-cols-2">
                        {/* Student picker */}
                        <div className="space-y-2">
                            <SearchPicker
                                label="👤 นักเรียน" required
                                placeholder="พิมพ์ชื่อ, รหัส, หรือมหาวิทยาลัย..."
                                items={students}
                                value={studentId}
                                onChange={setStudentId}
                                filterFn={(s, q) => [s.id, s.name, s.lastname, s.nameEn, s.lastnameEn, s.nickname, s.university, s.major]
                                    .some(v => String(v ?? "").toLowerCase().includes(q))}
                                renderItem={s => {
                                    const stuMaps   = mappings.filter(m => m.studentId === s.id);
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
                                    <p className="text-xs font-semibold text-amber-700 mb-1.5">⚠️ มี Mapping อยู่แล้ว {studentMappings.length} รายการ</p>
                                    <div className="space-y-1">
                                        {studentMappings.map(m => {
                                            const j   = jobs.find(x => x.id === m.jobId);
                                            const cfg = STATUS_CONFIG[m.status] ?? STATUS_CONFIG["สมัครแล้ว"];
                                            return (
                                                <div key={m.id} className="flex items-center justify-between gap-2">
                                                    <p className="text-[11px] text-amber-800 truncate">{j?.title ?? m.jobId}</p>
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

                        {/* Job picker */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
                                <span className="text-xs font-medium text-foreground">💼 ตำแหน่งงาน <span className="text-red-500">*</span></span>
                                <div className="flex items-center gap-1 flex-wrap">
                                    {["ทั้งหมด", ...JOB_TYPES].map(t => (
                                        <button key={t} type="button"
                                            onClick={() => { setJobTypeFilter(t); setJobId(""); }}
                                            className={`rounded-full border px-2 py-0.5 text-[11px] font-medium transition-all ${
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
                                label="" required={false}
                                placeholder="พิมพ์ชื่อตำแหน่ง, บริษัท, หรือสาขา..."
                                items={jobTypeFilter === "ทั้งหมด" ? jobs : jobs.filter(j => j.type === jobTypeFilter)}
                                value={jobId}
                                onChange={setJobId}
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
                    </div>

                    <div className="border-t border-border" />

                    {/* Status + date + note */}
                    <div className="grid gap-4 sm:grid-cols-[1fr_160px_1fr]">
                        {/* Status */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-foreground">สถานะ <span className="text-red-500">*</span></label>
                            <div className="flex flex-col gap-1.5">
                                {MAPPING_STATUSES.map(s => {
                                    const cfg = STATUS_CONFIG[s];
                                    return (
                                        <button key={s} type="button"
                                            onClick={() => setStatus(s)}
                                            className={`rounded-xl border p-2.5 text-left transition-all ${status === s ? `${cfg.color} border-current ring-2 ring-offset-1 ring-current` : "border-border hover:border-primary"}`}>
                                            <div className="flex items-center gap-2">
                                                <span className={`h-2 w-2 shrink-0 rounded-full ${cfg.dot}`} />
                                                <span className="text-xs font-medium leading-tight">{s}</span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Date */}
                        <EField label="วันที่สมัคร">
                            <input type="date" value={appliedDate} onChange={e => setAppliedDate(e.target.value)} className={inputCls} />
                        </EField>

                        {/* Note */}
                        <EField label="หมายเหตุ">
                            <textarea value={note} onChange={e => setNote(e.target.value)} rows={5}
                                placeholder="บันทึกเพิ่มเติม..." className={inputCls + " resize-none"} />
                        </EField>
                    </div>

                    {/* Validation hint */}
                    {(!studentId || !jobId) && (
                        <p className="text-xs text-muted text-center pt-1">
                            {!studentId && !jobId ? "เลือกนักเรียนและตำแหน่งงานเพื่อเพิ่มการสมัคร" : !studentId ? "กรุณาเลือกนักเรียน" : "กรุณาเลือกตำแหน่งงาน"}
                        </p>
                    )}
                </div>

            </div>
        </>
    );
}
