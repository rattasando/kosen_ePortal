"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useFaq } from "./FaqContext";
import { FAQ_CATEGORIES } from "@/lib/faqData";

const inputCls    = "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-accent-soft placeholder:text-muted";
const labelCls    = "text-xs font-medium text-foreground";
const PAGE_SIZE   = 10;

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

// ── Import Modal ─────────────────────────────────────────────
const DIFF_CFG = {
  new:       { pill: "bg-emerald-100 text-emerald-700 border-emerald-200", label: "ใหม่" },
  update:    { pill: "bg-blue-100 text-blue-700 border-blue-200",          label: "อัปเดต" },
  unchanged: { pill: "bg-gray-100 text-gray-500 border-gray-200",          label: "ไม่เปลี่ยน" },
};

function ImportModal({ existingFaqs, onClose, onConfirm }) {
  const [step, setStep]       = useState("upload");
  const [parsed, setParsed]   = useState(null);
  const [mode, setMode]       = useState("merge");
  const [error, setError]     = useState("");
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
        {/* Header */}
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
              {/* Mode */}
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
              {/* Summary chips */}
              {counts && (
                <div className="flex flex-wrap gap-2">
                  {counts.new       > 0 && <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">+{counts.new} ใหม่</span>}
                  {counts.update    > 0 && <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">✎ {counts.update} อัปเดต</span>}
                  {counts.unchanged > 0 && <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-500">= {counts.unchanged} ไม่เปลี่ยน</span>}
                  {counts.deleted   > 0 && <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">−{counts.deleted} ลบออก</span>}
                </div>
              )}
              {/* Row details */}
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

const STATUS_CONFIG = {
  published: { label: "เผยแพร่",   pill: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  draft:     { label: "แบบร่าง",   pill: "bg-amber-100 text-amber-700 border-amber-200" },
};

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);

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

// ── FAQ Row ───────────────────────────────────────────────────
function FaqRow({ faq, index, total, activeTerms, onEdit, onDelete, onToggleStatus, onMoveUp, onMoveDown }) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const st = STATUS_CONFIG[faq.status] ?? STATUS_CONFIG.draft;

  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      {/* Header row */}
      <div className="flex items-start gap-3 p-4">
        {/* Reorder */}
        <div className="flex flex-col gap-0.5 shrink-0 mt-0.5">
          <button onClick={onMoveUp} disabled={index === 0}
            className="flex h-5 w-5 items-center justify-center rounded text-muted hover:text-primary disabled:opacity-25 transition-colors text-xs">▲</button>
          <button onClick={onMoveDown} disabled={index === total - 1}
            className="flex h-5 w-5 items-center justify-center rounded text-muted hover:text-primary disabled:opacity-25 transition-colors text-xs">▼</button>
        </div>

        {/* Number */}
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-muted text-xs font-bold text-muted mt-0.5">{index + 1}</span>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <button className="w-full text-left" onClick={() => setExpanded((v) => !v)}>
            <p className="text-sm font-semibold text-foreground leading-snug">
              <HighlightText text={faq.question} terms={activeTerms} />
            </p>
            {!expanded && (
              <p className="mt-1 text-xs text-muted line-clamp-1">
                <HighlightText text={faq.answer} terms={activeTerms} />
              </p>
            )}
          </button>
          {expanded && (
            <p className="mt-2 text-sm text-muted leading-relaxed whitespace-pre-wrap">
              <HighlightText text={faq.answer} terms={activeTerms} />
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full border bg-surface-muted px-2.5 py-1 text-xs font-semibold text-muted">{faq.category}</span>
            <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${st.pill}`}>{st.label}</span>
            <span className="font-mono text-[10px] text-muted">{faq.id}</span>
          </div>
        </div>

        {/* Chevron */}
        <button onClick={() => setExpanded((v) => !v)} className="shrink-0 text-muted hover:text-foreground transition-colors mt-0.5">
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Actions */}
      {!confirmDelete ? (
        <div className="flex items-center gap-2 border-t border-border bg-surface-muted/40 px-4 py-2">
          <button onClick={() => onToggleStatus(faq)}
            className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors ${faq.status === "published" ? "border-amber-200 text-amber-600 hover:bg-amber-50" : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"}`}>
            {faq.status === "published" ? "ย้ายเป็นแบบร่าง" : "เผยแพร่"}
          </button>
          <button onClick={() => onEdit(faq)} className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted hover:border-primary hover:text-primary transition-colors">แก้ไข</button>
          <button onClick={() => setConfirmDelete(true)} className="ml-auto flex h-7 w-7 items-center justify-center rounded-lg border border-red-200 text-red-400 hover:bg-red-50 transition-colors"><XIcon /></button>
        </div>
      ) : (
        <div className="flex items-center gap-2 border-t border-red-200 bg-red-50 px-4 py-2">
          <p className="flex-1 text-xs font-semibold text-red-700">ลบ FAQ นี้?</p>
          <button onClick={() => onDelete(faq.id)} className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-700 transition-colors">ยืนยัน</button>
          <button onClick={() => setConfirmDelete(false)} className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted hover:text-foreground transition-colors">ยกเลิก</button>
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function FaqListClient() {
  const { faqs, ready, addFaq, updateFaq, deleteFaq, reorder } = useFaq();
  const [search, setSearch]         = useState("");
  const [filterCat, setFilterCat]   = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [modal, setModal]           = useState(null);
  const [page, setPage]             = useState(1);
  const [showImport, setShowImport] = useState(false);
  const [importDone, setImportDone] = useState(null);

  const activeTerms = [search.trim()].filter(Boolean);

  const filtered = useMemo(() => {
    const sorted = [...faqs].sort((a, b) => a.order - b.order);
    return sorted.filter((f) => {
      if (filterCat    && f.category !== filterCat)  return false;
      if (filterStatus && f.status   !== filterStatus) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!f.question.toLowerCase().includes(q) && !f.answer.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [faqs, search, filterCat, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Reset page on filter change
  const setFilter = (fn) => { fn(); setPage(1); };

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
    const maxOrder = faqs.reduce((m, f) => Math.max(m, f.order ?? 0), 0);
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
        const norm = {
          category: FAQ_CATEGORIES[0], status: "published",
          ...r,
          order: r.order ? Number(r.order) : maxOrder + i + 1,
        };
        if (r.id && existingMap[r.id]) {
          updateFaq(r.id, norm); updated++;
        } else {
          addFaq({ ...norm, id: r.id || nextId(faqs) }); added++;
        }
      });
      setImportDone({ added, updated, mode: "merge" });
    }
    setTimeout(() => setImportDone(null), 4000);
  };

  const publishedCount = faqs.filter((f) => f.status === "published").length;
  const draftCount     = faqs.filter((f) => f.status === "draft").length;

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
      {/* Import done banner */}
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

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "FAQ ทั้งหมด", count: faqs.length,     pill: "bg-surface-muted border-border text-foreground" },
          { label: "เผยแพร่",     count: publishedCount,  pill: "bg-emerald-50 border-emerald-200 text-emerald-700" },
          { label: "แบบร่าง",     count: draftCount,      pill: "bg-amber-50 border-amber-200 text-amber-700" },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl border p-4 ${s.pill}`}>
            <p className="text-2xl font-extrabold">{s.count}</p>
            <p className="text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="ค้นหาคำถามหรือคำตอบ..."
            className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-accent-soft placeholder:text-muted" />
        </div>
        {/* Category filter */}
        <select value={filterCat} onChange={(e) => setFilter(() => setFilterCat(e.target.value))}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-accent-soft">
          <option value="">หมวดหมู่ทั้งหมด</option>
          {FAQ_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        {/* Status filter */}
        <select value={filterStatus} onChange={(e) => setFilter(() => setFilterStatus(e.target.value))}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-accent-soft">
          <option value="">สถานะทั้งหมด</option>
          <option value="published">เผยแพร่</option>
          <option value="draft">แบบร่าง</option>
        </select>
        <button
          onClick={() => exportCSV(faqs, `faq_${new Date().toISOString().slice(0,10)}.csv`)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:border-primary hover:text-primary transition-colors whitespace-nowrap"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          ส่งออก CSV
        </button>
        <button
          onClick={() => setShowImport(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:border-primary hover:text-primary transition-colors whitespace-nowrap"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          นำเข้า CSV
        </button>
        <button onClick={() => setModal({})} className="btn-primary whitespace-nowrap">+ เพิ่ม FAQ</button>
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFilter(() => setFilterCat(""))}
          className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition-all ${filterCat === "" ? "border-primary bg-accent-soft text-primary" : "border-border text-muted hover:text-foreground"}`}>
          ทั้งหมด ({faqs.length})
        </button>
        {FAQ_CATEGORIES.map((cat) => {
          const count = faqs.filter((f) => f.category === cat).length;
          if (!count) return null;
          return (
            <button key={cat} onClick={() => setFilter(() => setFilterCat(filterCat === cat ? "" : cat))}
              className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition-all ${filterCat === cat ? "border-primary bg-accent-soft text-primary" : "border-border text-muted hover:text-foreground"}`}>
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* Result info */}
      {(search || filterCat || filterStatus) && (
        <p className="text-xs text-muted">
          พบ {filtered.length} รายการ
          {search && <span> · ค้นหา "{search}"</span>}
          {filterCat && <span> · หมวด {filterCat}</span>}
          {filterStatus && <span> · {STATUS_CONFIG[filterStatus]?.label}</span>}
        </p>
      )}

      {/* FAQ list */}
      {paged.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-20 text-center text-sm text-muted">ไม่พบ FAQ ที่ตรงกับเงื่อนไข</div>
      ) : (
        <div className="space-y-3">
          {paged.map((faq, i) => (
            <FaqRow
              key={faq.id}
              faq={faq}
              index={(currentPage - 1) * PAGE_SIZE + i}
              total={faqs.length}
              activeTerms={activeTerms}
              onEdit={(f) => setModal({ item: f })}
              onDelete={deleteFaq}
              onToggleStatus={handleToggleStatus}
              onMoveUp={() => handleMoveUp(faq)}
              onMoveDown={() => handleMoveDown(faq)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted hover:text-foreground disabled:opacity-40 transition-colors">←</button>
          <span className="text-sm text-muted">หน้า {currentPage} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted hover:text-foreground disabled:opacity-40 transition-colors">→</button>
        </div>
      )}

      {modal !== null && (
        <FaqModal item={modal.item} onClose={() => setModal(null)} onSave={handleSave} />
      )}
      {showImport && (
        <ImportModal existingFaqs={faqs} onClose={() => setShowImport(false)} onConfirm={handleImport} />
      )}
    </div>
  );
}
