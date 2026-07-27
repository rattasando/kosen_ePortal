"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminTopBar from "@/components/admin/ui/AdminTopBar";
import { useAlumni } from "@/components/admin/contexts/AlumniContext";

const PREFIXES = ["นาย", "นางสาว", "นาง"];
const SCHOLARSHIP_STATUSES = ["กำลังทำงาน", "ครบตามสัญญา", "ได้รับยกเว้น"];
const JOB_TYPES = ["พนักงานประจำ", "สัญญาจ้าง", "ฟรีแลนซ์", "ผู้ประกอบการ"];
const EMPTY_JOB = { company: "", position: "", startDate: "", endDate: "", location: "", type: "พนักงานประจำ" };

const inputCls = "w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-accent-soft placeholder:text-muted";
const selectCls = "w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-accent-soft";
const labelCls = "block text-xs font-medium text-foreground mb-1.5";

function genId(existing) {
  const nums = existing.map((a) => parseInt(a.id.replace("ALM", ""), 10)).filter(Number.isFinite);
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `ALM${String(next).padStart(3, "0")}`;
}

export default function AddAlumniPage() {
  const { addAlumni, alumni } = useAlumni();
  const router = useRouter();

  const [prefix, setPrefix] = useState("นาย");
  const [name, setName] = useState("");
  const [lastname, setLastname] = useState("");
  const [nickname, setNickname] = useState("");
  const [studentId, setStudentId] = useState("");
  const [graduatedYear, setGraduatedYear] = useState("");
  const [major, setMajor] = useState("");
  const [university, setUniversity] = useState("");
  const [scholarshipYears, setScholarshipYears] = useState("5");
  const [scholarshipStatus, setScholarshipStatus] = useState("กำลังทำงาน");
  const [contact, setContact] = useState("");
  const [phone, setPhone] = useState("");
  const [jobs, setJobs] = useState([{ ...EMPTY_JOB }]);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedId, setSavedId] = useState("");

  const isValid = name.trim() && lastname.trim() && major.trim() && university.trim() && graduatedYear.trim();

  const setJob = (idx, key, val) =>
    setJobs((prev) => prev.map((j, i) => (i === idx ? { ...j, [key]: val } : j)));

  const addJob = () => setJobs((prev) => [...prev, { ...EMPTY_JOB }]);
  const removeJob = (idx) => setJobs((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    const newId = genId(alumni);
    addAlumni({
      id: newId,
      studentId: studentId.trim() || undefined,
      prefix,
      name: name.trim(),
      lastname: lastname.trim(),
      nickname: nickname.trim() || undefined,
      graduatedYear: parseInt(graduatedYear, 10),
      major: major.trim(),
      university: university.trim(),
      scholarshipYears: parseInt(scholarshipYears, 10),
      scholarshipStatus,
      contact: contact.trim() || undefined,
      phone: phone.trim() || undefined,
      employmentHistory: jobs.filter((j) => j.company.trim()),
    });
    setSaving(false);
    setSavedId(newId);
    setSaved(true);
  };

  const handleReset = () => {
    setSaved(false);
    setPrefix("นาย"); setName(""); setLastname(""); setNickname(""); setStudentId("");
    setGraduatedYear(""); setMajor(""); setUniversity(""); setScholarshipYears("5");
    setScholarshipStatus("กำลังทำงาน"); setContact(""); setPhone("");
    setJobs([{ ...EMPTY_JOB }]);
  };

  if (saved) {
    return (
      <>
        <AdminTopBar title="เพิ่มศิษย์เก่าสำเร็จ" />
        <div className="flex flex-col items-center gap-4 py-24 text-center p-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">เพิ่มศิษย์เก่าสำเร็จ!</p>
            <p className="mt-1 text-sm text-muted">{prefix}{name} {lastname} ({savedId}) ถูกเพิ่มเข้าระบบแล้ว</p>
          </div>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <Link href={`/admin/students/alumni/${savedId}`} className="btn-primary">ดูข้อมูลศิษย์เก่า</Link>
            <button onClick={handleReset} className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-muted hover:text-foreground transition-colors">
              เพิ่มศิษย์เก่าคนต่อไป
            </button>
            <Link href="/admin/students/alumni" className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-muted hover:text-foreground transition-colors">
              กลับรายการ
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AdminTopBar title="เพิ่มศิษย์เก่าใหม่" description="กรอกข้อมูลศิษย์เก่าเพื่อเพิ่มเข้าระบบติดตาม" />

      <div className="p-6">
        <Link href="/admin/students/alumni"
          className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          กลับไปรายการศิษย์เก่า
        </Link>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* ── ข้อมูลส่วนตัว ── */}
          <div className="rounded-2xl border border-border bg-surface overflow-hidden">
            <div className="flex items-center gap-3 border-b border-border px-5 py-3.5 bg-surface-muted">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-soft text-sm">👤</span>
              <div>
                <p className="text-sm font-semibold text-foreground">ข้อมูลส่วนตัว</p>
                <p className="text-xs text-muted">ชื่อ-นามสกุล และข้อมูลการติดต่อ</p>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div>
                  <label className={labelCls}>คำนำหน้า</label>
                  <select value={prefix} onChange={(e) => setPrefix(e.target.value)} className={selectCls}>
                    {PREFIXES.map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>ชื่อ <span className="text-red-500">*</span></label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="สมชาย" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>นามสกุล <span className="text-red-500">*</span></label>
                  <input type="text" value={lastname} onChange={(e) => setLastname(e.target.value)} placeholder="ประเสริฐ" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>ชื่อเล่น</label>
                  <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="ชาย" className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className={labelCls}>รหัสนักเรียน (ถ้ามี)</label>
                  <input type="text" value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="STU-001" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>อีเมล</label>
                  <input type="email" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="email@example.com" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>โทรศัพท์</label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="081-234-5678" className={inputCls} />
                </div>
              </div>
            </div>
          </div>

          {/* ── ข้อมูลการศึกษาและทุน ── */}
          <div className="rounded-2xl border border-border bg-surface overflow-hidden">
            <div className="flex items-center gap-3 border-b border-border px-5 py-3.5 bg-surface-muted">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-soft text-sm">🎓</span>
              <div>
                <p className="text-sm font-semibold text-foreground">ข้อมูลการศึกษาและทุน</p>
                <p className="text-xs text-muted">สาขา มหาวิทยาลัย และเงื่อนไขทุน</p>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className={labelCls}>สาขาวิชา <span className="text-red-500">*</span></label>
                  <input type="text" value={major} onChange={(e) => setMajor(e.target.value)} placeholder="วิศวกรรมหุ่นยนต์" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>มหาวิทยาลัย <span className="text-red-500">*</span></label>
                  <input type="text" value={university} onChange={(e) => setUniversity(e.target.value)} placeholder="KMITL" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>ปีที่จบ (พ.ศ.) <span className="text-red-500">*</span></label>
                  <input type="number" value={graduatedYear} onChange={(e) => setGraduatedYear(e.target.value)} placeholder="2565" min="2550" max="2580" className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>จำนวนปีทุน</label>
                  <select value={scholarshipYears} onChange={(e) => setScholarshipYears(e.target.value)} className={selectCls}>
                    {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n} ปี</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>สถานะทุน</label>
                  <select value={scholarshipStatus} onChange={(e) => setScholarshipStatus(e.target.value)} className={selectCls}>
                    {SCHOLARSHIP_STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* ── ประวัติการทำงาน ── */}
          <div className="rounded-2xl border border-border bg-surface overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5 bg-surface-muted">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-soft text-sm">💼</span>
                <div>
                  <p className="text-sm font-semibold text-foreground">ประวัติการทำงาน</p>
                  <p className="text-xs text-muted">เพิ่มประวัติการทำงาน (ไม่บังคับ)</p>
                </div>
              </div>
              <button type="button" onClick={addJob}
                className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-primary px-3 py-1.5 text-xs font-medium text-primary hover:bg-accent-soft transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                เพิ่มรายการ
              </button>
            </div>
            <div className="p-5 space-y-4">
              {jobs.map((job, idx) => (
                <div key={idx} className="relative rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-muted">รายการที่ {idx + 1}</span>
                    {jobs.length > 1 && (
                      <button type="button" onClick={() => removeJob(idx)}
                        className="text-xs text-red-500 hover:text-red-600 transition-colors">
                        ลบ
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className={labelCls}>บริษัท / องค์กร</label>
                      <input type="text" value={job.company} onChange={(e) => setJob(idx, "company", e.target.value)} placeholder="ชื่อบริษัท" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>ตำแหน่ง</label>
                      <input type="text" value={job.position} onChange={(e) => setJob(idx, "position", e.target.value)} placeholder="ตำแหน่งงาน" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>วันที่เริ่ม (พ.ศ.)</label>
                      <input type="text" value={job.startDate} onChange={(e) => setJob(idx, "startDate", e.target.value)} placeholder="2565-06" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>วันที่สิ้นสุด (พ.ศ. หรือว่างถ้ายังทำอยู่)</label>
                      <input type="text" value={job.endDate} onChange={(e) => setJob(idx, "endDate", e.target.value)} placeholder="2566-12" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>สถานที่</label>
                      <input type="text" value={job.location} onChange={(e) => setJob(idx, "location", e.target.value)} placeholder="กรุงเทพฯ" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>ประเภทการจ้าง</label>
                      <select value={job.type} onChange={(e) => setJob(idx, "type", e.target.value)} className={selectCls}>
                        {JOB_TYPES.map((t) => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Action buttons ── */}
          <div className="flex items-center justify-between rounded-2xl border border-border bg-surface px-5 py-4">
            <p className="text-xs text-muted"><span className="text-red-500">*</span> จำเป็นต้องกรอก</p>
            <div className="flex items-center gap-3">
              <Link href="/admin/students/alumni"
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
