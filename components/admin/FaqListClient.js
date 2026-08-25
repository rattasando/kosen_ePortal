"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useFaq } from "./contexts/FaqContext";
import { FAQ_CATEGORIES } from "@/lib/data/faqData";

const inputCls  = "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-accent-soft placeholder:text-muted";
const selectCls = "rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-accent-soft";
const labelCls  = "text-xs font-medium text-foreground";
const chipBase  = "inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-accent-soft px-2.5 py-1 text-xs font-semibold text-primary hover:border-red-400 hover:bg-red-50 hover:text-red-500 transition-colors";
const PAGE_SIZE = 20;

// ── CSV helpers ──────────────────────────────────────────────
const CSV_HEADERS = ["id", "question", "answer", "category", "status", "order"];
const CSV_LABELS  = { id: "รหัส", question: "คำถาม", answer: "คำตอบ", category: "หมวดหมู่", status: "สถานะ", order: "ลำดับ" };

function toCSVField(val) {
  const s = String(val ?? "");
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

function exportCSV(list, filename) {
  const sorted = [...list].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const rows = [CSV_HEADERS.join(","), ...sorted.map((f) => CSV_HEADERS.map((k) => toCSVField(f[k])).join(","))];
  const blob = new Blob(["﻿" + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
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
  const lines = text.replace(/^﻿/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter((l) => l.trim());
  if (lines.length < 2) return { error: "ไฟล์ว่างหรือไม่มีข้อมูล" };
  const headers = parseCSVLine(lines[0]).map((h) => h.trim());
  const missing = ["question", "answer"].filter((r) => !headers.includes(r));
  if (missing.length) return { error: `ไม่พบคอลัมน์ที่จำเป็น: ${missing.join(", ")}` };
  const rows = lines.slice(1).map((line) => {
    const vals = parseCSVLine(line);
    const obj = {}; headers.forEach((h, i) => { obj[h] = vals[i]?.trim() ?? ""; }); return obj;
  }).filter((r) => r.question?.trim() && r.answer?.trim());
  if (!rows.length) return { error: "ไม่พบข้อมูล FAQ ที่ถูกต้องในไฟล์" };
  return { rows, headers };
}

function computeDiff(incoming, existing) {
  const existingMap = Object.fromEntries((existing ?? []).map((f) => [f.id, f]));
  const incomingIds = new Set(incoming.map((r) => r.id).filter(Boolean));
  const results = incoming.map((row) => {
    if (!row.id) return { type: "new", row, changes: [] };
    const prev = existingMap[row.id];
    if (!prev) return { type: "new", row, changes: [] };
    const changes = CSV_HEADERS.filter((k) => String(prev[k] ?? "") !== String(row[k] ?? ""))
      .map((k) => ({ field: k, label: CSV_LABELS[k] ?? k, before: prev[k] ?? "", after: row[k] ?? "" }));
    return { type: changes.length ? "update" : "unchanged", row, changes };
  });
  const deleted = (existing ?? []).filter((f) => f.id && !incomingIds.has(f.id));
  return { results, deleted };
}

// ── Icons ────────────────────────────────────────────────────
const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);
const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);
const ChevronDown = ({ open }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);

// ── Status config ────────────────────────────────────────────
const STATUS_CONFIG = {
  published: { label: "เผยแพร่", pill: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  draft:     { label: "แบบร่าง", pill: "bg-amber-100 text-amber-700 border-amber-200" },
};

// ── Helpers ──────────────────────────────────────────────────
function nextId(faqs) {
  const nums = faqs.map((f) => parseInt(f.id.replace("FAQ", ""), 10)).filter(Boolean);
  return `FAQ${String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3, "0")}`;
}
function emptyForm() {
  return { question: "", answer: "", category: FAQ_CATEGORIES[0], status: "published" };
}
function HighlightText({ text = "", terms = [] }) {
  if (!terms.length) return <>{text}</>;
  const regex = new RegExp(`(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? <mark key={i} className="rounded bg-amber-200 px-0.5 text-amber-900">{part}</mark> : part
      )}
    </>
  );
}

// ── Import Modal ─────────────────────────────────────────────
const DIFF_CFG = {
  new:       { pill: "bg-emerald-100 text-emerald-700 border-emerald-200", label: "ใหม่" },
  update:    { pill: "bg-blue-100 text-blue-700 border-blue-200",          label: "อัปเดต" },
  unchanged: { pill: "bg-gray-100 text-gray-500 border-gray-200",          label: "ไม่เปลี่ยน" },
};

function ImportModal({ existingFaqs, onClose, onConfirm }) {
  const [step, setStep]         = useState("upload");
  const [parsed, setParsed]     = useState(null);
  const [mode, setMode]         = useState("merge");
  const [error, setError]       = useState("");
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

  const diff   = parsed ? computeDiff(parsed.rows, existingFaqs) : null;
  const counts = diff ? {
    new:       diff.results.filter((r) => r.type === "new").length,
    update:    diff.results.filter((r) => r.type === "update").length,
    unchanged: diff.results.filter((r) => r.type === "unchanged").length,
    deleted:   mode === "replace" ? diff.deleted.length : 0,
  } : null;

  const toggle = (id) => setExpanded((prev) => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next;
  });

  const handleConfirm = () => { onConfirm(parsed.rows, mode); onClose(); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-surface shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-border px-5 py-4 shrink-0">
          <div>
            <p className="text-sm font-semibold text-foreground">นำเข้าข้อมูล FAQ</p>
            <p className="text-xs text-muted">{step === "upload" ? "เลือกไฟล์ CSV ที่ต้องการนำเข้า" : `พบข้อมูล ${parsed?.rows.length} รายการ`}</p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-surface-muted transition-colors">
            <XIcon />
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
                  <p className="text-sm font-medium text-foreground">ลากไฟล์มาวาง หรือ <span className="text-primary underline">คลิกเพื่อเลือกไฟล์</span></p>
                  <p className="mt-1 text-xs text-muted">รองรับเฉพาะไฟล์ .csv (UTF-8)</p>
                </div>
              </div>
              {error && <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600 border border-red-200">{error}</p>}
              <div className="rounded-lg bg-surface-muted px-4 py-3 text-xs text-muted">
                <p className="font-semibold text-foreground mb-1">คอลัมน์ที่รองรับ</p>
                <p className="font-mono leading-relaxed">{CSV_HEADERS.join(", ")}</p>
                <p className="mt-1">คอลัมน์บังคับ: <span className="font-semibold text-foreground">question, answer</span></p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button onClick={() => { setStep("upload"); setParsed(null); setExpanded(new Set()); }}
                  className="text-xs text-muted hover:text-foreground transition-colors">เลือกไฟล์ใหม่</button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "merge",   label: "รวมข้อมูล",     desc: "เพิ่มใหม่ / อัปเดตที่มี ID ซ้ำ" },
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
                  {counts.new       > 0 && <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">+{counts.new} ใหม่</span>}
                  {counts.update    > 0 && <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">✎ {counts.update} อัปเดต</span>}
                  {counts.unchanged > 0 && <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-500">= {counts.unchanged} ไม่เปลี่ยน</span>}
                  {counts.deleted   > 0 && <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">−{counts.deleted} ลบออก</span>}
                </div>
              )}
              <div className="space-y-2">
                {diff?.results.map(({ type, row, changes }, i) => {
                  const cfg   = DIFF_CFG[type];
                  const rowId = row.id || `new-${i}`;
                  const isOpen = expanded.has(rowId);
                  const hasDetail = type === "new" || type === "update";
                  return (
                    <div key={rowId} className="rounded-xl border border-border overflow-hidden">
                      <button type="button" onClick={() => hasDetail && toggle(rowId)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left ${hasDetail ? "hover:bg-surface-muted/50 cursor-pointer" : "cursor-default"}`}>
                        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${cfg.pill}`}>{cfg.label}</span>
                        <span className="flex-1 text-sm font-medium text-foreground line-clamp-1">{row.question}</span>
                        <span className="text-xs text-muted shrink-0">{row.category || "—"}</span>
                        {type === "update" && <span className="text-xs text-blue-600 shrink-0">{changes.length} field เปลี่ยน</span>}
                        {hasDetail && <ChevronDown open={isOpen} />}
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
                          <p className="text-xs text-muted leading-relaxed line-clamp-3">{row.answer}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
                {mode === "replace" && diff?.deleted.length > 0 && (
                  <div className="rounded-xl border border-red-200 bg-red-50/50 overflow-hidden">
                    <div className="px-4 py-2.5 text-xs font-semibold text-red-600">จะถูกลบออก ({diff.deleted.length} รายการ)</div>
                    <div className="border-t border-red-200 px-4 py-3 space-y-1">
                      {diff.deleted.map((f) => (
                        <p key={f.id} className="text-xs text-red-700 line-clamp-1">{f.question} <span className="font-mono text-red-400 ml-1">{f.id}</span></p>
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

// ── FAQ Modal ─────────────────────────────────────────────────
function FaqModal({ item, onClose, onSave }) {
  const isEdit = !!item;
  const [form, setForm] = useState(item ? { ...item } : emptyForm());
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: "" })); };

  const handleSave = () => {
    const e = {};
    if (!form.question.trim()) e.question = "กรุณากรอกคำถาม";
    if (!form.answer.trim())   e.answer   = "กรุณากรอกคำตอบ";
    if (Object.keys(e).length) { setErrors(e); return; }
    onSave(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="flex w-full max-w-lg flex-col rounded-2xl border border-border bg-surface shadow-2xl max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-border px-5 py-4 flex-shrink-0">
          <div>
            <p className="text-sm font-semibold text-foreground">{isEdit ? "แก้ไข FAQ" : "เพิ่ม FAQ ใหม่"}</p>
            {isEdit && <p className="text-xs text-muted">รหัส {item.id}</p>}
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-surface-muted transition-colors"><XIcon /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          <div>
            <label className={`mb-1 block ${labelCls}`}>คำถาม <span className="text-red-500">*</span></label>
            <textarea value={form.question} onChange={(e) => set("question", e.target.value)}
              rows={2} placeholder="คำถามที่พบบ่อย..." className={`${inputCls} resize-none`} />
            {errors.question && <p className="mt-1 text-xs text-red-500">{errors.question}</p>}
          </div>
          <div>
            <label className={`mb-1 block ${labelCls}`}>คำตอบ <span className="text-red-500">*</span></label>
            <textarea value={form.answer} onChange={(e) => set("answer", e.target.value)}
              rows={5} placeholder="คำตอบอธิบาย..." className={`${inputCls} resize-none`} />
            {errors.answer && <p className="mt-1 text-xs text-red-500">{errors.answer}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`mb-1 block ${labelCls}`}>หมวดหมู่</label>
              <select value={form.category} onChange={(e) => set("category", e.target.value)}
                className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none w-full transition focus:border-primary focus:ring-2 focus:ring-accent-soft">
                {FAQ_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={`mb-1 block ${labelCls}`}>สถานะ</label>
              <select value={form.status} onChange={(e) => set("status", e.target.value)}
                className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none w-full transition focus:border-primary focus:ring-2 focus:ring-accent-soft">
                <option value="published">เผยแพร่</option>
                <option value="draft">แบบร่าง</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-5 py-4 flex-shrink-0">
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm text-muted hover:text-foreground transition-colors">ยกเลิก</button>
          <button onClick={handleSave} className="btn-primary">{isEdit ? "บันทึกการแก้ไข" : "เพิ่ม FAQ"}</button>
        </div>
      </div>
    </div>
  );
}

// ── Delete Confirm Modal ──────────────────────────────────────
function DeleteModal({ faq, onClose, onConfirm }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-2xl">
        <h3 className="text-base font-bold text-foreground">ยืนยันการลบ</h3>
        <p className="mt-2 text-sm text-muted leading-relaxed">
          ต้องการลบ FAQ นี้ใช่หรือไม่?
        </p>
        <p className="mt-1.5 rounded-lg bg-surface-muted px-3 py-2 text-sm font-medium text-foreground line-clamp-2">{faq.question}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors">ยกเลิก</button>
          <button onClick={() => { onConfirm(faq.id); onClose(); }} className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 transition-colors">ลบ FAQ</button>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function FaqListClient() {
  const { faqs, ready, addFaq, updateFaq, deleteFaq, reorder } = useFaq();

  const [search, setSearch]             = useState("");
  const [filterCat, setFilterCat]       = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [modal, setModal]               = useState(null);       // null | {} | { item }
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedIds, setSelectedIds]   = useState(new Set());
  const [page, setPage]                 = useState(1);
  const [showImport, setShowImport]     = useState(false);
  const [importDone, setImportDone]     = useState(null);

  const activeTerms = [search.trim()].filter(Boolean);

  // sorted + filtered list
  const filtered = useMemo(() => {
    const sorted = [...faqs].sort((a, b) => a.order - b.order);
    return sorted.filter((f) => {
      if (filterCat    && f.category !== filterCat)    return false;
      if (filterStatus && f.status   !== filterStatus) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!f.question.toLowerCase().includes(q) && !f.answer.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [faqs, search, filterCat, filterStatus]);

  const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged       = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Selection helpers
  const allPageSelected  = paged.length > 0 && paged.every((f) => selectedIds.has(f.id));
  const somePageSelected = paged.some((f) => selectedIds.has(f.id)) && !allPageSelected;

  const toggleSelect = (id) => setSelectedIds((prev) => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next;
  });
  const toggleSelectPage = () => {
    if (allPageSelected) {
      setSelectedIds((prev) => { const next = new Set(prev); paged.forEach((f) => next.delete(f.id)); return next; });
    } else {
      setSelectedIds((prev) => { const next = new Set(prev); paged.forEach((f) => next.add(f.id)); return next; });
    }
  };

  // FAQ actions
  const handleSave = (form) => {
    if (modal?.item) {
      updateFaq(modal.item.id, form);
    } else {
      const maxOrder = faqs.reduce((m, f) => Math.max(m, f.order ?? 0), 0);
      addFaq({ ...form, id: nextId(faqs), order: maxOrder + 1 });
    }
  };

  const handleToggleStatus = (faq) => {
    updateFaq(faq.id, { status: faq.status === "published" ? "draft" : "published" });
  };

  const swap = (a, b) => {
    const reordered = faqs.map((f) => {
      if (f.id === a.id) return { ...f, order: b.order };
      if (f.id === b.id) return { ...f, order: a.order };
      return f;
    });
    reorder(reordered);
  };

  const handleMoveUp = (faq) => {
    const sorted = [...faqs].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((f) => f.id === faq.id);
    if (idx <= 0) return;
    swap(faq, sorted[idx - 1]);
  };

  const handleMoveDown = (faq) => {
    const sorted = [...faqs].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((f) => f.id === faq.id);
    if (idx >= sorted.length - 1) return;
    swap(faq, sorted[idx + 1]);
  };

  const handleImport = (rows, mode) => {
    const maxOrder    = faqs.reduce((m, f) => Math.max(m, f.order ?? 0), 0);
    const existingMap = Object.fromEntries(faqs.map((f) => [f.id, f]));
    if (mode === "replace") {
      const next = rows.map((r, i) => ({
        category: FAQ_CATEGORIES[0], status: "published",
        ...r,
        id: r.id || nextId([...faqs, ...rows.slice(0, i)]),
        order: r.order ? Number(r.order) : i + 1,
      }));
      reorder(next);
      setImportDone({ count: next.length, mode: "replace" });
    } else {
      let added = 0, updated = 0;
      rows.forEach((r, i) => {
        const norm = { category: FAQ_CATEGORIES[0], status: "published", ...r, order: r.order ? Number(r.order) : maxOrder + i + 1 };
        if (r.id && existingMap[r.id]) { updateFaq(r.id, norm); updated++; }
        else { addFaq({ ...norm, id: r.id || nextId(faqs) }); added++; }
      });
      setImportDone({ added, updated, mode: "merge" });
    }
    setTimeout(() => setImportDone(null), 4000);
  };

  // Status counts — respect cat+search filters but not the status filter itself
  const statusCounts = useMemo(() => {
    const base = faqs.filter((f) => {
      if (filterCat && f.category !== filterCat) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!f.question.toLowerCase().includes(q) && !f.answer.toLowerCase().includes(q)) return false;
      }
      return true;
    });
    return {
      all:       base.length,
      published: base.filter((f) => f.status === "published").length,
      draft:     base.filter((f) => f.status === "draft").length,
    };
  }, [faqs, filterCat, search]);

  const hasFilters = !!(filterCat || filterStatus || search.trim());
  const clearAll   = () => { setFilterCat(""); setFilterStatus(""); setSearch(""); setPage(1); };

  const selectedList = faqs.filter((f) => selectedIds.has(f.id));

  if (!ready) {
    return (
      <div className="flex items-center justify-center py-24 text-sm text-muted">
        <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        กำลังโหลด...
      </div>
    );
  }

  return (
    <div className="space-y-5 p-6">

      {/* Import success banner */}
      {importDone && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span>
            {importDone.mode === "replace"
              ? `นำเข้าสำเร็จ — แทนที่ด้วยข้อมูลใหม่ทั้งหมด ${importDone.count} รายการ`
              : `รวมข้อมูลสำเร็จ — เพิ่มใหม่ ${importDone.added} รายการ, อัปเดต ${importDone.updated} รายการ`}
          </span>
        </div>
      )}

      {/* ── Status pills ── */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: "",          label: "ทั้งหมด", count: statusCounts.all,       color: "bg-surface-muted border-border text-foreground",         dot: "bg-gray-400"   },
          { key: "published", label: "เผยแพร่", count: statusCounts.published, color: "bg-emerald-100 text-emerald-700 border-emerald-200",     dot: "bg-emerald-500" },
          { key: "draft",     label: "แบบร่าง", count: statusCounts.draft,     color: "bg-amber-100 text-amber-700 border-amber-200",           dot: "bg-amber-400"  },
        ].map(({ key, label, count, color, dot }) => (
          <button key={key}
            onClick={() => { setFilterStatus(filterStatus === key ? "" : key); setPage(1); }}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold transition-all ${
              filterStatus === key
                ? `${color} ring-2 ring-offset-1 ring-current`
                : "border-border bg-surface text-muted hover:border-primary hover:text-primary"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
            {label}
            <span className="rounded-full bg-black/10 px-1.5 py-0.5 text-[10px] font-bold">{count}</span>
          </button>
        ))}
      </div>

      {/* ── Search row ── */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="ค้นหาคำถามหรือคำตอบ..."
            className={`${inputCls} pl-9`} />
        </div>
        <button onClick={() => exportCSV(faqs, `faq_${new Date().toISOString().slice(0,10)}.csv`)}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors whitespace-nowrap">
          ส่งออก CSV
        </button>
        <button onClick={() => setShowImport(true)}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors whitespace-nowrap">
          นำเข้า CSV
        </button>
        <button onClick={() => setModal({})} className="btn-primary whitespace-nowrap">+ เพิ่ม FAQ</button>
      </div>

      {/* ── Filter row ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-col gap-0.5">
          <label className={labelCls}>หมวดหมู่</label>
          <select value={filterCat} onChange={(e) => { setFilterCat(e.target.value); setPage(1); }} className={selectCls}>
            <option value="">หมวดหมู่ทั้งหมด</option>
            {FAQ_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* ── Active filter chips ── */}
      {hasFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted">กรอง:</span>
          {filterCat && (
            <button className={chipBase} onClick={() => { setFilterCat(""); setPage(1); }}>
              หมวด: {filterCat} <XIcon />
            </button>
          )}
          {filterStatus && (
            <button className={chipBase} onClick={() => { setFilterStatus(""); setPage(1); }}>
              สถานะ: {STATUS_CONFIG[filterStatus]?.label} <XIcon />
            </button>
          )}
          {search.trim() && (
            <button className={chipBase} onClick={() => { setSearch(""); setPage(1); }}>
              ค้นหา: &ldquo;{search.trim()}&rdquo; <XIcon />
            </button>
          )}
          <button onClick={clearAll} className="text-xs text-muted underline hover:text-foreground transition-colors">ล้างทั้งหมด</button>
        </div>
      )}

      {/* Selection bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-accent-soft px-4 py-2.5">
          <span className="text-sm font-semibold text-primary">เลือกแล้ว {selectedIds.size} รายการ</span>
          <div className="flex-1" />
          <button onClick={() => exportCSV(selectedList, `faq_selected_${new Date().toISOString().slice(0,10)}.csv`)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            ส่งออกที่เลือก
          </button>
          <button onClick={() => setSelectedIds(new Set())}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground transition-colors">ยกเลิก</button>
        </div>
      )}

      {/* Table */}
      {paged.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-20 text-center text-sm text-muted">
          ไม่พบ FAQ ที่ตรงกับเงื่อนไข
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm" style={{ tableLayout: "fixed" }}>
              <colgroup>
                <col style={{ width: "44px" }} />
                <col style={{ width: "72px" }} />
                <col />
                <col style={{ width: "128px" }} />
                <col style={{ width: "100px" }} />
                <col style={{ width: "120px" }} />
              </colgroup>
              <thead>
                <tr className="border-b border-border bg-surface-muted">
                  {/* Checkbox header */}
                  <th className="px-3 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={allPageSelected}
                      ref={(el) => { if (el) el.indeterminate = somePageSelected; }}
                      onChange={toggleSelectPage}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded border-border"
                    />
                  </th>
                  <th className="px-3 py-3 text-xs font-semibold text-muted text-center">ลำดับ</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted">คำถาม / คำตอบ</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted">หมวดหมู่</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted">สถานะ</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((faq, i) => {
                  const globalIdx = (currentPage - 1) * PAGE_SIZE + i;
                  const sortedAll = [...faqs].sort((a, b) => a.order - b.order);
                  const totalSorted = sortedAll.length;
                  const isFirst   = sortedAll[0]?.id === faq.id;
                  const isLast    = sortedAll[totalSorted - 1]?.id === faq.id;
                  const isSelected = selectedIds.has(faq.id);
                  const st = STATUS_CONFIG[faq.status] ?? STATUS_CONFIG.draft;

                  return (
                    <tr key={faq.id}
                      className={`border-b border-border transition-colors hover:bg-accent-soft/30 ${isSelected ? "bg-accent-soft/20" : ""}`}>

                      {/* Checkbox */}
                      <td className="px-3 py-3 text-center" onClick={(e) => { e.stopPropagation(); toggleSelect(faq.id); }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(faq.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded border-border"
                        />
                      </td>

                      {/* Order + reorder arrows */}
                      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-col items-center gap-0.5">
                          <button onClick={() => handleMoveUp(faq)} disabled={isFirst}
                            className="flex h-5 w-5 items-center justify-center rounded text-muted hover:text-primary disabled:opacity-20 transition-colors text-[10px]">▲</button>
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-muted text-xs font-bold text-muted">
                            {globalIdx + 1}
                          </span>
                          <button onClick={() => handleMoveDown(faq)} disabled={isLast}
                            className="flex h-5 w-5 items-center justify-center rounded text-muted hover:text-primary disabled:opacity-20 transition-colors text-[10px]">▼</button>
                        </div>
                      </td>

                      {/* Question + answer */}
                      <td className="px-4 py-3 min-w-0">
                        <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
                          <HighlightText text={faq.question} terms={activeTerms} />
                        </p>
                        <p className="mt-1 text-xs text-muted leading-relaxed line-clamp-4 whitespace-pre-wrap">
                          <HighlightText text={faq.answer} terms={activeTerms} />
                        </p>
                        <p className="mt-1 font-mono text-[10px] text-muted/50">{faq.id}</p>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3">
                        <span className="rounded-full border border-border bg-surface-muted px-2.5 py-1 text-xs font-semibold text-muted whitespace-nowrap">
                          {faq.category}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => handleToggleStatus(faq)}
                          title={faq.status === "published" ? "คลิกเพื่อย้ายเป็นแบบร่าง" : "คลิกเพื่อเผยแพร่"}
                          className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition-all hover:opacity-70 whitespace-nowrap ${st.pill}`}>
                          {st.label}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => setModal({ item: faq })} title="แก้ไข"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted hover:border-amber-400 hover:text-amber-500 transition-colors">
                            <EditIcon />
                          </button>
                          <button onClick={() => setDeleteTarget(faq)} title="ลบ"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted hover:border-red-400 hover:text-red-500 transition-colors">
                            <TrashIcon />
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
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted hover:text-foreground disabled:opacity-40 transition-colors">←</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)}
              className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${p === currentPage ? "border-primary bg-primary text-white" : "border-border text-muted hover:text-foreground"}`}>
              {p}
            </button>
          ))}
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted hover:text-foreground disabled:opacity-40 transition-colors">→</button>
        </div>
      )}

      {/* Modals */}
      {modal !== null && (
        <FaqModal item={modal.item} onClose={() => setModal(null)} onSave={handleSave} />
      )}
      {deleteTarget && (
        <DeleteModal faq={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={deleteFaq} />
      )}
      {showImport && (
        <ImportModal existingFaqs={faqs} onClose={() => setShowImport(false)} onConfirm={handleImport} />
      )}
    </div>
  );
}
