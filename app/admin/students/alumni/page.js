"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminTopBar from "@/components/admin/ui/AdminTopBar";
import { SCHOLARSHIP_STATUS_COLOR, calcDisplayedYears } from "@/lib/data/alumniData";
import { useAlumni } from "@/components/admin/contexts/AlumniContext";

// ── CSV ──────────────────────────────────────────────────────────────────────

const CSV_HEADERS = [
  "id", "studentId", "prefix", "name", "lastname", "nickname",
  "graduatedYear", "major", "university",
  "scholarshipYears", "scholarshipStatus",
  "contact", "phone", "remark",
  // current job — exported only, not restored on import (employmentHistory is excluded from CSV)
  "currentCompany", "currentPosition", "currentStart", "currentLocation", "currentType",
];

const IMPORT_HEADERS = [
  "id", "studentId", "prefix", "name", "lastname", "nickname",
  "graduatedYear", "major", "university",
  "scholarshipYears", "scholarshipStatus",
  "contact", "phone", "remark",
];

const FIELD_LABEL = {
  id: "รหัส", studentId: "รหัสนักเรียน", prefix: "คำนำหน้า", name: "ชื่อ",
  lastname: "นามสกุล", nickname: "ชื่อเล่น", graduatedYear: "ปีที่จบ",
  major: "สาขา", university: "มหาวิทยาลัย", scholarshipYears: "ปีทุน",
  scholarshipStatus: "สถานะทุน", contact: "อีเมล", phone: "โทรศัพท์", remark: "หมายเหตุ",
  currentCompany: "ที่ทำงานปัจจุบัน", currentPosition: "ตำแหน่ง", currentStart: "เริ่มงาน",
  currentLocation: "สถานที่", currentType: "ประเภทสัญญา",
};

function toCSVField(val) {
  const s = String(val ?? "");
  return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
}

function alumniToRow(a) {
  const current = (a.employmentHistory ?? []).find((e) => !e.endDate);
  return CSV_HEADERS.map((k) => {
    if (k === "currentCompany")  return toCSVField(current?.company ?? "");
    if (k === "currentPosition") return toCSVField(current?.position ?? "");
    if (k === "currentStart")    return toCSVField(current?.startDate ?? "");
    if (k === "currentLocation") return toCSVField(current?.location ?? "");
    if (k === "currentType")     return toCSVField(current?.type ?? "");
    return toCSVField(a[k]);
  });
}

