"use client";

import { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { DEFAULT_DOCUMENTS, DOCUMENT_CATEGORIES } from "@/lib/data/documentsData";

const TODAY = new Date().toISOString().split("T")[0];
const DOCUMENTS = DEFAULT_DOCUMENTS.filter(
  (d) => d.status === "published" && (!d.rawDate || d.rawDate.split("T")[0] <= TODAY)
);

const THAI_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
function toThaiDate(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("T")[0].split("-").map(Number);
  return `${d} ${THAI_MONTHS[m - 1]} ${y + 543}`;
}

const FILE_ICON = {
  PDF:  { icon: "📄", cls: "bg-red-50 text-red-600 border-red-100" },
  DOCX: { icon: "📝", cls: "bg-blue-50 text-blue-600 border-blue-100" },
  XLSX: { icon: "📊", cls: "bg-emerald-50 text-emerald-600 border-emerald-100" },
};

const CAT_COLOR = {
  announcement: { bar: "bg-amber-400",   badge: "bg-amber-50 text-amber-700 border-amber-200" },
  form:         { bar: "bg-blue-500",    badge: "bg-blue-50 text-blue-700 border-blue-200" },
  guideline:    { bar: "bg-violet-500",  badge: "bg-violet-50 text-violet-700 border-violet-200" },
  report:       { bar: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  letter:       { bar: "bg-orange-400",  badge: "bg-orange-50 text-orange-700 border-orange-200" },
};

function DocRow({ doc }) {
  const fi = FILE_ICON[doc.fileType] ?? FILE_ICON.PDF;
  const displayDate = doc.rawDate ? toThaiDate(doc.rawDate) : "";
  return (
    <div className="group flex items-center gap-4 px-4 py-3 transition-colors hover:bg-surface-muted">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border text-lg ${fi.cls}`}>
        {fi.icon}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          {doc.isNew && (
            <span className="shrink-0 rounded-full bg-primary px-3 py-0.5 text-sm font-bold text-white">ใหม่</span>
          )}
          <p className="text-base font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">
            {doc.title}
          </p>
        </div>
        {doc.description && (
          <p className="mt-0.5 truncate text-sm text-muted">{doc.description}</p>
        )}
      </div>

      <div className="hidden shrink-0 text-right text-sm font-semibold text-muted sm:block">
        <p>{displayDate}</p>
        {doc.fileSize && <p className="mt-0.5 font-normal">{doc.fileType} · {doc.fileSize}</p>}
      </div>

      <button
        onClick={() => alert(`กำลังดาวน์โหลด: ${doc.title}`)}
        className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-muted hover:border-primary hover:bg-primary hover:text-white transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
        <span className="hidden sm:inline">ดาวน์โหลด</span>
      </button>
    </div>
  );
}

function CategorySection({ cat, docs }) {
  const color = CAT_COLOR[cat.id] ?? { bar: "bg-gray-400", badge: "bg-gray-50 text-gray-600 border-gray-200" };
  return (
    <section>
      <div className="mb-2 flex items-center gap-3">
        <div className={`h-5 w-1 rounded-full ${color.bar}`} />
        <h2 className="text-base font-bold text-foreground">{cat.label}</h2>
        <span className={`rounded-full border px-3 py-0.5 text-sm font-semibold ${color.badge}`}>
          {docs.length} รายการ
        </span>
      </div>
      <div className="divide-y divide-border rounded-xl border border-border bg-white overflow-hidden">
        {docs.map((doc) => <DocRow key={doc.id} doc={doc} />)}
      </div>
    </section>
  );
}

function DocumentsContent() {
  const searchParams = useSearchParams();
  const activeCat = searchParams.get("cat") ?? "all";

  const [search, setSearch] = useState("");

  const activeCatLabel = activeCat === "all"
    ? "ทั้งหมด"
    : DOCUMENT_CATEGORIES.find((c) => c.id === activeCat)?.label ?? "ทั้งหมด";

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return DOCUMENTS.filter((doc) => {
      const matchCat = activeCat === "all" || doc.category === activeCat;
      const matchSearch = !q || doc.title.toLowerCase().includes(q) || doc.description.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [activeCat, search]);

  const groups = useMemo(() => {
    if (activeCat !== "all") {
      const cat = DOCUMENT_CATEGORIES.find((c) => c.id === activeCat);
      return cat ? [{ cat, docs: filtered }] : [];
    }
    return DOCUMENT_CATEGORIES
      .map((cat) => ({ cat, docs: filtered.filter((d) => d.category === cat.id) }))
      .filter(({ docs }) => docs.length > 0);
  }, [filtered, activeCat]);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">

      {/* ── Page header ── */}
      <div className="bg-white border-b border-border">
        <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12 pt-10 pb-8">
          <div className="flex items-baseline gap-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">เอกสาร</h1>
            <span className="text-xl font-semibold text-muted md:text-2xl">/ {activeCatLabel}</span>
          </div>
          <p className="mt-1 text-sm text-muted">{filtered.length} รายการ</p>
        </div>
      </div>

      <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12 py-8">

        {/* ── Search ── */}
        <div className="mb-6">
          <div className="relative max-w-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาเอกสาร..."
              className="w-full rounded-xl border border-border bg-white py-2.5 pl-9 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </div>
        </div>

        {/* ── Content ── */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-base font-semibold text-foreground">ไม่พบเอกสารที่ตรงกัน</p>
            <p className="text-sm text-muted mt-1">ลองเปลี่ยนคำค้นหาหรือหมวดหมู่</p>
          </div>
        ) : (
          <div className="space-y-8">
            {groups.map(({ cat, docs }) => (
              <CategorySection key={cat.id} cat={cat} docs={docs} />
            ))}
          </div>
        )}

        {/* ── Info banner ── */}
        <div className="mt-10 rounded-2xl border border-border bg-white p-5 flex gap-4 items-start">
          <span className="text-2xl shrink-0">📬</span>
          <div>
            <p className="text-sm font-semibold text-foreground">ไม่พบเอกสารที่ต้องการ?</p>
            <p className="text-sm text-muted mt-0.5">
              ติดต่อเจ้าหน้าที่โครงการได้ที่{" "}
              <a href="mailto:info@kosen.ac.th" className="text-primary underline hover:no-underline">
                info@kosen.ac.th
              </a>{" "}
              หรือโทร 02-xxx-xxxx ในวันและเวลาราชการ
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function DocumentsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <DocumentsContent />
    </Suspense>
  );
}
