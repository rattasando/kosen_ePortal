"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import AdminTopBar from "@/components/admin/ui/AdminTopBar";
import { SCHOLARSHIP_STATUS_COLOR, calcDisplayedYears } from "@/lib/data/alumniData";
import { useAlumni } from "@/components/admin/contexts/AlumniContext";
import { useStudents } from "@/components/admin/contexts/StudentContext";

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  if (!dateStr) return "ปัจจุบัน";
  const [y, m] = dateStr.split("-");
  const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  return `${months[parseInt(m) - 1]} ${y}`;
}

function buddhistToAD(dateStr) {
  if (!dateStr) return new Date();
  const [y, m] = dateStr.split("-");
  return new Date(`${parseInt(y) - 543}-${m}-01`);
}

function calcDuration(start, end) {
  const s = buddhistToAD(start);
  const e = end ? buddhistToAD(end) : new Date();
  const months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
  const y = Math.floor(months / 12);
  const m = months % 12;
  return [y > 0 ? `${y} ปี` : "", m > 0 ? `${m} เดือน` : ""].filter(Boolean).join(" ") || "< 1 เดือน";
}

const PREFIXES = ["นาย", "นางสาว", "นาง"];
const SCHOLARSHIP_STATUSES = ["กำลังทำงาน", "ครบตามสัญญา", "ได้รับยกเว้น"];
const JOB_TYPES = ["พนักงานประจำ", "สัญญาจ้าง", "ฟรีแลนซ์", "ฝึกงาน"];
const EMPTY_JOB = { company: "", position: "", startDate: "", endDate: "", location: "", type: "พนักงานประจำ" };

const inputCls = "w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-accent-soft placeholder:text-muted";
const selectCls = "w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-accent-soft";
const labelCls = "block text-xs font-semibold text-muted mb-1";

// ── Shared small components ───────────────────────────────────────────────────

function EditBtn({ onClick }) {
  return (
    <button onClick={onClick}
      className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-semibold text-muted hover:border-amber-400 hover:text-amber-500 transition-colors">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
      </svg>
      แก้ไข
    </button>
  );
}

function CardActions({ onSave, onCancel }) {
  return (
    <div className="flex gap-2">
      <button onClick={onCancel}
        className="rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-surface-muted transition-colors">
        ยกเลิก
      </button>
      <button onClick={onSave}
        className="rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 transition-colors">
        บันทึก
      </button>
    </div>
  );
}

// ── Detail View ───────────────────────────────────────────────────────────────