function exportCSV(list, filename) {
  const rows = [CSV_HEADERS.join(","), ...list.map((a) => alumniToRow(a).join(","))];
  const blob = new Blob(["﻿" + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function parseCSVLine(line) {
  const values = []; let cur = ""; let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { if (inQ && line[i + 1] === '"') { cur += '"'; i++; } else inQ = !inQ; }
    else if (ch === "," && !inQ) { values.push(cur); cur = ""; }
    else cur += ch;
  }
  values.push(cur); return values;
}

function parseCSV(text) {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter((l) => l.trim());
  if (lines.length < 2) return { error: "ไฟล์ว่างหรือไม่มีข้อมูล" };
  const headers = parseCSVLine(lines[0]).map((h) => h.trim());
  const missing = ["id", "name", "lastname"].filter((r) => !headers.includes(r));
  if (missing.length) return { error: `ไม่พบคอลัมน์ที่จำเป็น: ${missing.join(", ")}` };
  const rows = lines.slice(1).map((line) => {
    const vals = parseCSVLine(line);
    const obj = {}; headers.forEach((h, i) => { obj[h] = vals[i] ?? ""; }); return obj;
  }).filter((r) => r.id?.trim() && r.name?.trim());
  if (!rows.length) return { error: "ไม่พบข้อมูลที่ถูกต้องในไฟล์" };
  return { rows, headers };
}

function computeDiff(incoming, existing) {
  const existingMap = Object.fromEntries((existing ?? []).map((a) => [a.id, a]));
  const incomingIds = new Set(incoming.map((r) => r.id));
  const results = incoming.map((row) => {
    const prev = existingMap[row.id];
    if (!prev) return { type: "new", row, changes: [] };
    const changes = IMPORT_HEADERS.filter((k) => {
      return String(prev[k] ?? "") !== String(row[k] ?? "");
    }).map((k) => ({ field: k, label: FIELD_LABEL[k] ?? k, before: prev[k] ?? "", after: row[k] ?? "" }));
    return { type: changes.length > 0 ? "update" : "unchanged", row, changes };
  });
  const deleted = (existing ?? []).filter((a) => !incomingIds.has(a.id));
  return { results, deleted };
}

// ── Import Modal ─────────────────────────────────────────────────────────────

const TYPE_CFG = {
  new:       { pill: "bg-emerald-100 text-emerald-700 border-emerald-200", label: "ใหม่" },
  update:    { pill: "bg-blue-100 text-blue-700 border-blue-200",          label: "อัปเดต" },
  unchanged: { pill: "bg-gray-100 text-gray-500 border-gray-200",          label: "ไม่เปลี่ยน" },
};

function ImportModal({ existingAlumni, onClose, onConfirm }) {
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
      setParsed(result); setError(""); setStep("preview");
    };
    reader.readAsText(file, "UTF-8");
  };

  const diff = parsed ? computeDiff(parsed.rows, existingAlumni) : null;
  const counts = diff ? {
    new: diff.results.filter((r) => r.type === "new").length,
    update: diff.results.filter((r) => r.type === "update").length,
    unchanged: diff.results.filter((r) => r.type === "unchanged").length,
    deleted: mode === "replace" ? diff.deleted.length : 0,
  } : null;

  const toggleExpand = (id) => setExpanded((prev) => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next;
  });

  const handleConfirm = () => {
    // merge existing employment history when updating
    if (mode === "merge") {
      const existingMap = Object.fromEntries(existingAlumni.map((a) => [a.id, a]));
      const merged = parsed.rows.map((row) => {
        const prev = existingMap[row.id];
        return { ...(prev ?? {}), ...row, employmentHistory: prev?.employmentHistory ?? [] };
      });
      onConfirm(merged, "merge");
    } else {
      onConfirm(parsed.rows.map((row) => ({ ...row, employmentHistory: [] })), "replace");
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
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
              <p className="text-sm font-semibold text-foreground">นำเข้าข้อมูลศิษย์เก่า</p>
              <p className="text-xs text-muted">{step === "upload" ? "เลือกไฟล์ CSV ที่ต้องการนำเข้า" : `พบข้อมูล ${parsed?.rows.length} รายการ`}</p>
            </div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-surface-muted transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5">
          {step === "upload" ? (
            <div className="space-y-4">
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
              <div className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border py-10 hover:border-primary hover:bg-accent-soft/30 transition-colors"
                onClick={() => fileRef.current?.click()}
                onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
                onDragOver={(e) => e.preventDefault()}>
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
                <p className="font-mono leading-relaxed">{IMPORT_HEADERS.join(", ")}</p>
                <p className="mt-1">คอลัมน์บังคับ: <span className="font-semibold text-foreground">id, name, lastname</span></p>
                <p className="mt-1 text-amber-600">หมายเหตุ: ประวัติการทำงาน (employmentHistory) ไม่รวมอยู่ใน CSV</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button onClick={() => { setStep("upload"); setParsed(null); setExpanded(new Set()); }}
                  className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors">
                  เลือกไฟล์ใหม่
                </button>
              </div>
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
              {counts && (
                <div className="flex flex-wrap gap-2">
                  {counts.new > 0 && <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">+{counts.new} ใหม่</span>}
                  {counts.update > 0 && <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">✎ {counts.update} อัปเดต</span>}
                  {counts.unchanged > 0 && <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-500">= {counts.unchanged} ไม่เปลี่ยน</span>}
                  {counts.deleted > 0 && <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">−{counts.deleted} ลบออก</span>}
                </div>
              )}
              <div className="space-y-2">
                {diff?.results.map(({ type, row, changes }) => {
                  const cfg = TYPE_CFG[type];
                  const isOpen = expanded.has(row.id);
                  const hasDetail = type === "new" || type === "update";
                  return (
                    <div key={row.id} className="rounded-xl border border-border overflow-hidden">
                      <button type="button" onClick={() => hasDetail && toggleExpand(row.id)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left ${hasDetail ? "hover:bg-surface-muted/50 cursor-pointer" : "cursor-default"}`}>
                        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${cfg.pill}`}>{cfg.label}</span>
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
                            {IMPORT_HEADERS.filter((k) => row[k]).map((k) => (
                              <div key={k} className="text-xs">
                                <span className="text-muted">{FIELD_LABEL[k]}: </span>
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
                      {diff.deleted.map((a) => (
                        <p key={a.id} className="text-xs text-red-700">{a.prefix}{a.name} {a.lastname} <span className="font-mono text-red-400 ml-1">{a.id}</span></p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {step === "preview" && (
          <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4 shrink-0">
            <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors">ยกเลิก</button>
            <button onClick={handleConfirm} className="btn-primary">
              {mode === "replace" ? `แทนที่ด้วย ${parsed.rows.length} รายการ` : `รวม ${parsed.rows.length} รายการ`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function DeleteModal({ alumni, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm rounded-2xl border border-border bg-surface shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col items-center px-6 pt-8 pb-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-foreground">ยืนยันการลบข้อมูล</h2>
          <p className="mt-2 text-sm text-muted">คุณต้องการลบข้อมูลของ</p>
          <p className="mt-1 font-semibold text-foreground">{alumni.prefix}{alumni.name} {alumni.lastname}</p>
          <p className="text-xs text-muted">รหัส {alumni.id}</p>
          <div className="mt-3 w-full rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-600">
            ⚠️ การดำเนินการนี้ไม่สามารถย้อนกลับได้
          </div>
        </div>
        <div className="flex gap-3 border-t border-border px-6 py-4">
          <button onClick={onCancel} className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-surface-muted transition-colors">
            ยกเลิก
          </button>
          <button onClick={onConfirm} className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 transition-colors">
            ลบข้อมูล
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color }) {
  return (
    <div className={`rounded-xl border-l-4 ${color} bg-surface px-5 py-4`}>
      <p className="text-2xl font-extrabold text-foreground">{value}</p>
      <p className="text-sm font-semibold text-foreground">{label}</p>
      {sub && <p className="text-xs text-muted mt-0.5">{sub}</p>}
    </div>
  );
}

const STATUSES = ["ทั้งหมด", "กำลังทำงาน", "ครบตามสัญญา", "ได้รับยกเว้น"];

const CLOSE_SVG = (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);

function matchField(a, q) {
  const s = (v) => (v || "").toString().toLowerCase();
  const jobMatch = (a.employmentHistory ?? []).some(
    (j) => s(j.company).includes(q) || s(j.position).includes(q) || s(j.location).includes(q)
  );
  return (
    s(a.id).includes(q) ||
    s(a.prefix).includes(q) ||
    s(a.name).includes(q) ||
    s(a.lastname).includes(q) ||
    (s(a.prefix) + s(a.name) + " " + s(a.lastname)).includes(q) ||
    s(a.major).includes(q) ||
    s(a.university).includes(q) ||
    s(a.graduatedYear).includes(q) ||
    s(a.scholarshipStatus).includes(q) ||
    s(a.contact).includes(q) ||
    s(a.phone).replace(/-/g, "").includes(q.replace(/-/g, "")) ||
    jobMatch
  );
}

export default function AlumniPage() {
  const { alumni: ALUMNI, ready, deleteAlumni, addAlumni, replaceAll } = useAlumni();
  const router = useRouter();

  const UNIVERSITIES = useMemo(() => ["ทั้งหมด", ...Array.from(new Set(ALUMNI.map((a) => a.university))).sort()], [ALUMNI]);
  const YEARS = useMemo(() => ["ทั้งหมด", ...Array.from(new Set(ALUMNI.map((a) => a.graduatedYear))).sort((a, b) => b - a).map(String)], [ALUMNI]);

  const [searchInput, setSearchInput] = useState("");
  const [keywords, setKeywords] = useState([]);
  const [filterUni, setFilterUni] = useState("ทั้งหมด");
  const [filterStatus, setFilterStatus] = useState("ทั้งหมด");
  const [filterYear, setFilterYear] = useState("ทั้งหมด");
  const [sortBy, setSortBy] = useState("default");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef(null);

  useEffect(() => {
    if (!showExportMenu) return;
    const handler = (e) => { if (!exportMenuRef.current?.contains(e.target)) setShowExportMenu(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showExportMenu]);

  const addKeyword = (kw) => {
    const trimmed = kw.trim();
    if (!trimmed) return;
    setKeywords((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
    setSearchInput("");
  };

  const removeKeyword = (kw) => setKeywords((prev) => prev.filter((k) => k !== kw));

  const clearFilters = () => {
    setSearchInput("");
    setKeywords([]);
    setFilterUni("ทั้งหมด");
    setFilterStatus("ทั้งหมด");
    setFilterYear("ทั้งหมด");
    setSortBy("default");
  };

  const hasActiveFilter =
    keywords.length > 0 || searchInput.trim() ||
    filterUni !== "ทั้งหมด" || filterStatus !== "ทั้งหมด" || filterYear !== "ทั้งหมด" || sortBy !== "default";

  const filtered = useMemo(() => {
    const base = ALUMNI.filter((a) => {
      const q = searchInput.trim().toLowerCase();
      const matchLive = !q || matchField(a, q);
      const matchKeywords = keywords.length === 0 || keywords.every((kw) => matchField(a, kw.toLowerCase()));
      const matchUni = filterUni === "ทั้งหมด" || a.university === filterUni;
      const matchStatus = filterStatus === "ทั้งหมด" || a.scholarshipStatus === filterStatus;
      const matchYear = filterYear === "ทั้งหมด" || String(a.graduatedYear) === filterYear;
      return matchLive && matchKeywords && matchUni && matchStatus && matchYear;
    });
    if (sortBy === "az") return [...base].sort((a, b) => (a.name + a.lastname).localeCompare(b.name + b.lastname, "th"));
    if (sortBy === "za") return [...base].sort((a, b) => (b.name + b.lastname).localeCompare(a.name + a.lastname, "th"));
    if (sortBy === "year_asc") return [...base].sort((a, b) => a.graduatedYear - b.graduatedYear);
    if (sortBy === "year_desc") return [...base].sort((a, b) => b.graduatedYear - a.graduatedYear);
    return base;
  }, [ALUMNI, searchInput, keywords, filterUni, filterStatus, filterYear, sortBy]);

  const handleImportConfirm = (rows, mode) => {
    if (mode === "replace") {
      replaceAll(rows.map((r) => ({ employmentHistory: [], ...r })));
    } else {
      const existingIds = new Set(ALUMNI.map((a) => a.id));
      const updatedList = ALUMNI.map((a) => {
        const incoming = rows.find((r) => r.id === a.id);
        return incoming ? { ...a, ...incoming } : a;
      });
      const newOnes = rows.filter((r) => !existingIds.has(r.id)).map((r) => ({ employmentHistory: [], ...r }));
      replaceAll([...updatedList, ...newOnes]);
    }
  };

  if (!ready) return <div className="flex items-center justify-center py-24 text-muted text-sm">กำลังโหลดข้อมูล...</div>;

  const total = ALUMNI.length;
  const working = ALUMNI.filter((a) => a.scholarshipStatus === "กำลังทำงาน").length;
  const completed = ALUMNI.filter((a) => a.scholarshipStatus === "ครบตามสัญญา").length;
  const exempted = ALUMNI.filter((a) => a.scholarshipStatus === "ได้รับยกเว้น").length;

  return (
    <>
      <AdminTopBar
        title="Alumni"
        description={`ติดตามศิษย์เก่าและสถานะการทำงานตามสัญญาทุน — ทั้งหมด ${total} คน`}
      />

      <div className="space-y-6 p-6">

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="ศิษย์เก่าทั้งหมด"    value={total}     sub="คนในระบบ"                              color="border-primary" />
          <StatCard label="กำลังทำงานตามสัญญา"  value={working}   sub={`${Math.round(working/total*100)}% ของทั้งหมด`}  color="border-amber-400" />
          <StatCard label="ครบตามสัญญาแล้ว"     value={completed} sub={`${Math.round(completed/total*100)}% ของทั้งหมด`} color="border-emerald-500" />
          <StatCard label="ได้รับการยกเว้น"     value={exempted}  sub={`${Math.round(exempted/total*100)}% ของทั้งหมด`} color="border-violet-500" />
        </div>

        {/* ── Status pills ── */}
        <div className="flex flex-wrap gap-2">
          {STATUSES.filter((s) => s !== "ทั้งหมด").map((s) => {
            const cfg = SCHOLARSHIP_STATUS_COLOR[s];
            const count = ALUMNI.filter((a) => a.scholarshipStatus === s).length;
            const active = filterStatus === s;
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(active ? "ทั้งหมด" : s)}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                  active
                    ? cfg.badge + " border-current ring-2 ring-offset-1 ring-current"
                    : "border-border bg-surface text-muted hover:border-primary hover:text-primary"
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${cfg.bar}`} />
                {s}
                <span className="rounded-full bg-black/10 px-1.5 py-0.5 text-[10px] font-bold">{count}</span>
              </button>
            );
          })}
        </div>

        {/* ── Search + Filters ── */}
        <div className="flex flex-col gap-3">
          {/* Row 1: Search + ค้นหา + actions */}
          <div className="flex items-center gap-2">
            <div className="relative w-80 shrink-0">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addKeyword(searchInput); } }}
                placeholder="ชื่อ / รหัส / บริษัท แล้วกด Enter หรือค้นหา"
                className="w-full rounded-lg border border-border bg-surface pl-9 pr-4 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-accent-soft"
              />
            </div>
            <button
              onClick={() => addKeyword(searchInput)}
              disabled={!searchInput.trim()}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
              ค้นหา
            </button>

            <div className="ml-auto flex shrink-0 items-center gap-2">
              {/* Export dropdown */}
              <div className="relative" ref={exportMenuRef}>
                <button
                  onClick={() => setShowExportMenu((v) => !v)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground hover:border-primary hover:text-primary transition-colors whitespace-nowrap"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  ส่งออก CSV
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-3.5 w-3.5 transition-transform ${showExportMenu ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                {showExportMenu && (
                  <div className="absolute right-0 top-full mt-1 w-52 rounded-xl border border-border bg-surface shadow-lg z-20 overflow-hidden">
                    <button
                      onClick={() => { exportCSV(filtered, "alumni_filtered.csv"); setShowExportMenu(false); }}
                      className="w-full flex items-start gap-3 px-4 py-3 text-sm hover:bg-surface-muted transition-colors text-left"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mt-0.5 shrink-0 text-primary" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <p className="font-medium text-foreground">ข้อมูลที่กรองอยู่</p>
                        <p className="text-xs text-muted">{filtered.length} รายการ</p>
                      </div>
                    </button>
                    <div className="h-px bg-border" />
                    <button
                      onClick={() => { exportCSV(ALUMNI, "alumni_all.csv"); setShowExportMenu(false); }}
                      className="w-full flex items-start gap-3 px-4 py-3 text-sm hover:bg-surface-muted transition-colors text-left"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mt-0.5 shrink-0 text-muted" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <p className="font-medium text-foreground">ข้อมูลทั้งหมด</p>
                        <p className="text-xs text-muted">{ALUMNI.length} รายการ</p>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Import */}
              <button
                onClick={() => setShowImport(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground hover:border-primary hover:text-primary transition-colors whitespace-nowrap"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                นำเข้า CSV
              </button>

              {/* Add */}
              <Link
                href="/admin/students/alumni/new"
                className="inline-flex items-center gap-1.5 btn-primary whitespace-nowrap"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                เพิ่มศิษย์เก่า
              </Link>
            </div>
          </div>

          {/* Row 2: Filter dropdowns + Sort */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted shrink-0">กรอง:</span>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-accent-soft">
              <option value="ทั้งหมด">สถานะทั้งหมด</option>
              {STATUSES.filter((s) => s !== "ทั้งหมด").map((s) => <option key={s}>{s}</option>)}
            </select>
            <select value={filterUni} onChange={(e) => setFilterUni(e.target.value)}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-accent-soft">
              {UNIVERSITIES.map((u) => <option key={u} value={u}>{u === "ทั้งหมด" ? "มหาวิทยาลัยทั้งหมด" : u}</option>)}
            </select>
            <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-accent-soft">
              {YEARS.map((y) => <option key={y} value={y}>{y === "ทั้งหมด" ? "ปีที่จบทั้งหมด" : `จบ พ.ศ. ${y}`}</option>)}
            </select>
            <span className="h-5 w-px bg-border shrink-0" />
            <span className="text-xs font-medium text-muted shrink-0">เรียง:</span>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-accent-soft">
              <option value="default">ค่าเริ่มต้น</option>
              <option value="az">ก–ฮ (ชื่อ)</option>
              <option value="za">ฮ–ก (ชื่อ)</option>
              <option value="year_desc">ปีที่จบล่าสุด</option>
              <option value="year_asc">ปีที่จบเก่าสุด</option>
            </select>
          </div>

          {/* Active filter chips */}
          {hasActiveFilter && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-muted shrink-0">กรองด้วย:</span>
              {filterStatus !== "ทั้งหมด" && (
                <button onClick={() => setFilterStatus("ทั้งหมด")}
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-accent-soft px-3 py-1 text-xs font-medium text-primary hover:border-red-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                  {filterStatus} {CLOSE_SVG}
                </button>
              )}
              {filterUni !== "ทั้งหมด" && (
                <button onClick={() => setFilterUni("ทั้งหมด")}
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-accent-soft px-3 py-1 text-xs font-medium text-primary hover:border-red-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                  🏫 {filterUni} {CLOSE_SVG}
                </button>
              )}
              {filterYear !== "ทั้งหมด" && (
                <button onClick={() => setFilterYear("ทั้งหมด")}
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-accent-soft px-3 py-1 text-xs font-medium text-primary hover:border-red-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                  🎓 จบ พ.ศ. {filterYear} {CLOSE_SVG}
                </button>
              )}
              {sortBy !== "default" && (
                <button onClick={() => setSortBy("default")}
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-accent-soft px-3 py-1 text-xs font-medium text-primary hover:border-red-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                  ⇅ {{ az: "ก–ฮ", za: "ฮ–ก", year_desc: "ปีล่าสุด", year_asc: "ปีเก่าสุด" }[sortBy]} {CLOSE_SVG}
                </button>
              )}
              {keywords.map((kw) => (
                <button key={kw} onClick={() => removeKeyword(kw)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-accent-soft px-3 py-1 text-xs font-medium text-primary hover:border-red-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                  🔍 &ldquo;{kw}&rdquo; {CLOSE_SVG}
                </button>
              ))}
              {searchInput.trim() && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-primary/30 px-3 py-1 text-xs font-medium text-muted">
                  🔍 &ldquo;{searchInput}&rdquo;
                </span>
              )}
              <button onClick={clearFilters}
                className="text-xs font-medium text-muted hover:text-red-500 transition-colors underline underline-offset-2 ml-1">
                ล้างทั้งหมด
              </button>
            </div>
          )}
        </div>

        {/* ── Table ── */}
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-muted">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted">ชื่อ-นามสกุล</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted">สาขา</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted">มหาวิทยาลัย</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted">ปีที่จบ</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted">ติดต่อ</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted">ที่ทำงานปัจจุบัน</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted">ปีทำงาน / ปีทุน</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted">สถานะ</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="py-12 text-center text-sm text-muted">ไม่พบข้อมูลที่ตรงกับเงื่อนไข</td></tr>
              ) : filtered.map((a, i) => {
                const current = a.employmentHistory.find((e) => !e.endDate);
                const workedYears = calcDisplayedYears(a);
                const pct = Math.min(100, Math.round(workedYears / a.scholarshipYears * 100));
                return (
                  <tr key={a.id}
                    className={`border-b border-border last:border-0 hover:bg-accent-soft/30 transition-colors ${i % 2 !== 0 ? "bg-surface-muted/30" : ""}`}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-foreground whitespace-nowrap">
                        {a.prefix}{a.name} {a.lastname}
                        {a.nickname && <span className="ml-1.5 font-normal text-muted text-xs">({a.nickname})</span>}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-muted">{a.major}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{a.university}</span>
                    </td>
                    <td className="px-4 py-3 text-center text-muted">{a.graduatedYear}</td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        {a.contact && <p className="text-xs text-muted truncate max-w-[160px]">{a.contact}</p>}
                        {a.phone && <p className="text-xs text-muted">{a.phone}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {current ? (
                        <div>
                          <p className="font-medium text-foreground truncate max-w-[180px]">{current.company}</p>
                          <p className="text-xs text-muted">{current.position}</p>
                        </div>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs font-bold text-foreground">{workedYears} / {a.scholarshipYears} ปี</span>
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-muted">
                          <div className={`h-1.5 rounded-full ${SCHOLARSHIP_STATUS_COLOR[a.scholarshipStatus]?.bar}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${SCHOLARSHIP_STATUS_COLOR[a.scholarshipStatus]?.badge} border-current/20`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${SCHOLARSHIP_STATUS_COLOR[a.scholarshipStatus]?.bar}`} />
                        {a.scholarshipStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <Link
                          href={`/admin/students/alumni/${a.id}`}
                          title="ดูข้อมูล"
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted hover:border-primary hover:text-primary transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                          </svg>
                        </Link>
                        <Link
                          href={`/admin/students/alumni/${a.id}?edit=1`}
                          title="แก้ไข"
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted hover:border-amber-500 hover:text-amber-500 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </Link>
                        <button
                          onClick={() => setDeleteTarget(a)}
                          title="ลบ"
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted hover:border-red-500 hover:text-red-500 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {deleteTarget && (
        <DeleteModal
          alumni={deleteTarget}
          onConfirm={() => { deleteAlumni(deleteTarget.id); setDeleteTarget(null); }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {showImport && (
        <ImportModal
          existingAlumni={ALUMNI}
          onClose={() => setShowImport(false)}
          onConfirm={handleImportConfirm}
        />
      )}
    </>
  );
}
