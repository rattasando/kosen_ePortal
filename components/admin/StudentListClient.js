"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminTable from "@/components/admin/ui/AdminTable";
import StudentActionButtons from "@/components/admin/ui/StudentActionButtons";
import { useStudents } from "@/components/admin/contexts/StudentContext";
import { useStudentHistory } from "@/components/admin/contexts/StudentHistoryContext";
import { diffSnapshot, buildSummary } from "@/lib/utils/studentHistoryHelpers";
import { formatThaiNationalId } from "@/lib/utils/inputFilters";

// ── CSV helpers ──────────────────────────────────────────────
// One row per student; up to 3 enrollments; both TH + JP addresses; banking & travel fields
const DATE_FIELDS = new Set(["dob", "departureDateTH", "arrivalDateJP"]);

const CSV_HEADERS = [
  "no.", "prefix", "name", "lastname", "prefixEn", "nameEn", "lastnameEn", "nickname",
  "gender", "dob", "nationalId", "passport", "militaryStatus",
  // Enrollment 1 (primary institution)
  "enroll1_university", "enroll1_studentId", "enroll1_email",
  "enroll1_faculty", "enroll1_department", "enroll1_major",
  "enroll1_year", "enroll1_advisor", "enroll1_project",
  // Enrollment 2 (exchange / second institution, if any)
  "enroll2_university", "enroll2_studentId", "enroll2_email",
  "enroll2_faculty", "enroll2_department", "enroll2_major",
  "enroll2_year", "enroll2_advisor", "enroll2_project",
  // Enrollment 3 (third institution, if any)
  "enroll3_university", "enroll3_studentId", "enroll3_email",
  "enroll3_faculty", "enroll3_department", "enroll3_major",
  "enroll3_year", "enroll3_advisor", "enroll3_project",
  "prevSchool", "scholarship",
  "tel", "email", "lineId", "country",
  // Thai address
  "addr_th_houseNo", "addr_th_subdistrict", "addr_th_district", "addr_th_province", "addr_th_postalCode",
  // Japanese address
  "addr_jp_postalCode", "addr_jp_prefecture", "addr_jp_city", "addr_jp_street", "addr_jp_building",
  // Banking
  "bankName", "bankBranch", "bankAccountNo",
  // Travel
  "departureDateTH", "arrivalDateJP",
  "status", "note",
];

