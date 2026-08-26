/**
 * studentCsv.js — CSV import/export utilities สำหรับ Student module
 *
 * Export ทุก helper ที่ StudentListClient และ StudentImportModal ใช้ร่วมกัน
 */
import { formatThaiNationalId } from "@/lib/utils/inputFilters";

// ── Constants ───────────────────────────────────────────────────

export const DATE_FIELDS = new Set(["dob", "departureDateTH", "arrivalDateJP"]);

export const CSV_HEADERS = [
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

// ── Date helpers ────────────────────────────────────────────────

/** Convert common date formats → YYYY-MM-DD (timezone-safe — ไม่ใช้ new Date()) */
export function parseDateToISO(v) {
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

// ── CSV format helpers ──────────────────────────────────────────

/** Quote a value for CSV — escape commas, quotes, newlines */
export function toCSVField(val) {
  const s = String(val ?? "");
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

/** Flatten a nested student object to a plain object keyed by CSV_HEADERS names */
export function studentToFlat(s) {
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

/** Convert a student object to one CSV row (array of string values) */
export function studentToRow(s, index) {
  const flat = studentToFlat(s);
  return CSV_HEADERS.map((k) => k === "no." ? String(index + 1) : toCSVField(flat[k]));
}

/** Reconstruct a nested student object from a flat CSV row */
export function rowToStudent(row) {
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

/** Trigger browser download of students as CSV */
export function exportCSV(students) {
  const rows = [CSV_HEADERS.join(","), ...students.map((s, i) => studentToRow(s, i).join(","))];
  const blob = new Blob(["﻿" + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `students_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── CSV parser ──────────────────────────────────────────────────

/** Parse one line of CSV respecting quoted fields */
export function parseCSVLine(line) {
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

/**
 * Parse a full CSV string
 * @returns {{ rows: object[], headers: string[] } | { error: string }}
 */
export function parseCSV(text) {
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