function DetailView({ alumni, updateAlumni, student }) {
  const workedYears = calcDisplayedYears(alumni);
  const pct = Math.min(100, Math.round((workedYears / alumni.scholarshipYears) * 100));
  const remaining = Math.max(0, alumni.scholarshipYears - workedYears);
  const { badge, bar } = SCHOLARSHIP_STATUS_COLOR[alumni.scholarshipStatus] ?? { badge: "bg-gray-100 text-gray-600", bar: "bg-gray-400" };

  // which card is in edit mode
  const [editCard, setEditCard] = useState(null); // null | "profile" | "scholarship" | "history" | "remark"

  // per-card form state (initialised when user opens edit)
  const [profileForm, setProfileForm] = useState({});
  const [scholarshipForm, setScholarshipForm] = useState({});
  const [historyForm, setHistoryForm] = useState([]);
  const [lastAddedIdx, setLastAddedIdx] = useState(null);
  const [remarkForm, setRemarkForm] = useState("");
  const [pulled, setPulled] = useState(false);

  const startEdit = (card) => {
    if (card === "profile") {
      setProfileForm({
        prefix: alumni.prefix,
        name: alumni.name,
        lastname: alumni.lastname,
        nameEn: alumni.nameEn ?? "",
        lastnameEn: alumni.lastnameEn ?? "",
        nickname: alumni.nickname ?? "",
        major: alumni.major,
        university: alumni.university,
        graduatedYear: String(alumni.graduatedYear),
        contact: alumni.contact,
        phone: alumni.phone,
      });
    } else if (card === "scholarship") {
      setScholarshipForm({
        scholarshipYears: String(alumni.scholarshipYears),
        scholarshipStatus: alumni.scholarshipStatus,
      });
    } else if (card === "history") {
      setHistoryForm(alumni.employmentHistory.map((j) => ({ ...j })));
    } else if (card === "remark") {
      setRemarkForm(alumni.remark ?? "");
    }
    setEditCard(card);
  };

  const cancelEdit = () => { setEditCard(null); setLastAddedIdx(null); };

  const setP = (key, val) => setProfileForm((f) => ({ ...f, [key]: val }));
  const setSch = (key, val) => setScholarshipForm((f) => ({ ...f, [key]: val }));
  const setJob = (idx, key, val) =>
    setHistoryForm((f) => f.map((j, i) => (i === idx ? { ...j, [key]: val } : j)));
  const addJob = () => {
    setHistoryForm((f) => {
      const next = [...f, { ...EMPTY_JOB }];
      setLastAddedIdx(next.length - 1);
      return next;
    });
  };
  const removeJob = (idx) => setHistoryForm((f) => f.filter((_, i) => i !== idx));

  const saveProfile = () => {
    updateAlumni(alumni.id, {
      ...profileForm,
      graduatedYear: parseInt(profileForm.graduatedYear) || alumni.graduatedYear,
    });
    setEditCard(null);
  };

  const saveScholarship = () => {
    updateAlumni(alumni.id, {
      scholarshipYears: parseInt(scholarshipForm.scholarshipYears) || alumni.scholarshipYears,
      scholarshipStatus: scholarshipForm.scholarshipStatus,
    });
    setEditCard(null);
  };

  const saveHistory = () => {
    updateAlumni(alumni.id, { employmentHistory: historyForm });
    setEditCard(null);
    setLastAddedIdx(null);
  };

  const saveRemark = () => {
    updateAlumni(alumni.id, { remark: remarkForm });
    setEditCard(null);
  };

  const handlePull = () => {
    if (!student) return;
    setProfileForm((f) => ({
      ...f,
      prefix: student.prefix || f.prefix,
      name: student.name || f.name,
      lastname: student.lastname || f.lastname,
      nameEn: student.nameEn || f.nameEn,
      lastnameEn: student.lastnameEn || f.lastnameEn,
      nickname: student.nickname || f.nickname,
      contact: student.email || f.contact,
      phone: student.tel || f.phone,
    }));
    setPulled(true);
    setTimeout(() => setPulled(false), 3000);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="grid gap-6 lg:grid-cols-3">

        {/* ── Left col ── */}
        <div className="space-y-5">

          {/* Profile card */}
          <div className="card p-0 overflow-hidden">
            {/* Gradient strip */}
            <div className={`h-1.5 w-full bg-gradient-to-r ${editCard === "profile" ? "from-amber-400 via-primary to-indigo-400" : "from-primary via-blue-400 to-indigo-400"}`} />

            {/* Header — always visible */}
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-2xl font-extrabold text-primary ring-4 ring-accent-soft">
                {(alumni.nickname || alumni.name).charAt(0)}
              </div>
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-extrabold text-foreground leading-tight">
                    {alumni.prefix}{alumni.name} {alumni.lastname}
                  </h2>
                  {alumni.nickname && (
                    <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs text-muted">"{alumni.nickname}"</span>
                  )}
                </div>
                <p className="text-xs text-muted font-mono">{alumni.id}</p>
                {alumni.studentId && (
                  <Link href={`/admin/students/${alumni.studentId}`}
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                      <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                    </svg>
                    ดูข้อมูลนักเรียน ({alumni.studentId})
                  </Link>
                )}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${badge} border-current/20`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${bar}`} />
                    {alumni.scholarshipStatus}
                  </span>
                  {alumni.university && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-muted px-2.5 py-0.5 text-xs text-muted">
                      🏫 {alumni.university}
                    </span>
                  )}
                  {alumni.major && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-muted px-2.5 py-0.5 text-xs text-muted">
                      📚 {alumni.major}
                    </span>
                  )}
                </div>
              </div>
              {editCard !== "profile" && <EditBtn onClick={() => startEdit("profile")} />}
            </div>

            {editCard === "profile" ? (
              <div className="space-y-4 border-t border-border px-5 pb-5 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-muted">แก้ไขข้อมูลส่วนตัว</span>
                  <CardActions onSave={saveProfile} onCancel={cancelEdit} />
                </div>
                {student && (
                  <button onClick={handlePull}
                    className={`w-full inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                      pulled ? "border-emerald-400 bg-emerald-50 text-emerald-700" : "border-border text-muted hover:border-primary hover:text-primary"
                    }`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    {pulled ? "ดึงข้อมูลแล้ว ✓" : `ดึงข้อมูลจาก ${alumni.studentId}`}
                  </button>
                )}
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className={labelCls}>คำนำหน้า</label>
                    <select value={profileForm.prefix} onChange={(e) => setP("prefix", e.target.value)} className={selectCls}>
                      {PREFIXES.map((p) => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="col-span-3">
                    <label className={labelCls}>ชื่อ</label>
                    <input value={profileForm.name} onChange={(e) => setP("name", e.target.value)} className={inputCls} placeholder="ชื่อ" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>นามสกุล</label>
                  <input value={profileForm.lastname} onChange={(e) => setP("lastname", e.target.value)} className={inputCls} placeholder="นามสกุล" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelCls}>First name (EN)</label>
                    <input value={profileForm.nameEn} onChange={(e) => setP("nameEn", e.target.value)} className={inputCls} placeholder="First name" />
                  </div>
                  <div>
                    <label className={labelCls}>Last name (EN)</label>
                    <input value={profileForm.lastnameEn} onChange={(e) => setP("lastnameEn", e.target.value)} className={inputCls} placeholder="Last name" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>ชื่อเล่น</label>
                  <input value={profileForm.nickname} onChange={(e) => setP("nickname", e.target.value)} className={inputCls} placeholder="ชื่อเล่น" />
                </div>
                <div>
                  <label className={labelCls}>สาขา</label>
                  <input value={profileForm.major} onChange={(e) => setP("major", e.target.value)} className={inputCls} placeholder="สาขาวิชา" />
                </div>
                <div>
                  <label className={labelCls}>มหาวิทยาลัย</label>
                  <input value={profileForm.university} onChange={(e) => setP("university", e.target.value)} className={inputCls} placeholder="ชื่อมหาวิทยาลัย" />
                </div>
                <div>
                  <label className={labelCls}>ปีที่จบ (พ.ศ.)</label>
                  <input type="number" value={profileForm.graduatedYear} onChange={(e) => setP("graduatedYear", e.target.value)} className={inputCls} placeholder="2565" />
                </div>
                <div>
                  <label className={labelCls}>อีเมล</label>
                  <input value={profileForm.contact} onChange={(e) => setP("contact", e.target.value)} className={inputCls} placeholder="email@example.com" />
                </div>
                <div>
                  <label className={labelCls}>โทรศัพท์</label>
                  <input value={profileForm.phone} onChange={(e) => setP("phone", e.target.value)} className={inputCls} placeholder="0xx-xxx-xxxx" />
                </div>
              </div>
            ) : (
              <div className="border-t border-border px-5 pb-5 pt-4">
                <div className="grid grid-cols-2 gap-x-6 gap-y-3.5">
                  {[
                    { label: "ปีที่จบ (พ.ศ.)", value: alumni.graduatedYear },
                    { label: "สาขา", value: alumni.major },
                    { label: "มหาวิทยาลัย", value: alumni.university },
                    { label: "รหัสนักเรียน", value: alumni.studentId },
                    { label: "ชื่อ-นามสกุล (EN)", value: [alumni.nameEn, alumni.lastnameEn].filter(Boolean).join(" ") || null },
                    { label: "ชื่อเล่น", value: alumni.nickname },
                    { label: "อีเมล", value: alumni.contact, email: true },
                    { label: "โทรศัพท์", value: alumni.phone, tel: true },
                  ].filter(f => f.value).map(({ label, value, email, tel }) => (
                    <div key={label}>
                      <p className="mb-0.5 text-[11px] font-medium uppercase tracking-wide text-muted">{label}</p>
                      {email
                        ? <a href={`mailto:${value}`} className="text-sm font-semibold text-primary hover:underline break-all">{value}</a>
                        : tel
                        ? <a href={`tel:${value}`} className="text-sm font-semibold text-foreground hover:text-emerald-600 transition-colors">{value}</a>
                        : <p className="text-sm font-semibold text-foreground">{value}</p>
                      }
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Work obligation card */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground">การทำงานตามสัญญาทุน</h2>
              {editCard !== "scholarship" && <EditBtn onClick={() => startEdit("scholarship")} />}
            </div>

            {editCard === "scholarship" ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted">แก้ไขข้อมูลทุน</span>
                  <CardActions onSave={saveScholarship} onCancel={cancelEdit} />
                </div>
                <div>
                  <label className={labelCls}>จำนวนปีตามสัญญาทุน</label>
                  <input type="number" min="1" max="10" value={scholarshipForm.scholarshipYears}
                    onChange={(e) => setSch("scholarshipYears", e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>สถานะการทำงานตามสัญญา</label>
                  <select value={scholarshipForm.scholarshipStatus} onChange={(e) => setSch("scholarshipStatus", e.target.value)} className={selectCls}>
                    {SCHOLARSHIP_STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">ทำงานแล้ว</span>
                    <span className="font-bold text-foreground">{workedYears} ปี</span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-surface-muted">
                    <div className={`h-3 rounded-full transition-all duration-700 ${bar}`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-muted">
                    <span>{pct}% ของสัญญา</span>
                    <span>ต้องทำงาน {alumni.scholarshipYears} ปี</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    [alumni.scholarshipYears, "ปีตามสัญญา", "text-foreground"],
                    [workedYears, "ปีที่ทำงาน", "text-foreground"],
                    [remaining > 0 ? remaining : "✓", remaining > 0 ? "ปีที่เหลือ" : "ครบแล้ว", remaining > 0 ? "text-amber-600" : "text-emerald-600"],
                  ].map(([val, lbl, cls]) => (
                    <div key={lbl} className="rounded-xl bg-surface-muted p-3 text-center">
                      <p className={`text-xl font-extrabold ${cls}`}>{val}</p>
                      <p className="text-xs text-muted">{lbl}</p>
                    </div>
                  ))}
                </div>
                <div className={`rounded-xl px-4 py-3 ${alumni.scholarshipStatus === "ได้รับยกเว้น" ? "bg-violet-50" : alumni.scholarshipStatus === "ครบตามสัญญา" ? "bg-emerald-50" : "bg-amber-50"}`}>
                  <p className={`text-sm font-semibold ${badge.split(" ")[1]}`}>{alumni.scholarshipStatus}</p>
                  {alumni.scholarshipStatus === "กำลังทำงาน" && <p className="text-xs text-muted mt-0.5">ยังต้องทำงานอีก {remaining} ปี จึงจะครบสัญญา</p>}
                  {alumni.scholarshipStatus === "ครบตามสัญญา" && <p className="text-xs text-muted mt-0.5">ทำงานครบตามจำนวนปีในสัญญาทุนแล้ว</p>}
                  {alumni.scholarshipStatus === "ได้รับยกเว้น" && <p className="text-xs text-muted mt-0.5">ได้รับการยกเว้นเงื่อนไขการทำงานตามสัญญา</p>}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Right col: Employment Timeline ── */}
        <div className="lg:col-span-2">
          <div className="card p-5">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="font-semibold text-foreground">ประวัติการทำงาน</h2>
                <span className="text-xs text-muted">{alumni.employmentHistory.length} บริษัท</span>
              </div>
              {editCard !== "history" && <EditBtn onClick={() => startEdit("history")} />}
            </div>

            {editCard === "history" ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <button onClick={addJob}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-primary px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/5 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    เพิ่มที่ทำงาน
                  </button>
                  <CardActions onSave={saveHistory} onCancel={cancelEdit} />
                </div>

                {historyForm.length === 0 && (
                  <p className="text-sm text-muted text-center py-4">ยังไม่มีประวัติการทำงาน</p>
                )}

                <div className="space-y-4">
                  {[...historyForm].reverse().map((job, reversedI) => {
                    const idx = historyForm.length - 1 - reversedI;
                    const isNew = idx === lastAddedIdx;
                    return (
                      <div key={idx} className={`rounded-xl border p-4 space-y-3 transition-all duration-300 ${isNew ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border"}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-muted">ที่ทำงานที่ {idx + 1}</span>
                            {isNew && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">
                                ✦ เพิ่งเพิ่ม
                              </span>
                            )}
                          </div>
                          <button onClick={() => removeJob(idx)}
                            className="flex h-6 w-6 items-center justify-center rounded-lg border border-border text-muted hover:border-red-400 hover:text-red-500 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div>
                            <label className={labelCls}>ชื่อบริษัท / หน่วยงาน</label>
                            <input value={job.company} onChange={(e) => setJob(idx, "company", e.target.value)} className={inputCls} placeholder="ชื่อบริษัท" />
                          </div>
                          <div>
                            <label className={labelCls}>ตำแหน่ง</label>
                            <input value={job.position} onChange={(e) => setJob(idx, "position", e.target.value)} className={inputCls} placeholder="ตำแหน่งงาน" />
                          </div>
                          <div>
                            <label className={labelCls}>วันที่เริ่ม (พ.ศ. เช่น 2565-06)</label>
                            <input value={job.startDate} onChange={(e) => setJob(idx, "startDate", e.target.value)} className={inputCls} placeholder="2565-06" />
                          </div>
                          <div>
                            <label className={labelCls}>วันที่สิ้นสุด (ว่างหากยังทำงานอยู่)</label>
                            <input value={job.endDate ?? ""} onChange={(e) => setJob(idx, "endDate", e.target.value || null)} className={inputCls} placeholder="ว่าง = ปัจจุบัน" />
                          </div>
                          <div>
                            <label className={labelCls}>สถานที่</label>
                            <input value={job.location} onChange={(e) => setJob(idx, "location", e.target.value)} className={inputCls} placeholder="จังหวัด" />
                          </div>
                          <div>
                            <label className={labelCls}>ประเภทการจ้าง</label>
                            <select value={job.type} onChange={(e) => setJob(idx, "type", e.target.value)} className={selectCls}>
                              {JOB_TYPES.map((t) => <option key={t}>{t}</option>)}
                            </select>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <>
                {alumni.employmentHistory.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted">ยังไม่มีประวัติการทำงาน</p>
                ) : (
                  <div className="relative">
                    <div className="absolute left-5 top-0 h-full w-px bg-border" />
                    <div className="space-y-6">
                      {[...alumni.employmentHistory].reverse().map((job, i, arr) => {
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
                                <span>📅 {formatDate(job.startDate)} — {formatDate(job.endDate)}</span>
                                <span className="font-medium text-foreground">⏱ {calcDuration(job.startDate, job.endDate)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {alumni.employmentHistory.length > 0 && (
                  <div className="mt-6 border-t border-border pt-4 grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xl font-extrabold text-foreground">{alumni.employmentHistory.length}</p>
                      <p className="text-xs text-muted">บริษัทที่เคยทำงาน</p>
                    </div>
                    <div>
                      <p className="text-xl font-extrabold text-foreground">{calcDuration(alumni.employmentHistory[0].startDate, null)}</p>
                      <p className="text-xs text-muted">ประสบการณ์ทั้งหมด</p>
                    </div>
                    <div>
                      <p className="text-xl font-extrabold text-foreground">{new Set(alumni.employmentHistory.map((e) => e.location)).size}</p>
                      <p className="text-xs text-muted">จังหวัดที่ทำงาน</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Remark card (full width) ── */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-foreground">หมายเหตุ</h2>
            {!editCard && alumni.remark && (
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" title="มีหมายเหตุ" />
            )}
          </div>
          {editCard !== "remark" && <EditBtn onClick={() => startEdit("remark")} />}
        </div>

        {editCard === "remark" ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted">แก้ไขหมายเหตุ</span>
              <CardActions onSave={saveRemark} onCancel={cancelEdit} />
            </div>
            <textarea
              value={remarkForm}
              onChange={(e) => setRemarkForm(e.target.value)}
              rows={4}
              placeholder="บันทึกหมายเหตุเพิ่มเติม เช่น สถานะการติดตาม เงื่อนไขพิเศษ หรือข้อมูลอื่นๆ..."
              className={`${inputCls} resize-none`}
            />
          </div>
        ) : alumni.remark ? (
          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{alumni.remark}</p>
        ) : (
          <p className="text-sm text-muted italic">ยังไม่มีหมายเหตุ</p>
        )}
      </div>

    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AlumniDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const { getAlumni, updateAlumni, ready } = useAlumni();
  const { getStudent } = useStudents();

  if (!ready) return <div className="flex items-center justify-center py-24 text-muted text-sm">กำลังโหลดข้อมูล...</div>;

  const alumni = getAlumni(id);
  if (!alumni) notFound();

  const linkedStudent = alumni.studentId ? getStudent(alumni.studentId) : null;

  return (
    <>
      <AdminTopBar
        title={`${alumni.prefix}${alumni.name} ${alumni.lastname}`}
        description={`${alumni.id} · จบการศึกษา ${alumni.graduatedYear} · ${alumni.major}`}
      />

      <div className="sticky top-0 z-20 flex items-center border-b border-border bg-surface/95 px-6 py-2.5 backdrop-blur">
        <Link href="/admin/students/alumni"
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          กลับรายการ
        </Link>
      </div>

      <DetailView alumni={alumni} updateAlumni={(_, data) => updateAlumni(id, data)} student={linkedStudent} />
    </>
  );
}