// Convert common date formats → YYYY-MM-DD without using new Date() (timezone-safe)
function parseDateToISO(v) {
  const s = String(v ?? "").trim();
  if (!s) return s;
  let m;
  m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`;
  m = s.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  return s;
}

function toCSVField(val) {
  const s = String(val ?? "");
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

// Flatten a nested student object to a plain object keyed by CSV_HEADERS names
function studentToFlat(s) {
  const e1 = s.enrollments?.[0] ?? {};
  const e2 = s.enrollments?.[1] ?? {};
  const e3 = s.enrollments?.[2] ?? {};
  const th = s.addresses?.th ?? {};
  const jp = s.addresses?.jp ?? {};
  return {
    prefix: s.prefix, prefixEn: s.prefixEn, name: s.name, nameEn: s.nameEn,
    lastname: s.lastname, lastnameEn: s.lastnameEn, nickname: s.nickname,
    gender: s.gender, dob: parseDateToISO(s.dob), nationalId: s.nationalId,
    passport: s.passport, militaryStatus: s.militaryStatus,
    enroll1_university: e1.university, enroll1_studentId: e1.studentId, enroll1_email: e1.univEmail,
    enroll1_faculty: e1.faculty, enroll1_department: e1.department, enroll1_major: e1.major,
    enroll1_year: e1.year, enroll1_advisor: e1.advisor, enroll1_project: e1.project,
    enroll2_university: e2.university, enroll2_studentId: e2.studentId, enroll2_email: e2.univEmail,
    enroll2_faculty: e2.faculty, enroll2_department: e2.department, enroll2_major: e2.major,
    enroll2_year: e2.year, enroll2_advisor: e2.advisor, enroll2_project: e2.project,
    enroll3_university: e3.university, enroll3_studentId: e3.studentId, enroll3_email: e3.univEmail,
    enroll3_faculty: e3.faculty, enroll3_department: e3.department, enroll3_major: e3.major,
    enroll3_year: e3.year, enroll3_advisor: e3.advisor, enroll3_project: e3.project,
    prevSchool: s.prevSchool, scholarship: s.scholarship,
    tel: s.tel, email: s.email, lineId: s.lineId, country: s.country,
    addr_th_houseNo: th.houseNo, addr_th_subdistrict: th.subdistrict,
    addr_th_district: th.district, addr_th_province: th.province, addr_th_postalCode: th.postalCode,
    addr_jp_postalCode: jp.postalCode, addr_jp_prefecture: jp.prefecture,
    addr_jp_city: jp.city, addr_jp_street: jp.streetAddress, addr_jp_building: jp.building,
    bankName: s.bankName, bankBranch: s.bankBranch, bankAccountNo: s.bankAccountNo,
    departureDateTH: parseDateToISO(s.departureDateTH), arrivalDateJP: parseDateToISO(s.arrivalDateJP),
    status: s.status, note: s.note,
  };
}

function studentToRow(s, index) {
  const flat = studentToFlat(s);
  return CSV_HEADERS.map((k) => k === "no." ? String(index + 1) : toCSVField(flat[k]));
}

// Reconstruct a nested student object from a flat CSV row
function rowToStudent(row) {
  const enrollments = [];
  for (let i = 1; i <= 3; i++) {
    const uni = (row[`enroll${i}_university`] ?? "").trim();
    if (uni) {
      enrollments.push({
        university: uni,
        studentId: row[`enroll${i}_studentId`] ?? "",
        univEmail: row[`enroll${i}_email`] ?? "",
        faculty: row[`enroll${i}_faculty`] ?? "",
        department: row[`enroll${i}_department`] ?? "",
        major: row[`enroll${i}_major`] ?? "",
        year: row[`enroll${i}_year`] ?? "",
        advisor: row[`enroll${i}_advisor`] ?? "",
        project: row[`enroll${i}_project`] ?? "",
      });
    }
  }
  return {
    id: row.id,
    prefix: row.prefix ?? "", prefixEn: row.prefixEn ?? "",
    name: row.name ?? "", nameEn: row.nameEn ?? "",
    lastname: row.lastname ?? "", lastnameEn: row.lastnameEn ?? "",
    nickname: row.nickname ?? "", gender: row.gender ?? "",
    dob: row.dob ?? "", nationalId: formatThaiNationalId(row.nationalId ?? ""),
    passport: row.passport ?? "", militaryStatus: row.militaryStatus ?? "",
    enrollments: enrollments.length > 0 ? enrollments : [],
    prevSchool: row.prevSchool ?? "", scholarship: row.scholarship ?? "",
    tel: row.tel ?? "", email: row.email ?? "", lineId: row.lineId ?? "", country: row.country ?? "",
    addresses: {
      th: {
        houseNo: row.addr_th_houseNo ?? "",
        subdistrict: row.addr_th_subdistrict ?? "",
        district: row.addr_th_district ?? "",
        province: row.addr_th_province ?? "",
        postalCode: row.addr_th_postalCode ?? "",
      },
      jp: {
        postalCode: row.addr_jp_postalCode ?? "",
        prefecture: row.addr_jp_prefecture ?? "",
        city: row.addr_jp_city ?? "",
        streetAddress: row.addr_jp_street ?? "",
        building: row.addr_jp_building ?? "",
      },
    },
    bankName: row.bankName ?? "", bankBranch: row.bankBranch ?? "", bankAccountNo: row.bankAccountNo ?? "",
    departureDateTH: row.departureDateTH ?? "", arrivalDateJP: row.arrivalDateJP ?? "",
    status: row.status ?? "", note: row.note ?? "",
  };
}

function exportCSV(students) {
  const rows = [CSV_HEADERS.join(","), ...students.map((s, i) => studentToRow(s, i).join(","))];
  const blob = new Blob(["﻿" + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `students_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function parseCSVLine(line) {
  const values = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else inQ = !inQ;
    } else if (ch === "," && !inQ) {
      values.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  values.push(cur);
  return values;
}

function parseCSV(text) {
  const lines = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((l) => l.trim());
  if (lines.length < 2) return { error: "ไฟล์ว่างหรือไม่มีข้อมูล" };
  const headers = parseCSVLine(lines[0]).map((h) => h.trim());
  // nationalId คือ key หลักสำหรับจับคู่และสร้าง record ใหม่ — บังคับเพียงคอลัมน์เดียว
  const missing = ["nationalId"].filter((r) => !headers.includes(r));
  if (missing.length)
    return { error: `ไม่พบคอลัมน์ที่จำเป็น: ${missing.join(", ")}` };
  const rows = lines
    .slice(1)
    .map((line) => {
      const vals = parseCSVLine(line);
      const obj = {};
      headers.forEach((h, i) => {
        const raw = vals[i] ?? "";
        obj[h] = DATE_FIELDS.has(h) ? parseDateToISO(raw) : raw;
      });
      return obj;
    })
    .filter((r) => r.nationalId?.trim());
  if (!rows.length) return { error: "ไม่พบข้อมูลนักเรียนที่ถูกต้องในไฟล์" };
  return { rows, headers };
}

// ── Import Modal ─────────────────────────────────────────────
const FIELD_LABEL_MAP = {
  id: "รหัส", prefix: "คำนำหน้า", prefixEn: "คำนำหน้า (EN)", name: "ชื่อ", nameEn: "First Name",
  lastname: "นามสกุล", lastnameEn: "Last Name", nickname: "ชื่อเล่น", gender: "เพศ", dob: "วันเกิด",
  nationalId: "เลขบัตรประชาชน", passport: "Passport", militaryStatus: "เกณฑ์ทหาร",
  enroll1_university: "สถาบัน 1", enroll1_studentId: "รหัสนักศึกษา 1", enroll1_email: "อีเมลสถาบัน 1",
  enroll1_faculty: "คณะ 1", enroll1_department: "ภาควิชา 1", enroll1_major: "สาขา 1",
  enroll1_year: "ชั้นปี 1", enroll1_advisor: "อาจารย์ที่ปรึกษา 1", enroll1_project: "โปรเจกต์ 1",
  enroll2_university: "สถาบัน 2", enroll2_studentId: "รหัสนักศึกษา 2", enroll2_email: "อีเมลสถาบัน 2",
  enroll2_faculty: "คณะ 2", enroll2_department: "ภาควิชา 2", enroll2_major: "สาขา 2",
  enroll2_year: "ชั้นปี 2", enroll2_advisor: "อาจารย์ที่ปรึกษา 2", enroll2_project: "โปรเจกต์ 2",
  enroll3_university: "สถาบัน 3", enroll3_studentId: "รหัสนักศึกษา 3", enroll3_email: "อีเมลสถาบัน 3",
  enroll3_faculty: "คณะ 3", enroll3_department: "ภาควิชา 3", enroll3_major: "สาขา 3",
  enroll3_year: "ชั้นปี 3", enroll3_advisor: "อาจารย์ที่ปรึกษา 3", enroll3_project: "โปรเจกต์ 3",
  prevSchool: "โรงเรียนเดิม", scholarship: "ทุนการศึกษา",
  tel: "เบอร์โทร", email: "อีเมล", lineId: "LINE ID", country: "ประเทศ",
  addr_th_houseNo: "บ้านเลขที่ (ไทย)", addr_th_subdistrict: "ตำบล/แขวง", addr_th_district: "อำเภอ/เขต",
  addr_th_province: "จังหวัด", addr_th_postalCode: "รหัสไปรษณีย์ (ไทย)",
  addr_jp_postalCode: "รหัสไปรษณีย์ (ญี่ปุ่น)", addr_jp_prefecture: "จังหวัด (ญี่ปุ่น)",
  addr_jp_city: "เมือง", addr_jp_street: "ที่อยู่", addr_jp_building: "อาคาร/อพาร์ตเมนต์",
  bankName: "ธนาคาร", bankBranch: "สาขาธนาคาร", bankAccountNo: "เลขที่บัญชี",
  departureDateTH: "วันเดินทางออกจากไทย", arrivalDateJP: "วันที่ถึงญี่ปุ่น",
  status: "สถานะ", note: "หมายเหตุ",
};

function normalizeVal(k, v) {
  const s = String(v ?? "").trim();
  if (!s) return s;
  return DATE_FIELDS.has(k) ? parseDateToISO(s) : s;
}

function computeDiff(incoming, existing) {
  const stripDashes = (v) => String(v ?? "").replace(/-/g, "").trim();
  // จับคู่ด้วย nationalId (strip ขีด) เหมือน handleImport
  const existingByNationalId = Object.fromEntries(
    (existing ?? []).filter((s) => s.nationalId).map((s) => [stripDashes(s.nationalId), s])
  );
  const incomingNationalIds = new Set(incoming.map((r) => stripDashes(r.nationalId)));
  const results = incoming.map((row) => {
    const prev = existingByNationalId[stripDashes(row.nationalId)];
    if (!prev) return { type: "new", row, changes: [] };
    const prevFlat = studentToFlat(prev);
    const changes = CSV_HEADERS.filter((k) => k !== "no.").filter((k) => {
      const a = normalizeVal(k, prevFlat[k]);
      const b = normalizeVal(k, row[k]);
      return a !== b;
    }).map((k) => ({ field: k, label: FIELD_LABEL_MAP[k] ?? k, before: prevFlat[k] ?? "", after: row[k] ?? "" }));
    return { type: changes.length > 0 ? "update" : "unchanged", row, changes };
  });
  const deleted = (existing ?? []).filter((s) => !incomingNationalIds.has(stripDashes(s.nationalId)));
  return { results, deleted };
}

function ImportModal({ onClose, onConfirm, existingStudents }) {
  const [step, setStep] = useState("upload");
  const [parsed, setParsed] = useState(null);
  const [mode, setMode] = useState("merge");
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(new Set());
  const fileRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    if (!file.name.endsWith(".csv")) { setError("กรุณาเลือกไฟล์ .csv เท่านั้น"); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = parseCSV(e.target.result);
      if (result.error) { setError(result.error); return; }
      setParsed(result);
      setError("");
      setStep("preview");
    };
    reader.readAsText(file, "UTF-8");
  };

  const handleDrop = (e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); };
  const handleConfirm = () => { onConfirm(parsed.rows, mode); onClose(); };

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const diff = parsed ? computeDiff(parsed.rows, existingStudents) : null;
  const counts = diff ? {
    new: diff.results.filter((r) => r.type === "new").length,
    update: diff.results.filter((r) => r.type === "update").length,
    unchanged: diff.results.filter((r) => r.type === "unchanged").length,
    deleted: mode === "replace" ? diff.deleted.length : 0,
  } : null;

  const toggleExpand = (id) => setExpanded((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const TYPE_CFG = {
    new:       { color: "bg-emerald-100 text-emerald-700 border-emerald-200", label: "ใหม่" },
    update:    { color: "bg-blue-100 text-blue-700 border-blue-200",          label: "อัปเดต" },
    unchanged: { color: "bg-gray-100 text-gray-500 border-gray-200",          label: "ไม่เปลี่ยน" },
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-3xl rounded-2xl border border-border bg-surface shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">นำเข้าข้อมูลนักเรียน</p>
              <p className="text-xs text-muted">
                {step === "upload" ? "เลือกไฟล์ CSV ที่ต้องการนำเข้า" : `พบข้อมูล ${parsed?.rows.length} รายการ`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-surface-muted hover:text-foreground transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5">
          {step === "upload" ? (
            <div className="space-y-4">
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
              <div
                className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border py-10 hover:border-primary hover:bg-accent-soft/30 transition-colors"
                onClick={() => fileRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">ลากไฟล์มาวางที่นี่ หรือ <span className="text-primary underline">คลิกเพื่อเลือกไฟล์</span></p>
                  <p className="mt-1 text-xs text-muted">รองรับเฉพาะไฟล์ .csv (UTF-8)</p>
                </div>
              </div>
              {error && <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600 border border-red-200">{error}</p>}
              <div className="rounded-lg bg-surface-muted px-4 py-3 text-xs text-muted">
                <p className="font-semibold text-foreground mb-1">คอลัมน์ที่รองรับ</p>
                <p className="font-mono leading-relaxed">{CSV_HEADERS.join(", ")}</p>
                <p className="mt-1">คอลัมน์บังคับ: <span className="font-semibold text-foreground">nationalId</span> — ใช้จับคู่กับข้อมูลในระบบ และสร้าง record ใหม่ถ้าไม่เจอ</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Back to file select */}
              <div className="flex justify-end">
                <button onClick={() => { setStep("upload"); setParsed(null); setExpanded(new Set()); }} className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V7.414A2 2 0 0017.414 6L14 2.586A2 2 0 0012.586 2H4zm2 10a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1-4a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                  เลือกไฟล์ใหม่
                </button>
              </div>

              {/* Mode selector */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "merge",   label: "รวมข้อมูล",     desc: "เพิ่มรายการใหม่ / อัปเดตรายการที่มี ID ซ้ำ" },
                  { value: "replace", label: "แทนที่ทั้งหมด", desc: "ลบข้อมูลเดิมทั้งหมดแล้วใช้ข้อมูลใหม่" },
                ].map((opt) => (
                  <button key={opt.value} onClick={() => setMode(opt.value)}
                    className={`rounded-xl border p-3 text-left transition-all ${mode === opt.value ? "border-primary bg-accent-soft ring-2 ring-primary/20" : "border-border hover:border-primary"}`}>
                    <p className="text-sm font-semibold text-foreground">{opt.label}</p>
                    <p className="text-xs text-muted mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>

              {/* Summary chips */}
              {counts && (
                <div className="flex flex-wrap gap-2">
                  {counts.new > 0 && <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">+{counts.new} ใหม่</span>}
                  {counts.update > 0 && <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">✎ {counts.update} อัปเดต</span>}
                  {counts.unchanged > 0 && <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-500">= {counts.unchanged} ไม่เปลี่ยน</span>}
                  {counts.deleted > 0 && <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">−{counts.deleted} ลบออก</span>}
                </div>
              )}

              {/* Per-row detail */}
              <div className="space-y-2">
                {diff?.results.map(({ type, row, changes }) => {
                  const cfg = TYPE_CFG[type];
                  const rowKey = row.nationalId || row.name;
                  const isOpen = expanded.has(rowKey);
                  const hasDetail = type === "new" || type === "update";
                  return (
                    <div key={rowKey} className="rounded-xl border border-border overflow-hidden">
                      <button
                        type="button"
                        onClick={() => hasDetail && toggleExpand(rowKey)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left ${hasDetail ? "hover:bg-surface-muted/50 cursor-pointer" : "cursor-default"}`}
                      >
                        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${cfg.color}`}>{cfg.label}</span>
                        <span className="flex-1 text-sm font-medium text-foreground">{row.prefix}{row.name} {row.lastname}</span>
                        <span className="text-xs text-muted font-mono">{row.university || "-"}</span>
                        {type === "update" && <span className="text-xs text-blue-600 shrink-0">{changes.length} field เปลี่ยน</span>}
                        {hasDetail && (
                          <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-muted transition-transform shrink-0 ${isOpen ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>

                      {isOpen && type === "update" && changes.length > 0 && (
                        <div className="border-t border-border px-4 py-3 space-y-1.5 bg-surface-muted/30">
                          {changes.map((c) => (
                            <div key={c.field} className="text-xs space-y-0.5">
                              <span className="font-semibold text-foreground">{c.label}</span>
                              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                                <span className="rounded bg-red-50 px-1.5 py-0.5 text-red-600 line-through break-all">{c.before || "—"}</span>
                                <span className="text-muted shrink-0">→</span>
                                <span className="rounded bg-emerald-50 px-1.5 py-0.5 font-semibold text-emerald-700 break-all">{c.after || "—"}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {isOpen && type === "new" && (
                        <div className="border-t border-border px-4 py-3 bg-surface-muted/30">
                          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                            {CSV_HEADERS.filter((k) => row[k]).map((k) => (
                              <div key={k} className="text-xs">
                                <span className="text-muted">{FIELD_LABEL_MAP[k] ?? k}: </span>
                                <span className="font-medium text-foreground break-all">{row[k]}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {mode === "replace" && diff?.deleted.length > 0 && (
                  <div className="rounded-xl border border-red-200 bg-red-50/50 overflow-hidden">
                    <div className="px-4 py-2.5 text-xs font-semibold text-red-600">จะถูกลบออก ({diff.deleted.length} รายการ)</div>
                    <div className="border-t border-red-200 px-4 py-3 space-y-1">
                      {diff.deleted.map((s) => (
                        <p key={s.id} className="text-xs text-red-700">{s.prefix}{s.name} {s.lastname} <span className="font-mono text-red-400 ml-1">{s.id}</span></p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === "preview" && (
          <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4 shrink-0">
            <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors">
              ยกเลิก
            </button>
            <button onClick={handleConfirm} className="btn-primary">
              {mode === "replace" ? `แทนที่ด้วย ${parsed.rows.length} รายการ` : `รวม ${parsed.rows.length} รายการ`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Enrollment helpers ───────────────────────────────────────
// ถ้ามีมากกว่า 1 สถาบัน ให้ใช้ "สถาบันปัจจุบัน" (endDate ว่าง = ยังไม่จบ/ยังไม่
// ย้ายออก) แทนสถาบันแรกที่เคยเรียน — ถ้าไม่มีอันไหนที่ endDate ว่างเลย (ข้อมูล
// เก่าก่อนมี field นี้ หรือกรอกวันจบไว้ครบทุกอัน) ค่อย fallback ไปใช้ตัวท้ายสุด
// ของ array (เรียงตาม order จากน้อยไปมากมาจาก API อยู่แล้ว)
function getLatestEnrollment(s) {
  if (s.enrollments?.length) {
    const current = [...s.enrollments].reverse().find((e) => !e.endDate);
    return current ?? s.enrollments[s.enrollments.length - 1];
  }
  return {
    university: s.university,
    faculty: s.faculty,
    department: s.department,
    major: s.major,
    year: s.year,
  };
}

// ── สถานะนักเรียน ───────────────────────────────────────────
const STATUS_CONFIG = {
  กำลังศึกษา: {
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  ฝึกงาน: {
    color: "bg-blue-100 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
  },
  จบการศึกษา: {
    color: "bg-gray-100 text-gray-600 border-gray-200",
    dot: "bg-gray-400",
  },
  พักการเรียน: {
    color: "bg-amber-100 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  พ้นสภาพ: {
    color: "bg-red-100 text-red-700 border-red-200",
    dot: "bg-red-500",
  },
};
const ALL_STATUSES = ["ทั้งหมด", ...Object.keys(STATUS_CONFIG)];

// ── ชื่อแสดงของทุน ───────────────────────────────────────────
const SCHOLARSHIP_LABEL = {
  "ทุน 2 ปี": "ทุน 2 ปี (advance course)",
  "ทุน 3 ปี": "ทุน 3 ปี (transfer)",
};
const scholarshipLabel = (val) => SCHOLARSHIP_LABEL[val] ?? val;

// ── StatusBadge ─────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? {
    color: "bg-gray-100 text-gray-500 border-gray-200",
    dot: "bg-gray-400",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${cfg.color}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {status}
    </span>
  );
}

// ── Email Compose Modal ─────────────────────────────────────
function EmailModal({ student, onClose }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const subjectRef = useRef(null);

  useEffect(() => {
    subjectRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSend = () => {
    if (!subject.trim() || !message.trim()) return;
    console.log("Send email to", student.email, { subject, message });
    setSent(true);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(student.email);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-2xl border border-border bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-primary"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">ส่งอีเมล</p>
              <p className="text-xs text-muted">
                {student.prefix}
                {student.name} {student.lastname}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-surface-muted hover:text-foreground transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {sent ? (
          <div className="flex flex-col items-center gap-3 py-12 px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-7 w-7"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <p className="text-sm font-semibold text-foreground">
              ส่งอีเมลเรียบร้อยแล้ว
            </p>
            <p className="text-xs text-muted">ถึง {student.email}</p>
            <button onClick={onClose} className="mt-2 btn-primary">
              ปิด
            </button>
          </div>
        ) : (
          <div className="space-y-4 p-5">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">
                ถึง
              </label>
              <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-muted px-3 py-2">
                <span className="flex-1 text-sm text-foreground">
                  {student.email}
                </span>
                <button
                  onClick={handleCopy}
                  title="คัดลอกอีเมล"
                  className="text-muted hover:text-primary transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                  </svg>
                </button>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">
                หัวข้อ
              </label>
              <input
                ref={subjectRef}
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="ระบุหัวข้ออีเมล..."
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-accent-soft"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">
                ข้อความ
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                placeholder="พิมพ์ข้อความที่ต้องการส่ง..."
                className="w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-accent-soft"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={onClose}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSend}
                disabled={!subject.trim() || !message.trim()}
                className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
                ส่งอีเมล
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── ContactButtons ───────────────────────────────────────────
function CopyButton({ value }) {
  const [copied, setCopied] = useState(false);
  const copy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={copy}
      title={copied ? "คัดลอกแล้ว" : "คัดลอก"}
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition-colors ${
        copied
          ? "border-emerald-300 bg-emerald-50 text-emerald-500"
          : "border-border bg-surface text-muted hover:border-primary hover:text-primary"
      }`}
    >
      {copied ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
          <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
        </svg>
      )}
    </button>
  );
}

function ContactButtons({ tel, student }) {
  return (
    <div className="flex flex-col gap-0.5">
      {tel ? (
        <a href={`tel:${tel}`} onClick={(e) => e.stopPropagation()}
          className="text-xs text-foreground hover:text-emerald-600 transition-colors whitespace-nowrap">
          {tel}
        </a>
      ) : null}
      {student.email ? (
        <a href={`mailto:${student.email}`} onClick={(e) => e.stopPropagation()}
          className="text-xs text-muted hover:text-primary transition-colors truncate" title={student.email}>
          {student.email}
        </a>
      ) : null}
      {!tel && !student.email && <span className="text-xs text-muted">—</span>}
    </div>
  );
}

const PAGE_SIZE_OPTIONS = [20, 25, 30, 50];

// ── HighlightText ────────────────────────────────────────────
function HighlightText({ text, terms }) {
  if (!text || !terms.length) return <>{text}</>;
  const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const parts = text.split(new RegExp(`(${escaped.join("|")})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <mark
            key={i}
            className="rounded bg-amber-100 text-amber-800 px-0.5 not-italic"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

// ── getMatchContext ───────────────────────────────────────────
// Returns hidden fields that matched any of the search terms
const HIDDEN_FIELDS = [
  { label: "ชื่อเล่น", get: (s) => s.nickname },
  { label: "คณะ", get: (s) => s.enrollments?.[0]?.faculty ?? s.faculty },
  {
    label: "ภาควิชา",
    get: (s) => s.enrollments?.[0]?.department ?? s.department,
  },
  { label: "สาขา", get: (s) => s.enrollments?.[0]?.major ?? s.major },
  { label: "โรงเรียนเดิม", get: (s) => s.prevSchool },
  {
    label: "อาจารย์ที่ปรึกษา",
    get: (s) => s.enrollments?.[0]?.advisor ?? s.advisor,
  },
  {
    label: "หัวข้อโปรเจกต์",
    get: (s) => s.enrollments?.[0]?.project ?? s.project,
  },
  {
    label: "รหัสนักศึกษา",
    get: (s) =>
      s.enrollments
        ?.map((e) => e.studentId)
        .filter(Boolean)
        .join(", "),
  },
  { label: "ทุน", get: (s) => s.scholarship },
  { label: "LINE", get: (s) => s.lineId },
  { label: "จังหวัด (ไทย)", get: (s) => s.addresses?.th?.province },
  { label: "เขต/อำเภอ (ไทย)", get: (s) => s.addresses?.th?.district },
  { label: "จังหวัด (ญี่ปุ่น)", get: (s) => s.addresses?.jp?.prefecture },
  { label: "บัตรประชาชน", get: (s) => s.nationalId },
  { label: "Passport", get: (s) => s.passport },
];

function getMatchContext(s, terms) {
  if (!terms.length) return [];
  return HIDDEN_FIELDS.filter(({ get: getValue }) => {
    const val = getValue(s);
    if (!val) return false;
    return terms.some((t) => val.toLowerCase().includes(t.toLowerCase()));
  }).map(({ label, get: getValue }) => ({ label, value: getValue(s) }));
}

// ── Pagination controls ──────────────────────────────────────
function Pagination({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null;

  const pages = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("…");
    for (
      let i = Math.max(2, page - 1);
      i <= Math.min(totalPages - 1, page + 1);
      i++
    )
      pages.push(i);
    if (page < totalPages - 2) pages.push("…");
    pages.push(totalPages);
  }

  const btnBase =
    "flex h-8 min-w-[2rem] items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors";

  return (
    <div className="flex items-center gap-1">
      <button
        disabled={page === 1}
        onClick={() => onPage(page - 1)}
        className={`${btnBase} border border-border text-muted hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed`}
      >
        ‹
      </button>
      {pages.map((p, i) =>
        p === "…" ? (
          <span
            key={`ellipsis-${i}`}
            className="px-1 text-sm text-muted select-none"
          >
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPage(p)}
            className={`${btnBase} border ${
              p === page
                ? "border-primary bg-primary text-white"
                : "border-border text-muted hover:border-primary hover:text-primary"
            }`}
          >
            {p}
          </button>
        ),
      )}
      <button
        disabled={page === totalPages}
        onClick={() => onPage(page + 1)}
        className={`${btnBase} border border-border text-muted hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed`}
      >
        ›
      </button>
    </div>
  );
}

// ── Filter persistence ───────────────────────────────────────
const FILTER_KEY = "student-list-filters";

const selectCls = "rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-accent-soft";
const labelCls  = "text-xs font-medium text-foreground";
const chipBase  = "inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-accent-soft px-2.5 py-1 text-xs font-semibold text-primary hover:border-red-400 hover:bg-red-50 hover:text-red-500 transition-colors";

function XIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  );
}

function loadFilters() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(sessionStorage.getItem(FILTER_KEY)) ?? {};
  } catch {
    return {};
  }
}

function saveFilters(data) {
  try {
    sessionStorage.setItem(FILTER_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

// ── Main ─────────────────────────────────────────────────────
export default function StudentListClient() {
  const { students, ready, replaceAll, updateStudent, addStudent, refetch } =
    useStudents();
  const { addEvent } = useStudentHistory();
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [keywords, setKeywords] = useState(() => loadFilters().keywords ?? []);
  const [filterStatus, setFilterStatus] = useState(
    () => loadFilters().filterStatus ?? "ทั้งหมด",
  );
  const [filterUniversity, setFilterUniversity] = useState(
    () => loadFilters().filterUniversity ?? "ทั้งหมด",
  );
  const [filterYear, setFilterYear] = useState(
    () => loadFilters().filterYear ?? "ทั้งหมด",
  );
  const [filterScholarship, setFilterScholarship] = useState(
    () => loadFilters().filterScholarship ?? "ทั้งหมด",
  );
  const [filterSelfFunded, setFilterSelfFunded] = useState(
    () => loadFilters().filterSelfFunded ?? false,
  );
  const [filterCountry, setFilterCountry] = useState(
    () => loadFilters().filterCountry ?? "ทั้งหมด",
  );
  const [sortBy, setSortBy] = useState(() => loadFilters().sortBy ?? "default");

  useEffect(() => {
    saveFilters({
      keywords,
      filterStatus,
      filterUniversity,
      filterYear,
      filterScholarship,
      filterSelfFunded,
      filterCountry,
      sortBy,
    });
  }, [
    keywords,
    filterStatus,
    filterUniversity,
    filterYear,
    filterScholarship,
    filterSelfFunded,
    filterCountry,
    sortBy,
  ]);
  const [showImport, setShowImport] = useState(false);
  const [importDone, setImportDone] = useState(null);
  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef(null);

  // close export menu when clicking outside
  useEffect(() => {
    if (!showExportMenu) return;
    const handler = (e) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target))
        setShowExportMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showExportMenu]);

  const toggleSelect = (id) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const clearSelection = () => setSelectedIds(new Set());

  const addKeyword = (kw) => {
    const trimmed = kw.trim();
    if (!trimmed) return;
    setKeywords((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
    setSearchInput("");
    setPage(1);
  };

  const removeKeyword = (kw) => {
    setKeywords((prev) => prev.filter((k) => k !== kw));
    setPage(1);
  };

  const universities = useMemo(() => {
    const unique = [
      ...new Set(
        students.map((s) => getLatestEnrollment(s).university).filter(Boolean),
      ),
    ];
    return ["ทั้งหมด", ...unique];
  }, [students]);

  const scholarships = useMemo(() => {
    const unique = [
      ...new Set(students.map((s) => s.scholarship).filter(Boolean)),
    ].sort();
    return ["ทั้งหมด", ...unique];
  }, [students]);

  const filtered = useMemo(() => {
    const matchField = (s, q) => {
      const telQ = q.replace(/-/g, "");
      const str = (v) => (v || "").toLowerCase();
      const enrollmentMatch = (s.enrollments ?? []).some(
        (e) =>
          str(e.university).includes(q) ||
          str(e.faculty).includes(q) ||
          str(e.department).includes(q) ||
          str(e.major).includes(q) ||
          str(e.year).includes(q) ||
          str(e.advisor).includes(q) ||
          str(e.project).includes(q) ||
          str(e.studentId).includes(q) ||
          str(e.univEmail).includes(q),
      );
      const addressMatch =
        str(s.addresses?.th?.houseNo).includes(q) ||
        str(s.addresses?.th?.subdistrict).includes(q) ||
        str(s.addresses?.th?.district).includes(q) ||
        str(s.addresses?.th?.province).includes(q) ||
        str(s.addresses?.th?.postalCode).includes(q) ||
        str(s.addresses?.jp?.postalCode).includes(q) ||
        str(s.addresses?.jp?.prefecture).includes(q) ||
        str(s.addresses?.jp?.city).includes(q) ||
        str(s.addresses?.jp?.streetAddress).includes(q) ||
        str(s.addresses?.jp?.building).includes(q);
      return (
        str(s.prefix).includes(q) ||
        str(s.prefixEn).includes(q) ||
        str(s.name).includes(q) ||
        str(s.nameEn).includes(q) ||
        str(s.lastname).includes(q) ||
        str(s.lastnameEn).includes(q) ||
        str(s.nickname).includes(q) ||
        str(s.university).includes(q) ||
        str(s.faculty).includes(q) ||
        str(s.department).includes(q) ||
        str(s.major).includes(q) ||
        str(s.status).includes(q) ||
        str(s.year).includes(q) ||
        str(s.lineId).includes(q) ||
        str(s.email).includes(q) ||
        str(s.advisor).includes(q) ||
        str(s.scholarship).includes(q) ||
        str(s.project).includes(q) ||
        str(s.prevSchool).includes(q) ||
        str(s.country).includes(q) ||
        str(s.address).includes(q) ||
        str(s.nationalId).replace(/-/g, "").includes(q.replace(/-/g, "")) ||
        str(s.passport).includes(q) ||
        str(s.tel).replace(/-/g, "").includes(telQ) ||
        enrollmentMatch ||
        addressMatch
      );
    };
    const base = students.filter((s) => {
      const matchKeywords =
        keywords.length === 0 ||
        keywords.every((kw) => matchField(s, kw.toLowerCase()));
      const matchLive =
        !searchInput.trim() || matchField(s, searchInput.trim().toLowerCase());
      const matchStatus =
        filterStatus === "ทั้งหมด" || s.status === filterStatus;
      const matchUniversity =
        filterUniversity === "ทั้งหมด" ||
        getLatestEnrollment(s).university === filterUniversity;
      const matchYear =
        filterYear === "ทั้งหมด" || getLatestEnrollment(s).year === filterYear;
      const matchScholarship =
        filterScholarship === "ทั้งหมด" || s.scholarship === filterScholarship;
      const matchSelfFunded = !filterSelfFunded || s.selfFunded === true;
      const studentCountry = s.country === "ญี่ปุ่น" ? "ญี่ปุ่น" : "ไทย";
      const matchCountry =
        filterCountry === "ทั้งหมด" || studentCountry === filterCountry;
      return (
        matchKeywords &&
        matchLive &&
        matchStatus &&
        matchUniversity &&
        matchYear &&
        matchScholarship &&
        matchSelfFunded &&
        matchCountry
      );
    });
    if (sortBy === "newest")
      return [...base].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (sortBy === "oldest")
      return [...base].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    if (sortBy === "updated")
      return [...base].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    if (sortBy === "th_az")
      return [...base].sort((a, b) =>
        (a.name + a.lastname).localeCompare(b.name + b.lastname, "th"),
      );
    if (sortBy === "th_za")
      return [...base].sort((a, b) =>
        (b.name + b.lastname).localeCompare(a.name + a.lastname, "th"),
      );
    if (sortBy === "en_az")
      return [...base].sort((a, b) =>
        ((a.nameEn || "") + (a.lastnameEn || "")).localeCompare(
          (b.nameEn || "") + (b.lastnameEn || ""),
          "en",
        ),
      );
    if (sortBy === "en_za")
      return [...base].sort((a, b) =>
        ((b.nameEn || "") + (b.lastnameEn || "")).localeCompare(
          (a.nameEn || "") + (a.lastnameEn || ""),
          "en",
        ),
      );
    return base;
  }, [
    students,
    keywords,
    searchInput,
    filterStatus,
    filterUniversity,
    filterYear,
    filterScholarship,
    filterSelfFunded,
    filterCountry,
    sortBy,
  ]);

  const clearFilters = () => {
    setKeywords([]);
    setSearchInput("");
    setFilterStatus("ทั้งหมด");
    setFilterUniversity("ทั้งหมด");
    setFilterYear("ทั้งหมด");
    setFilterScholarship("ทั้งหมด");
    setFilterSelfFunded(false);
    setFilterCountry("ทั้งหมด");
    setSortBy("default");
    setPage(1);
  };

  const hasActiveFilter =
    keywords.length > 0 ||
    filterStatus !== "ทั้งหมด" ||
    filterUniversity !== "ทั้งหมด" ||
    filterYear !== "ทั้งหมด" ||
    filterScholarship !== "ทั้งหมด" ||
    filterSelfFunded ||
    filterCountry !== "ทั้งหมด" ||
    sortBy !== "default";

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );
  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd = Math.min(safePage * pageSize, filtered.length);

  const pageIds = paginated.map((s) => s.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const somePageSelected = pageIds.some((id) => selectedIds.has(id)) && !allPageSelected;

  const toggleSelectPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const selectedStudents = students.filter((s) => selectedIds.has(s.id));

  const statusSummary = useMemo(
    () => [
      { label: "ทั้งหมด", count: students.length, cfg: { color: "bg-surface-muted border-border text-foreground", dot: "bg-gray-400" } },
      ...Object.keys(STATUS_CONFIG).map((s) => ({
        label: s,
        count: students.filter((st) => st.status === s).length,
        cfg: STATUS_CONFIG[s],
      })),
    ],
    [students],
  );

  const handleImport = async (rows, mode) => {
    const studentObjects = rows.map(rowToStudent);
    // reload ข้อมูลล่าสุดจาก DB ก่อนเพื่อให้ diff และ match ถูกต้อง
    const freshStudents = await refetch();
    let result;

    if (mode === "replace") {
      const errors = await replaceAll(studentObjects);
      result = { count: studentObjects.length - errors.length, mode: "replace", errors };
    } else {
      // จับคู่ด้วย nationalId ก่อน (primary) → ถ้าไม่เจอค่อยใช้ id (fallback)
      // normalize: ลบขีด (-) ออกก่อนเปรียบเทียบ เพราะ DB เก็บแบบมีขีด แต่ CSV อาจไม่มี
      const stripDashes = (v) => String(v ?? "").replace(/-/g, "").trim();
      const byNationalId = Object.fromEntries(
        freshStudents.filter((s) => s.nationalId).map((s) => [stripDashes(s.nationalId), s])
      );
      const byId = Object.fromEntries(freshStudents.map((s) => [s.id, s]));

      // หา sequence สูงสุดจาก id ที่มีรูปแบบ STU-NNN เพื่อ auto-generate id ใหม่
      const STU_RE = /^STU-(\d+)$/i;
      let nextSeq = freshStudents.reduce((max, s) => {
        const m = s.id?.match(STU_RE);
        return m ? Math.max(max, parseInt(m[1], 10)) : max;
      }, 0);
      const nextId = () => `STU-${String(++nextSeq).padStart(3, "0")}`;

      let added = 0, updated = 0;
      const errors = [];
      for (const stu of studentObjects) {
        try {
          const matched = byNationalId[stripDashes(stu.nationalId)] ?? (stu.id ? byId[stu.id] : null);
          if (matched) {
            // normalize matched (flat DB) → nested addresses ให้ตรงกับ shape ของ stu (CSV)
            const normalizedMatched = {
              ...matched,
              addresses: {
                th: {
                  houseNo:     matched.addrThHouseNo     ?? "",
                  subdistrict: matched.addrThSubdistrict ?? "",
                  district:    matched.addrThDistrict    ?? "",
                  province:    matched.addrThProvince    ?? "",
                  postalCode:  matched.addrThPostalCode  ?? "",
                },
                jp: {
                  postalCode:    matched.addrJpPostalCode    ?? "",
                  prefecture:    matched.addrJpPrefecture    ?? "",
                  city:          matched.addrJpCity          ?? "",
                  streetAddress: matched.addrJpStreetAddress ?? "",
                  building:      matched.addrJpBuilding      ?? "",
                },
              },
            };
            // merge CSV กับ DB: ถ้า field ใน CSV ว่าง ให้คงค่าเดิมจาก DB ไว้ (ไม่ทับด้วย null)
            const mergedStu = Object.fromEntries(
              Object.entries(stu).map(([k, v]) => {
                const isEmpty = v === "" || v === null || v === undefined;
                return [k, isEmpty ? (matched[k] ?? v) : v];
              })
            );
            // addresses nested ต้อง merge ทีละ field
            mergedStu.addresses = {
              th: {
                houseNo:     stu.addresses?.th?.houseNo     || matched.addrThHouseNo     || "",
                subdistrict: stu.addresses?.th?.subdistrict || matched.addrThSubdistrict || "",
                district:    stu.addresses?.th?.district    || matched.addrThDistrict    || "",
                province:    stu.addresses?.th?.province    || matched.addrThProvince    || "",
                postalCode:  stu.addresses?.th?.postalCode  || matched.addrThPostalCode  || "",
              },
              jp: {
                postalCode:    stu.addresses?.jp?.postalCode    || matched.addrJpPostalCode    || "",
                prefecture:    stu.addresses?.jp?.prefecture    || matched.addrJpPrefecture    || "",
                city:          stu.addresses?.jp?.city          || matched.addrJpCity          || "",
                streetAddress: stu.addresses?.jp?.streetAddress || matched.addrJpStreetAddress || "",
                building:      stu.addresses?.jp?.building      || matched.addrJpBuilding      || "",
              },
            };
            // update โดยใช้ id จาก DB เสมอ ไม่ใช้จาก CSV
            await updateStudent(matched.id, { ...mergedStu, id: matched.id });
            const changes = diffSnapshot(normalizedMatched, mergedStu);
            if (changes.length > 0) {
              addEvent({
                studentId: matched.id,
                type: "update",
                before: normalizedMatched,
                after: mergedStu,
                changes,
                summary: `[Import CSV] ${buildSummary("update", changes)}`,
              });
            }
            updated++;
          } else {
            // add ใหม่ — auto-generate id ถ้าไม่มีใน CSV
            const newId = stu.id?.trim() || nextId();
            const newStu = { ...stu, id: newId };
            await addStudent(newStu);
            addEvent({
              studentId: newId,
              type: "create",
              before: null,
              after: newStu,
              changes: [],
              summary: "[Import CSV] สร้างข้อมูลนักเรียนใหม่",
            });
            added++;
          }
        } catch (err) {
          errors.push({ id: stu.nationalId ?? stu.id, message: err.message });
        }
      }
      result = { added, updated, mode: "merge", errors };
    }

    setImportDone(result);
    setPage(1);
    setTimeout(() => setImportDone(null), result.errors.length > 0 ? 15000 : 4000);
  };

  const activeTerms = useMemo(
    () => [...keywords, searchInput.trim()].filter(Boolean),
    [keywords, searchInput],
  );

  if (!ready) {
    return (
      <div className="flex items-center justify-center py-24 text-muted text-sm">
        กำลังโหลดข้อมูล...
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onConfirm={handleImport}
          existingStudents={students}
        />
      )}
      {importDone && (
        <div
          className={`space-y-2 rounded-xl border px-4 py-3 text-sm ${
            importDone.errors.length > 0
              ? "border-amber-200 bg-amber-50 text-amber-800"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          <div className="flex items-center gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              {importDone.errors.length > 0 ? (
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l6.28 11.166c.75 1.334-.213 2.985-1.742 2.985H3.72c-1.53 0-2.493-1.65-1.743-2.985L8.257 3.1zM11 14a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V7a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              ) : (
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              )}
            </svg>
            <span>
              {importDone.mode === "replace"
                ? `นำเข้าสำเร็จ ${importDone.count} รายการ`
                : `รวมข้อมูลสำเร็จ — เพิ่มใหม่ ${importDone.added} รายการ, อัปเดต ${importDone.updated} รายการ`}
              {importDone.errors.length > 0 && ` — ล้มเหลว ${importDone.errors.length} รายการ`}
            </span>
          </div>
          {importDone.errors.length > 0 && (
            <ul className="ml-8 list-disc space-y-0.5 text-xs">
              {importDone.errors.map((e, i) => (
                <li key={i}>
                  <span className="font-mono font-semibold">{e.id}</span>: {e.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ── Status pills ── */}
      <div className="flex flex-wrap gap-2">
        {statusSummary.map(({ label, count, cfg }) => (
          <button
            key={label}
            onClick={() => { setFilterStatus(label); setPage(1); }}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold transition-all ${
              filterStatus === label
                ? cfg.color + " ring-2 ring-offset-1 ring-current"
                : "border-border bg-surface text-muted hover:border-primary hover:text-primary"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
            {label}
            <span className="rounded-full bg-black/10 px-1.5 py-0.5 text-[10px] font-bold">
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Search + Filters + Add ── */}
      <div className="flex flex-col gap-3">
        {/* Row 1: Search + Actions */}
        <div className="flex items-center gap-2">
          <div className="relative w-80 shrink-0">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clipRule="evenodd"
              />
            </svg>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addKeyword(searchInput);
                }
              }}
              placeholder="ชื่อ นามสกุล ชื่อเล่น มหาวิทยาลัย สาขา… (Enter เพื่อล็อก)"
              className="w-full rounded-lg border border-border bg-surface pl-9 pr-4 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-accent-soft"
            />
          </div>
          <button
            onClick={() => addKeyword(searchInput)}
            disabled={!searchInput.trim()}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clipRule="evenodd"
              />
            </svg>
            ค้นหา
          </button>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            {/* Export dropdown */}
            <div className="relative" ref={exportMenuRef}>
              <button
                onClick={() => setShowExportMenu((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:border-primary hover:text-primary transition-colors whitespace-nowrap"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                ส่งออก CSV
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-muted" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              {showExportMenu && (
                <div className="absolute right-0 top-full z-20 mt-1 w-56 rounded-xl border border-border bg-surface shadow-lg overflow-hidden">
                  {selectedIds.size > 0 && (
                    <button
                      onClick={() => { exportCSV(selectedStudents); setShowExportMenu(false); }}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-accent-soft transition-colors"
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded bg-primary text-[10px] font-bold text-white">{selectedIds.size}</span>
                      ที่เลือก ({selectedIds.size} รายการ)
                    </button>
                  )}
                  <button
                    onClick={() => { exportCSV(filtered); setShowExportMenu(false); }}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-accent-soft transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-muted shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.553.894l-4 2A1 1 0 016 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                    </svg>
                    ผลการกรอง ({filtered.length} รายการ)
                  </button>
                  <button
                    onClick={() => { exportCSV(students); setShowExportMenu(false); }}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-accent-soft transition-colors border-t border-border"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-muted shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                    </svg>
                    ทั้งหมด ({students.length} รายการ)
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={() => setShowImport(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:border-primary hover:text-primary transition-colors whitespace-nowrap"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
              นำเข้า CSV
            </button>
            <Link
              href="/admin/students/new"
              className="btn-primary whitespace-nowrap"
            >
              + เพิ่มนักเรียน
            </Link>
          </div>
        </div>

        {/* Row 2: Filter dropdowns + Sort */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col gap-0.5">
            <label className={labelCls}>สถานะ</label>
            <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }} className={selectCls}>
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>{s === "ทั้งหมด" ? "🎓 สถานะทั้งหมด" : s}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-0.5">
            <label className={labelCls}>ชั้นปี</label>
            <select value={filterYear} onChange={(e) => { setFilterYear(e.target.value); setPage(1); }} className={selectCls}>
              <option value="ทั้งหมด">📚 ชั้นปีทั้งหมด</option>
              {["1", "2", "3", "4", "5"].map((y) => (
                <option key={y} value={y}>ปีที่ {y}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-0.5">
            <label className={labelCls}>มหาวิทยาลัย</label>
            <select value={filterUniversity} onChange={(e) => { setFilterUniversity(e.target.value); setPage(1); }} className={selectCls}>
              {universities.map((u) => (
                <option key={u} value={u}>{u === "ทั้งหมด" ? "🏫 มหาวิทยาลัยทั้งหมด" : u}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-0.5">
            <label className={labelCls}>ทุน</label>
            <select value={filterScholarship} onChange={(e) => { setFilterScholarship(e.target.value); setPage(1); }} className={selectCls}>
              {scholarships.map((s) => (
                <option key={s} value={s}>{s === "ทั้งหมด" ? "🏆 ทุนทั้งหมด" : scholarshipLabel(s)}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-0.5">
            <label className={labelCls}>จ่ายเอง</label>
            <button
              type="button"
              onClick={() => { setFilterSelfFunded((v) => !v); setPage(1); }}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                filterSelfFunded
                  ? "border-amber-300 bg-amber-50 text-amber-700"
                  : "border-border bg-surface text-foreground hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
              }`}
            >
              💰 จ่ายเอง
            </button>
          </div>
          <div className="flex flex-col gap-0.5">
            <label className={labelCls}>ประเทศ</label>
            <select value={filterCountry} onChange={(e) => { setFilterCountry(e.target.value); setPage(1); }} className={selectCls}>
              <option value="ทั้งหมด">📍 ประเทศที่อาศัยอยู่</option>
              <option value="ไทย">🇹🇭 อาศัยอยู่ในไทย</option>
              <option value="ญี่ปุ่น">🇯🇵 อาศัยอยู่ในญี่ปุ่น</option>
            </select>
          </div>
          <div className="flex flex-col gap-0.5">
            <label className={labelCls}>เรียงลำดับ</label>
            <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(1); }} className={selectCls}>
              <option value="default">ค่าเริ่มต้น</option>
              <option value="newest">เพิ่มล่าสุดก่อน</option>
              <option value="oldest">เพิ่มเก่าสุดก่อน</option>
              <option value="updated">แก้ไขล่าสุดก่อน</option>
              <option value="th_az">ก–ฮ (ชื่อไทย)</option>
              <option value="th_za">ฮ–ก (ชื่อไทย)</option>
              <option value="en_az">A–Z (English name)</option>
              <option value="en_za">Z–A (English name)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Active filter chips ── */}
      {hasActiveFilter && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted">กรองด้วย:</span>
          {filterStatus !== "ทั้งหมด" && (
            <button onClick={() => { setFilterStatus("ทั้งหมด"); setPage(1); }} className={chipBase}>
              🎓 {filterStatus}<XIcon />
            </button>
          )}
          {filterUniversity !== "ทั้งหมด" && (
            <button onClick={() => { setFilterUniversity("ทั้งหมด"); setPage(1); }} className={chipBase}>
              🏫 {filterUniversity}<XIcon />
            </button>
          )}
          {filterYear !== "ทั้งหมด" && (
            <button onClick={() => { setFilterYear("ทั้งหมด"); setPage(1); }} className={chipBase}>
              📚 ปีที่ {filterYear}<XIcon />
            </button>
          )}
          {filterScholarship !== "ทั้งหมด" && (
            <button onClick={() => { setFilterScholarship("ทั้งหมด"); setPage(1); }} className={chipBase}>
              🏆 {scholarshipLabel(filterScholarship)}<XIcon />
            </button>
          )}
          {filterSelfFunded && (
            <button
              onClick={() => { setFilterSelfFunded(false); setPage(1); }}
              className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 hover:border-red-400 hover:bg-red-50 hover:text-red-500 transition-colors"
            >
              💰 จ่ายเอง<XIcon />
            </button>
          )}
          {filterCountry !== "ทั้งหมด" && (
            <button onClick={() => { setFilterCountry("ทั้งหมด"); setPage(1); }} className={chipBase}>
              {filterCountry === "ญี่ปุ่น" ? "🇯🇵 อาศัยอยู่ในญี่ปุ่น" : "🇹🇭 อาศัยอยู่ในไทย"}<XIcon />
            </button>
          )}
          {sortBy !== "default" && (
            <button onClick={() => { setSortBy("default"); setPage(1); }} className={chipBase}>
              ⇅ {{ newest: "เพิ่มล่าสุด", oldest: "เพิ่มเก่าสุด", updated: "แก้ไขล่าสุด", th_az: "ก–ฮ", th_za: "ฮ–ก", en_az: "A–Z", en_za: "Z–A" }[sortBy]}<XIcon />
            </button>
          )}
          {keywords.map((kw) => (
            <button key={kw} onClick={() => removeKeyword(kw)} className={chipBase}>
              🔍 &ldquo;{kw}&rdquo;<XIcon />
            </button>
          ))}
          <button
            onClick={clearFilters}
            className="text-xs font-medium text-muted hover:text-red-500 transition-colors underline underline-offset-2 ml-1"
          >
            ล้างทั้งหมด
          </button>
        </div>
      )}

      {/* ── Selection bar ── */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-accent-soft px-4 py-2.5">
          <span className="text-sm font-medium text-primary">เลือกแล้ว {selectedIds.size} รายการ</span>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => { exportCSV(selectedStudents); }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              ส่งออกที่เลือก
            </button>
            <button
              onClick={clearSelection}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              ยกเลิกการเลือก
            </button>
          </div>
        </div>
      )}

      {/* ── Table ── */}
      {paginated.length > 0 ? (
        <AdminTable
          onRowClick={(i) => router.push(`/admin/students/${paginated[i].id}`)}
          onCellClick={(e, i, j) => { if (j === 0) { e.stopPropagation(); toggleSelect(paginated[i].id); } }}
          columns={[
            {
              label: (
                <input
                  type="checkbox"
                  checked={allPageSelected}
                  ref={(el) => { if (el) el.indeterminate = somePageSelected; }}
                  onChange={toggleSelectPage}
                  onClick={(e) => e.stopPropagation()}
                  className="h-4 w-4 cursor-pointer rounded accent-primary"
                />
              ),
              align: "center",
              width: "44px",
            },
            { label: "ชื่อ-นามสกุล", width: "18%" },
            { label: "มหาวิทยาลัย / คณะ", width: "16%" },
            { label: "ปี / สาขา", width: "10%" },
            { label: "ทุน", align: "center", width: "130px" },
            { label: <span className="whitespace-nowrap">อาศัยอยู่ที่</span>, align: "center", width: "90px" },
            { label: "ติดต่อ", width: "15%" },
            { label: "สถานะ", align: "center", width: "110px" },
            { label: "จัดการ", align: "center", width: "115px" },
          ]}
          rows={paginated.map((s) => {
            const pe = getLatestEnrollment(s);
            return [
              <input
                key="cb"
                type="checkbox"
                checked={selectedIds.has(s.id)}
                onChange={() => toggleSelect(s.id)}
                onClick={(e) => e.stopPropagation()}
                className="h-4 w-4 cursor-pointer rounded accent-primary"
              />,
              <div key="name" className="min-w-0">
                <div className="flex items-center gap-2 flex-nowrap overflow-hidden">
                  <span
                    className="font-medium text-sm text-foreground truncate"
                    title={`${s.prefix}${s.name} ${s.lastname}`}
                  >
                    <HighlightText
                      text={`${s.prefix}${s.name} ${s.lastname}`}
                      terms={activeTerms}
                    />
                  </span>
                </div>
                {(s.nameEn || s.lastnameEn) && (
                  <p className="text-xs text-muted/80">
                    <HighlightText
                      text={`${s.prefixEn || ""} ${s.nameEn || ""} ${s.lastnameEn || ""}`.trim()}
                      terms={activeTerms}
                    />
                  </p>
                )}
                {s.nickname && (
                  <p className="text-xs text-muted">
                    ชื่อเล่น:{" "}
                    <HighlightText text={s.nickname} terms={activeTerms} />
                  </p>
                )}
                {activeTerms.length > 0 &&
                  getMatchContext(s, activeTerms).length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {getMatchContext(s, activeTerms).map(
                        ({ label, value }) => (
                          <span
                            key={label}
                            className="inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-700"
                          >
                            <span className="font-semibold">{label}:</span>
                            <HighlightText text={value} terms={activeTerms} />
                          </span>
                        ),
                      )}
                    </div>
                  )}
              </div>,
              <div key="uni" className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate" title={pe.university}>
                  <HighlightText text={pe.university} terms={activeTerms} />
                </p>
                {pe.faculty && (
                  <p className="text-xs text-muted truncate" title={pe.faculty}>
                    <HighlightText text={pe.faculty} terms={activeTerms} />
                  </p>
                )}
              </div>,
              <div key="year" className="min-w-0">
                {pe.year && (
                  <span className="inline-flex items-center justify-center rounded-full border border-border bg-surface-muted px-2.5 py-1 text-xs font-semibold text-foreground whitespace-nowrap">
                    ปี {pe.year}
                  </span>
                )}
                {pe.major && (
                  <p
                    className="mt-1 text-xs text-muted max-w-[140px] truncate"
                    title={pe.major}
                  >
                    <HighlightText text={pe.major} terms={activeTerms} />
                  </p>
                )}
              </div>,
              <div key="scholarship" className="flex flex-col items-center gap-1">
                {s.scholarship ? (
                  <span className="inline-flex items-center rounded-full bg-violet-50 border border-violet-200 px-2 py-0.5 text-[10px] font-semibold text-violet-700 whitespace-nowrap">
                    {scholarshipLabel(s.scholarship)}
                  </span>
                ) : (
                  <span className="text-muted text-xs">—</span>
                )}
                {s.selfFunded && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-semibold text-amber-700 whitespace-nowrap">
                    💰 จ่ายเอง
                  </span>
                )}
              </div>,
              <div key="country" className="text-center text-sm">
                {s.country ? (
                  <span className="whitespace-nowrap">
                    {s.country === "ญี่ปุ่น" ? "🇯🇵" : s.country === "ไทย" ? "🇹🇭" : "🌏"} {s.country}
                  </span>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </div>,
              <ContactButtons key="contact" tel={s.tel} student={s} />,
              <StatusBadge key="status" status={s.status} />,
              <div key="actions" onClick={(e) => e.stopPropagation()}>
                <StudentActionButtons
                  id={s.id}
                  name={`${s.prefix}${s.name} ${s.lastname}`}
                />
              </div>,
            ];
          })}
        />
      ) : (
        <div className="rounded-xl border border-border bg-surface py-16 text-center">
          <p className="text-2xl mb-2">🔍</p>
          <p className="text-sm font-medium text-foreground">
            ไม่พบข้อมูลนักเรียน
          </p>
          <p className="text-xs text-muted mt-1">
            ลองเปลี่ยนคำค้นหาหรือตัวกรอง
          </p>
          <button
            onClick={clearFilters}
            className="mt-4 text-sm font-medium text-primary hover:underline"
          >
            ล้างตัวกรองทั้งหมด
          </button>
        </div>
      )}

      {/* ── Pagination footer ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-xs text-muted">
          {filtered.length === 0 ? (
            "ไม่พบรายการ"
          ) : (
            <>
              แสดง{" "}
              <span className="font-semibold text-foreground">
                {rangeStart}–{rangeEnd}
              </span>{" "}
              จาก{" "}
              <span className="font-semibold text-foreground">
                {filtered.length}
              </span>{" "}
              รายการ
              {filtered.length < students.length && (
                <>
                  {" "}
                  (กรองจากทั้งหมด{" "}
                  <span className="font-semibold text-foreground">
                    {students.length}
                  </span>{" "}
                  รายการ)
                </>
              )}
            </>
          )}
        </p>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-muted">
            <span>แสดง</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="rounded-lg border border-border bg-surface px-2 py-1.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-accent-soft"
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <span>รายการต่อหน้า</span>
          </div>
          <Pagination
            page={safePage}
            totalPages={totalPages}
            onPage={setPage}
          />
        </div>
      </div>
    </div>
  );
}
