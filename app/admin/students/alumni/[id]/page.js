"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import AdminTopBar from "@/components/admin/ui/AdminTopBar";
import { SCHOLARSHIP_STATUS_COLOR, calcDisplayedYears } from "@/lib/data/alumniData";
import { useAlumni } from "@/components/admin/contexts/AlumniContext";
import { useStudents } from "@/components/admin/contexts/StudentContext";
import { useAlumniHistory } from "@/components/admin/contexts/AlumniHistoryContext";
import { diffAlumniSnapshot, buildAlumniSummary, formatHistoryDate } from "@/lib/utils/alumniHistoryHelpers";

// ── Constants ─────────────────────────────────────────────────
const PREFIXES = ["นาย", "นางสาว", "นาง"];
const SCHOLARSHIP_STATUSES = ["กำลังทำงาน", "ครบตามสัญญา", "ได้รับยกเว้น"];
const JOB_TYPES = ["พนักงานประจำ", "สัญญาจ้าง", "ฟรีแลนซ์", "ฝึกงาน"];
const EMPTY_JOB = { company: "", position: "", startDate: "", endDate: "", location: "", type: "พนักงานประจำ" };

// ── CSS ───────────────────────────────────────────────────────
const inputCls  = "w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-accent-soft placeholder:text-muted";
const selectCls = "w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-accent-soft";
const roInputCls  = "w-full rounded-xl border border-transparent bg-surface-muted/50 px-3 py-2 text-sm font-medium text-foreground outline-none cursor-default select-text";
const roSelectCls = "w-full rounded-xl border border-transparent bg-surface-muted/50 px-3 py-2 text-sm font-medium text-foreground outline-none cursor-default";

// ── Helpers ───────────────────────────────────────────────────
function fmtDate(dateStr) {
  if (!dateStr) return "ปัจจุบัน";
  const [y, m] = dateStr.split("-");
  const months = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
  return `${months[parseInt(m) - 1]} ${y}`;
}
function buddhistToAD(s) {
  if (!s) return new Date();
  const [y, m] = s.split("-");
  return new Date(`${parseInt(y) - 543}-${m}-01`);
}
function calcDuration(start, end) {
  const s = buddhistToAD(start);
  const e = end ? buddhistToAD(end) : new Date();
  const mo = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
  const y = Math.floor(mo / 12), m = mo % 12;
  return [y > 0 ? `${y} ปี` : "", m > 0 ? `${m} เดือน` : ""].filter(Boolean).join(" ") || "< 1 เดือน";
}

// ── Shared UI ─────────────────────────────────────────────────
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

