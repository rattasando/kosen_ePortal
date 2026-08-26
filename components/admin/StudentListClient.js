"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminTable from "@/components/admin/ui/AdminTable";
import StudentActionButtons from "@/components/admin/ui/StudentActionButtons";
import { useStudents } from "@/components/admin/contexts/StudentContext";
import { useStudentHistory } from "@/components/admin/contexts/StudentHistoryContext";
import { diffSnapshot, buildSummary } from "@/lib/utils/studentHistoryHelpers";
import { rowToStudent, exportCSV } from "@/lib/utils/studentCsv";
import StudentImportModal from "@/components/admin/modals/StudentImportModal";
import { useStudentFilters } from "@/lib/hooks/useStudentFilters";
import { usePagination } from "@/lib/hooks/usePagination";
import { getLatestEnrollment } from "@/lib/utils/studentFilters";

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

// ── Filter persistence — ย้ายไป useStudentFilters hook แล้ว ──

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

// ── Main ─────────────────────────────────────────────────────
export default function StudentListClient() {
  const { students, ready, replaceAll, updateStudent, addStudent, refetch } =
    useStudents();
  const { addEvent } = useStudentHistory();
  const router = useRouter();
  const {
    searchInput, setSearchInput,
    keywords, setKeywords,
    addKeyword: addKeywordFromHook, removeKeyword: removeKeywordFromHook,
    activeTerms,
    filterStatus, setFilterStatus,
    filterUniversity, setFilterUniversity,
    filterYear, setFilterYear,
    filterScholarship, setFilterScholarship,
    filterSelfFunded, setFilterSelfFunded,
    filterCountry, setFilterCountry,
    sortBy, setSortBy,
    filtered,
    universities,
    scholarships,
    hasActiveFilter,
    clearFilters: clearFiltersFromHook,
  } = useStudentFilters(students);

  const { page, setPage, pageSize, setPageSize, paginated, totalPages, rangeStart, rangeEnd } =
    usePagination(filtered, 20);

  const [showImport, setShowImport] = useState(false);
  const [importDone, setImportDone] = useState(null);
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

  const addKeyword = (kw) => { addKeywordFromHook(kw); setPage(1); };
  const removeKeyword = (kw) => { removeKeywordFromHook(kw); setPage(1); };
  const clearFilters = () => { clearFiltersFromHook(); setPage(1); };


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
        <StudentImportModal
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
          <div className="relative flex-1">
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
              placeholder="ชื่อ นามสกุล มหาวิทยาลัย สาขา (Enter เพื่อค้นหา)"
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
                <option key={s} value={s}>{s === "ทั้งหมด" ? "สถานะทั้งหมด" : s}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-0.5">
            <label className={labelCls}>ชั้นปี</label>
            <select value={filterYear} onChange={(e) => { setFilterYear(e.target.value); setPage(1); }} className={selectCls}>
              <option value="ทั้งหมด">ชั้นปีทั้งหมด</option>
              {["1", "2", "3", "4", "5"].map((y) => (
                <option key={y} value={y}>ปีที่ {y}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-0.5">
            <label className={labelCls}>มหาวิทยาลัย</label>
            <select value={filterUniversity} onChange={(e) => { setFilterUniversity(e.target.value); setPage(1); }} className={selectCls}>
              {universities.map((u) => (
                <option key={u} value={u}>{u === "ทั้งหมด" ? "มหาวิทยาลัยทั้งหมด" : u}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-0.5">
            <label className={labelCls}>ทุน</label>
            <select value={filterScholarship} onChange={(e) => { setFilterScholarship(e.target.value); setPage(1); }} className={selectCls}>
              {scholarships.map((s) => (
                <option key={s} value={s}>{s === "ทั้งหมด" ? "ทุนทั้งหมด" : scholarshipLabel(s)}</option>
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
              จ่ายเอง
            </button>
          </div>
          <div className="flex flex-col gap-0.5">
            <label className={labelCls}>ประเทศ</label>
            <select value={filterCountry} onChange={(e) => { setFilterCountry(e.target.value); setPage(1); }} className={selectCls}>
              <option value="ทั้งหมด">ประเทศที่อาศัยอยู่</option>
              <option value="ไทย">อาศัยอยู่ในไทย</option>
              <option value="ญี่ปุ่น">อาศัยอยู่ในญี่ปุ่น</option>
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
              จ่ายเอง<XIcon />
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
                    จ่ายเอง
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
            page={page}
            totalPages={totalPages}
            onPage={setPage}
          />
        </div>
      </div>
    </div>
  );
}
