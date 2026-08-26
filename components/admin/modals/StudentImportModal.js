"use client";

import { useState, useEffect, useRef } from "react";
import {
  CSV_HEADERS,
  DATE_FIELDS,
  parseDateToISO,
  studentToFlat,
  parseCSV,
} from "@/lib/utils/studentCsv";

// ── Field label map (ภาษาไทย สำหรับแสดงผล diff) ─────────────────────────────

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

const TYPE_CFG = {
  new:       { color: "bg-emerald-100 text-emerald-700 border-emerald-200", label: "ใหม่" },
  update:    { color: "bg-blue-100 text-blue-700 border-blue-200",          label: "อัปเดต" },
  unchanged: { color: "bg-gray-100 text-gray-500 border-gray-200",          label: "ไม่เปลี่ยน" },
};

// ── Private helpers ──────────────────────────────────────────────

function normalizeVal(k, v) {
  const s = String(v ?? "").trim();
  if (!s) return s;
  return DATE_FIELDS.has(k) ? parseDateToISO(s) : s;
}

function computeDiff(incoming, existing) {
  const stripDashes = (v) => String(v ?? "").replace(/-/g, "").trim();
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
    }).map((k) => ({
      field: k,
      label: FIELD_LABEL_MAP[k] ?? k,
      before: prevFlat[k] ?? "",
      after: row[k] ?? "",
    }));
    return { type: changes.length > 0 ? "update" : "unchanged", row, changes };
  });
  const deleted = (existing ?? []).filter(
    (s) => !incomingNationalIds.has(stripDashes(s.nationalId))
  );
  return { results, deleted };
}

// ── Component ────────────────────────────────────────────────────

/**
 * StudentImportModal — modal นำเข้าข้อมูลนักเรียนจาก CSV
 *
 * @param {() => void}   onClose           — ปิด modal
 * @param {(rows, mode) => void} onConfirm — ยืนยันนำเข้า
 * @param {object[]}     existingStudents   — รายชื่อนักเรียนที่มีอยู่ (สำหรับ diff)
 */
export default function StudentImportModal({ onClose, onConfirm, existingStudents }) {
  const [step, setStep] = useState("upload");
  const [parsed, setParsed] = useState(null);
  const [mode, setMode] = useState("merge");
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(new Set());
  const fileRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

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

  const toggleExpand = (id) => setExpanded((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const diff = parsed ? computeDiff(parsed.rows, existingStudents) : null;
  const counts = diff ? {
    new: diff.results.filter((r) => r.type === "new").length,
    update: diff.results.filter((r) => r.type === "update").length,
    unchanged: diff.results.filter((r) => r.type === "unchanged").length,
    deleted: mode === "replace" ? diff.deleted.length : 0,
  } : null;

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

        {/* Body */}
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
                <button
                  onClick={() => { setStep("upload"); setParsed(null); setExpanded(new Set()); }}
                  className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors"
                >
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
                        <p key={s.id} className="text-xs text-red-700">
                          {s.prefix}{s.name} {s.lastname}
                          <span className="font-mono text-red-400 ml-1">{s.id}</span>
                        </p>
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