function EField({ label, required, hint, children }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1 text-xs font-medium text-foreground">
        {label}{required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-muted">{hint}</p>}
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

function DeleteModal({ name, id, onConfirm, onCancel }) {
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

// ── Profile Hero Card ─────────────────────────────────────────
function ProfileHeroCard({ d, editing }) {
  const { badge, bar } = SCHOLARSHIP_STATUS_COLOR[d.scholarshipStatus] ?? { badge: "bg-gray-100 text-gray-600", bar: "bg-gray-400" };
  return (
    <div className="card p-0 overflow-hidden">
      <div className={`h-1.5 w-full bg-gradient-to-r ${editing ? "from-amber-400 via-primary to-indigo-400" : "from-primary via-blue-400 to-indigo-400"}`} />
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-6">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-2xl font-extrabold text-primary ring-4 ring-accent-soft">
          {(d.nickname || d.name || "?").charAt(0)}
        </div>
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-extrabold text-foreground leading-tight">
              {d.prefix}
              {d.name  || <span className="font-normal italic text-muted">ชื่อ</span>}{" "}
              {d.lastname || <span className="font-normal italic text-muted">นามสกุล</span>}
            </h1>
            {d.nickname && <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs text-muted">"{d.nickname}"</span>}
          </div>
          {(d.nameEn || d.lastnameEn) && (
            <p className="text-sm text-muted">{[d.nameEn, d.lastnameEn].filter(Boolean).join(" ")}</p>
          )}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badge} border-current/20`}>
              <span className={`h-1.5 w-1.5 rounded-full ${bar}`} />
              {d.scholarshipStatus}
            </span>
            {d.university && <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-muted px-2.5 py-0.5 text-xs text-muted">🏫 {d.university}</span>}
            {d.major && <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-muted px-2.5 py-0.5 text-xs text-muted">📚 {d.major}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── History Section ────────────────────────────────────────────
const EVENT_CFG = {
  create: { label: "สร้างข้อมูล", pill: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  update: { label: "แก้ไขข้อมูล", pill: "bg-blue-100 text-blue-700 border-blue-200",          dot: "bg-blue-400" },
  delete: { label: "ลบข้อมูล",   pill: "bg-red-100 text-red-700 border-red-200",              dot: "bg-red-500" },
};

function HistorySection({ history }) {
  const [showAll, setShowAll] = useState(false);
  const STEP = 5;
  const displayed = showAll ? history : history.slice(0, STEP);

  if (!history.length) {
    return (
      <Section icon="🕐" title="ประวัติการแก้ไข" description="บันทึกการเปลี่ยนแปลงข้อมูลทั้งหมด">
        <p className="text-sm text-muted">ยังไม่มีประวัติ — จะปรากฏหลังจากบันทึกการเปลี่ยนแปลงครั้งแรก</p>
      </Section>
    );
  }
  return (
    <Section icon="🕐" title="ประวัติการแก้ไข" description={`${history.length} รายการ`}>
      <div className="relative space-y-0">
        <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />
        {displayed.map((evt) => {
          const cfg = EVENT_CFG[evt.type] ?? EVENT_CFG.update;
          return (
            <div key={evt.id} className="relative flex gap-4 pb-5 last:pb-0">
              <div className={`relative z-10 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-surface ${cfg.dot}`}>
                <span className="h-2 w-2 rounded-full bg-white" />
              </div>
              <div className="flex-1 min-w-0 rounded-xl border border-border bg-surface-muted/50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cfg.pill}`}>{cfg.label}</span>
                  <time className="text-xs text-muted tabular-nums">{formatHistoryDate(evt.at)}</time>
                </div>
                <p className="text-sm font-medium text-foreground leading-snug">{evt.summary}</p>
                {evt.changes?.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    {evt.changes.map((c) => (
                      <div key={c.field} className="rounded-lg bg-surface px-3 py-2 text-xs space-y-1">
                        <span className="block font-semibold text-foreground">{c.label}</span>
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                          <span className="rounded bg-red-50 px-1.5 py-0.5 text-red-600 line-through break-all">{String(c.before)}</span>
                          <span className="text-muted shrink-0">→</span>
                          <span className="rounded bg-emerald-50 px-1.5 py-0.5 font-semibold text-emerald-700 break-all">{String(c.after)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {history.length > STEP && (
        <button onClick={() => setShowAll(v => !v)}
          className="mt-3 w-full rounded-xl border border-border py-2 text-xs font-medium text-muted hover:border-primary hover:text-primary transition-colors">
          {showAll ? "แสดงน้อยลง ▲" : `แสดงทั้งหมด ${history.length} รายการ ▼`}
        </button>
      )}
    </Section>
  );
}

// ── Employment Timeline (view mode) ──────────────────────────
function EmploymentTimeline({ jobs }) {
  if (!jobs.length) return <p className="py-8 text-center text-sm text-muted">ยังไม่มีประวัติการทำงาน</p>;
  return (
    <div className="space-y-5">
      <div className="relative">
        <div className="absolute left-5 top-0 h-full w-px bg-border" />
        <div className="space-y-6">
          {[...jobs].reverse().map((job, i, arr) => {
            const isCurrent = !job.endDate;
            return (
              <div key={i} className="relative flex gap-5">
                <div className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${isCurrent ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-border bg-surface text-muted"}`}>
                  {arr.length - i}
                </div>
                <div className={`flex-1 rounded-xl border p-4 ${isCurrent ? "border-emerald-200 bg-emerald-50/50" : "border-border bg-surface"}`}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-foreground">{job.company}</p>
                        {isCurrent && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">ปัจจุบัน</span>}
                      </div>
                      <p className="text-sm text-muted mt-0.5">{job.position}</p>
                    </div>
                    <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted whitespace-nowrap">{job.type}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted">
                    <span>📍 {job.location}</span>
                    <span>📅 {fmtDate(job.startDate)} — {fmtDate(job.endDate)}</span>
                    <span className="font-medium text-foreground">⏱ {calcDuration(job.startDate, job.endDate)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {jobs.length > 0 && (
        <div className="border-t border-border pt-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xl font-extrabold text-foreground">{jobs.length}</p>
            <p className="text-xs text-muted">บริษัทที่เคยทำงาน</p>
          </div>
          <div>
            <p className="text-xl font-extrabold text-foreground">{calcDuration(jobs[0].startDate, null)}</p>
            <p className="text-xs text-muted">ประสบการณ์ทั้งหมด</p>
          </div>
          <div>
            <p className="text-xl font-extrabold text-foreground">{new Set(jobs.map(e => e.location)).size}</p>
            <p className="text-xs text-muted">จังหวัดที่ทำงาน</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── AlumniDetail ──────────────────────────────────────────────
function AlumniDetail({ alumni, linkedStudent, history, updateAlumni, deleteAlumni, addEvent, router }) {
  const [editing, setEditing]       = useState(false);
  const [form, setForm]             = useState(() => ({ ...alumni, employmentHistory: alumni.employmentHistory.map(j => ({ ...j })) }));
  const [saving, setSaving]         = useState(false);
  const [saveError, setSaveError]   = useState(null);
  const [showDelete, setShowDelete] = useState(false);
  const [beforeSnap, setBeforeSnap] = useState(null);
  const [pulled, setPulled]         = useState(false);
  const [lastAddedIdx, setLastAddedIdx] = useState(null);

  const set = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));
  const iCls = editing ? inputCls : roInputCls;
  const sCls = editing ? selectCls : roSelectCls;

  // d — source of truth for display (form in edit, alumni in view)
  const d = editing ? form : alumni;
  const workedYears = calcDisplayedYears(d);
  const pct         = Math.min(100, Math.round((workedYears / (Number(d.scholarshipYears) || 1)) * 100));
  const remaining   = Math.max(0, (Number(d.scholarshipYears) || 0) - workedYears);
  const { badge, bar } = SCHOLARSHIP_STATUS_COLOR[d.scholarshipStatus] ?? { badge: "bg-gray-100 text-gray-600", bar: "bg-gray-400" };

  const handleEdit = () => {
    const snap = {
      prefix: alumni.prefix ?? "", name: alumni.name ?? "", lastname: alumni.lastname ?? "",
      nameEn: alumni.nameEn ?? "", lastnameEn: alumni.lastnameEn ?? "", nickname: alumni.nickname ?? "",
      major: alumni.major ?? "", university: alumni.university ?? "",
      graduatedYear: alumni.graduatedYear, contact: alumni.contact ?? "", phone: alumni.phone ?? "",
      scholarshipYears: alumni.scholarshipYears, scholarshipStatus: alumni.scholarshipStatus ?? "",
      remark: alumni.remark ?? "",
      employmentHistory: alumni.employmentHistory.map(j => ({ ...j })),
    };
    setBeforeSnap(snap);
    setForm({ ...alumni, employmentHistory: alumni.employmentHistory.map(j => ({ ...j })) });
    setEditing(true);
  };

  const handleCancel = () => {
    setForm({ ...alumni, employmentHistory: alumni.employmentHistory.map(j => ({ ...j })) });
    setBeforeSnap(null);
    setLastAddedIdx(null);
    setPulled(false);
    setEditing(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name?.trim() || !form.lastname?.trim()) return;
    setSaving(true);
    setSaveError(null);
    try {
      const after = {
        prefix: form.prefix ?? "", name: form.name ?? "", lastname: form.lastname ?? "",
        nameEn: form.nameEn ?? "", lastnameEn: form.lastnameEn ?? "", nickname: form.nickname ?? "",
        major: form.major ?? "", university: form.university ?? "",
        graduatedYear:    parseInt(form.graduatedYear)    || alumni.graduatedYear,
        contact: form.contact ?? "", phone: form.phone ?? "",
        scholarshipYears: parseInt(form.scholarshipYears) || alumni.scholarshipYears,
        scholarshipStatus: form.scholarshipStatus ?? "",
        remark: form.remark ?? "",
        employmentHistory: form.employmentHistory,
      };
      await updateAlumni(alumni.id, after);
      const changes = diffAlumniSnapshot(beforeSnap, after);
      if (changes.length > 0) {
        await addEvent({ alumniId: alumni.id, type: "update", before: beforeSnap, after, changes, summary: buildAlumniSummary("update", changes) });
      }
      setEditing(false);
      setBeforeSnap(null);
      setLastAddedIdx(null);
    } catch (err) {
      console.error("handleSave:", err);
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    await addEvent({ alumniId: alumni.id, type: "delete", before: { ...alumni }, after: null, changes: [], summary: "ลบข้อมูลศิษย์เก่า" });
    await deleteAlumni(alumni.id);
    router.push("/admin/students/alumni");
  };

  const handlePull = () => {
    if (!linkedStudent) return;
    setForm(f => ({
      ...f,
      prefix: linkedStudent.prefix || f.prefix,
      name: linkedStudent.name || f.name,
      lastname: linkedStudent.lastname || f.lastname,
      nameEn: linkedStudent.nameEn || f.nameEn,
      lastnameEn: linkedStudent.lastnameEn || f.lastnameEn,
      nickname: linkedStudent.nickname || f.nickname,
      contact: linkedStudent.email || f.contact,
      phone: linkedStudent.tel || f.phone,
    }));
    setPulled(true);
    setTimeout(() => setPulled(false), 3000);
  };

  const setJob = (idx, key, val) => setForm(prev => ({
    ...prev,
    employmentHistory: prev.employmentHistory.map((j, i) => i === idx ? { ...j, [key]: val } : j),
  }));
  const addJob = () => setForm(prev => {
    const next = [...prev.employmentHistory, { ...EMPTY_JOB }];
    setLastAddedIdx(next.length - 1);
    return { ...prev, employmentHistory: next };
  });
  const removeJob = (idx) => setForm(prev => ({
    ...prev,
    employmentHistory: prev.employmentHistory.filter((_, i) => i !== idx),
  }));

  const isValid = form.name?.trim() && form.lastname?.trim();

  return (
    <>
      <AdminTopBar
        title={editing ? `แก้ไขข้อมูล — ${d.prefix}${d.name} ${d.lastname}` : `${d.prefix}${d.name} ${d.lastname}`}
        description={`${alumni.id} · จบการศึกษา ${alumni.graduatedYear} · ${alumni.major}`}
      />

      {/* Error banner */}
      {saveError && (
        <div className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-red-200 bg-red-50 px-6 py-2.5 text-sm text-red-700">
          <span>⚠️ {saveError}</span>
          <button onClick={() => setSaveError(null)} className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium hover:bg-red-100 transition-colors">ปิด ×</button>
        </div>
      )}

      {/* Sticky bar */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-surface/95 px-6 py-2.5 backdrop-blur">
        <Link href="/admin/students/alumni"
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          กลับรายการ
        </Link>

        {editing ? (
          <div className="flex gap-2">
            <button type="button" onClick={handleCancel}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3.5 py-1.5 text-sm font-medium text-muted hover:text-foreground transition-colors">
              ยกเลิก
            </button>
            <button form="alumni-form" type="submit" disabled={!isValid || saving}
              className="inline-flex items-center gap-1.5 rounded-xl btn-primary disabled:opacity-40 disabled:cursor-not-allowed text-sm px-3.5 py-1.5">
              {saving ? <><Spinner />กำลังบันทึก...</> : <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                บันทึก
              </>}
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
        <form id="alumni-form" onSubmit={handleSave} className="space-y-5">

          {/* Hero */}
          <ProfileHeroCard d={d} editing={editing} />

          {/* 3-col grid */}
          <div className="grid gap-5 lg:grid-cols-3">

            {/* Left col — ข้อมูลส่วนตัว + สัญญาทุน */}
            <div className="space-y-5">

              <Section icon="👤" title="ข้อมูลส่วนตัว">
                <div className="space-y-4">
                  {/* Pull button */}
                  {linkedStudent && editing && (
                    <button type="button" onClick={handlePull}
                      className={`w-full inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                        pulled ? "border-emerald-400 bg-emerald-50 text-emerald-700" : "border-border text-muted hover:border-primary hover:text-primary"
                      }`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      {pulled ? "ดึงข้อมูลแล้ว ✓" : `ดึงข้อมูลจาก ${alumni.studentId}`}
                    </button>
                  )}

                  {/* คำนำหน้า + ชื่อ */}
                  <div className="grid grid-cols-4 gap-2">
                    <EField label="คำนำหน้า">
                      <select value={form.prefix ?? ""} onChange={set("prefix")} disabled={!editing} className={sCls}>
                        {PREFIXES.map(p => <option key={p}>{p}</option>)}
                      </select>
                    </EField>
                    <div className="col-span-3">
                      <EField label="ชื่อ" required={editing}>
                        <input type="text" value={form.name ?? ""} onChange={set("name")} readOnly={!editing} className={iCls} />
                      </EField>
                    </div>
                  </div>

                  <EField label="นามสกุล" required={editing}>
                    <input type="text" value={form.lastname ?? ""} onChange={set("lastname")} readOnly={!editing} className={iCls} />
                  </EField>

                  <div className="grid grid-cols-2 gap-2">
                    <EField label="First name (EN)">
                      <input type="text" value={form.nameEn ?? ""} onChange={set("nameEn")} readOnly={!editing} className={iCls} />
                    </EField>
                    <EField label="Last name (EN)">
                      <input type="text" value={form.lastnameEn ?? ""} onChange={set("lastnameEn")} readOnly={!editing} className={iCls} />
                    </EField>
                  </div>

                  <EField label="ชื่อเล่น">
                    <input type="text" value={form.nickname ?? ""} onChange={set("nickname")} readOnly={!editing} className={iCls} />
                  </EField>

                  <EField label="สาขา">
                    <input type="text" value={form.major ?? ""} onChange={set("major")} readOnly={!editing} className={iCls} />
                  </EField>

                  <EField label="มหาวิทยาลัย">
                    <input type="text" value={form.university ?? ""} onChange={set("university")} readOnly={!editing} className={iCls} />
                  </EField>

                  <EField label="ปีที่จบ (พ.ศ.)">
                    <input type="number" value={form.graduatedYear ?? ""} onChange={set("graduatedYear")} readOnly={!editing} className={iCls} />
                  </EField>

                  {/* Student link (view mode only) */}
                  {alumni.studentId && !editing && (
                    <div>
                      <p className="mb-1.5 text-xs font-medium text-foreground">รหัสนักเรียน</p>
                      <Link href={`/admin/students/${alumni.studentId}`}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                          <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                        </svg>
                        {alumni.studentId}
                      </Link>
                    </div>
                  )}

                  <EField label="อีเมล">
                    <input type="email" value={form.contact ?? ""} onChange={set("contact")} readOnly={!editing} className={iCls} />
                  </EField>

                  <EField label="โทรศัพท์">
                    <input type="tel" value={form.phone ?? ""} onChange={set("phone")} readOnly={!editing} className={iCls} />
                  </EField>
                </div>
              </Section>

              {/* สัญญาทุน */}
              <Section icon="📋" title="การทำงานตามสัญญาทุน">
                <div className="space-y-4">
                  <EField label="จำนวนปีตามสัญญาทุน">
                    <input type="number" min="1" max="10" value={form.scholarshipYears ?? ""} onChange={set("scholarshipYears")} readOnly={!editing} className={iCls} />
                  </EField>
                  <EField label="สถานะการทำงานตามสัญญา">
                    <select value={form.scholarshipStatus ?? ""} onChange={set("scholarshipStatus")} disabled={!editing} className={sCls}>
                      {SCHOLARSHIP_STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </EField>

                  {/* Progress */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-xs text-muted">
                      <span>ทำงานแล้ว {workedYears} ปี</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
                      <div className={`h-2 rounded-full transition-all duration-700 ${bar}`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      {[
                        [d.scholarshipYears, "ปีตามสัญญา", "text-foreground"],
                        [workedYears,        "ปีที่ทำงาน",  "text-foreground"],
                        [remaining > 0 ? remaining : "✓", remaining > 0 ? "ปีที่เหลือ" : "ครบแล้ว", remaining > 0 ? "text-amber-600" : "text-emerald-600"],
                      ].map(([val, lbl, cls]) => (
                        <div key={lbl} className="rounded-xl bg-surface-muted p-2.5 text-center">
                          <p className={`text-base font-extrabold ${cls}`}>{val}</p>
                          <p className="text-[10px] text-muted">{lbl}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Section>
            </div>

            {/* Right col — ประวัติการทำงาน */}
            <div className="lg:col-span-2">
              <Section
                icon="💼"
                title="ประวัติการทำงาน"
                description={`${editing ? form.employmentHistory.length : alumni.employmentHistory.length} บริษัท`}
                action={editing ? (
                  <button type="button" onClick={addJob}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-primary px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/5 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    เพิ่มที่ทำงาน
                  </button>
                ) : null}
              >
                {editing ? (
                  <div className="space-y-4">
                    {form.employmentHistory.length === 0 && (
                      <p className="py-4 text-center text-sm text-muted">ยังไม่มีประวัติการทำงาน — กด "เพิ่มที่ทำงาน" เพื่อเพิ่ม</p>
                    )}
                    {[...form.employmentHistory].reverse().map((job, ri) => {
                      const idx = form.employmentHistory.length - 1 - ri;
                      const isNew = idx === lastAddedIdx;
                      return (
                        <div key={idx} className={`rounded-xl border p-4 space-y-3 transition-all duration-300 ${isNew ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border"}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-muted">บริษัทที่ {idx + 1}</span>
                              {isNew && <span className="inline-flex rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">✦ เพิ่งเพิ่ม</span>}
                            </div>
                            <button type="button" onClick={() => removeJob(idx)}
                              className="flex h-6 w-6 items-center justify-center rounded-lg border border-border text-muted hover:border-red-400 hover:text-red-500 transition-colors">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <EField label="ชื่อบริษัท / หน่วยงาน">
                              <input value={job.company} onChange={e => setJob(idx, "company", e.target.value)} className={inputCls} placeholder="ชื่อบริษัท" />
                            </EField>
                            <EField label="ตำแหน่ง">
                              <input value={job.position} onChange={e => setJob(idx, "position", e.target.value)} className={inputCls} placeholder="ตำแหน่งงาน" />
                            </EField>
                            <EField label="วันที่เริ่ม (พ.ศ. เช่น 2565-06)">
                              <input value={job.startDate ?? ""} onChange={e => setJob(idx, "startDate", e.target.value)} className={inputCls} placeholder="2565-06" />
                            </EField>
                            <EField label="วันที่สิ้นสุด" hint="ว่างไว้ = ยังทำงานอยู่ (ปัจจุบัน)">
                              <input value={job.endDate ?? ""} onChange={e => setJob(idx, "endDate", e.target.value || null)} className={inputCls} placeholder="ว่าง = ปัจจุบัน" />
                            </EField>
                            <EField label="สถานที่">
                              <input value={job.location ?? ""} onChange={e => setJob(idx, "location", e.target.value)} className={inputCls} placeholder="จังหวัด" />
                            </EField>
                            <EField label="ประเภทการจ้าง">
                              <select value={job.type ?? "พนักงานประจำ"} onChange={e => setJob(idx, "type", e.target.value)} className={selectCls}>
                                {JOB_TYPES.map(t => <option key={t}>{t}</option>)}
                              </select>
                            </EField>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <EmploymentTimeline jobs={alumni.employmentHistory} />
                )}
              </Section>
            </div>
          </div>

          {/* หมายเหตุ */}
          <Section icon="📝" title="หมายเหตุ" description={editing ? "ข้อมูลเพิ่มเติม (ไม่บังคับ)" : undefined}>
            <textarea value={form.remark ?? ""} onChange={set("remark")} readOnly={!editing} rows={3}
              placeholder={editing ? "บันทึกหมายเหตุ เช่น สถานะการติดตาม หรือข้อมูลอื่นๆ..." : ""}
              className={`${iCls} resize-none`} />
          </Section>

          {/* ประวัติการแก้ไข */}
          <HistorySection history={history} />

        </form>
      </div>

      {showDelete && (
        <DeleteModal
          name={`${alumni.prefix}${alumni.name} ${alumni.lastname}`}
          id={alumni.id}
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
        />
      )}
    </>
  );
}

// ── Page shell ────────────────────────────────────────────────
export default function AlumniDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const { getAlumni, updateAlumni, deleteAlumni, ready } = useAlumni();
  const { getStudent } = useStudents();
  const { addEvent, getAlumniHistory, ready: historyReady } = useAlumniHistory();

  if (!ready) return <div className="flex items-center justify-center py-24 text-muted text-sm">กำลังโหลดข้อมูล...</div>;

  const alumni = getAlumni(id);
  if (!alumni) notFound();

  const linkedStudent = alumni.studentId ? getStudent(alumni.studentId) : null;
  const history = historyReady ? getAlumniHistory(id) : [];

  return (
    <AlumniDetail
      key={id}
      alumni={alumni}
      linkedStudent={linkedStudent}
      history={history}
      updateAlumni={updateAlumni}
      deleteAlumni={deleteAlumni}
      addEvent={addEvent}
      router={router}
    />
  );
}
