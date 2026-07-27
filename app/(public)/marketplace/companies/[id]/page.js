"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { DEFAULT_COMPANIES } from "@/lib/data/companyData";
import { DEFAULT_JOBS } from "@/lib/data/jobData";

function loadFromStorage(key, fallback) {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; }
  catch { return fallback; }
}

function formatDate(iso) {
  if (!iso) return "–";
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}

function daysLeft(iso) {
  if (!iso) return null;
  return Math.ceil((new Date(iso) - new Date()) / 86400000);
}

const STATUS_CFG = {
  เปิดรับ:  { label: "เปิดรับ",    color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  ปิดรับ:  { label: "ปิดรับแล้ว",  color: "bg-gray-100 text-gray-500 border-gray-200" },
  เต็มแล้ว: { label: "เต็มแล้ว",   color: "bg-amber-100 text-amber-700 border-amber-200" },
};

const FIELD_COLORS = [
  "bg-blue-50 text-blue-700 border-blue-100",
  "bg-violet-50 text-violet-700 border-violet-100",
  "bg-emerald-50 text-emerald-700 border-emerald-100",
  "bg-amber-50 text-amber-700 border-amber-100",
  "bg-rose-50 text-rose-700 border-rose-100",
  "bg-cyan-50 text-cyan-700 border-cyan-100",
  "bg-orange-50 text-orange-700 border-orange-100",
];
const fieldColorMap = {};
let colorIdx = 0;
function getFieldColor(f) {
  if (!fieldColorMap[f]) fieldColorMap[f] = FIELD_COLORS[colorIdx++ % FIELD_COLORS.length];
  return fieldColorMap[f];
}

function CompanyAvatar({ name, size = "xl" }) {
  const initials = name.replace(/บริษัท|จำกัด|\(มหาชน\)|ศูนย์|การ/g, "").trim().slice(0, 2);
  const sz = size === "xl" ? "h-20 w-20 text-2xl" : size === "lg" ? "h-14 w-14 text-lg" : "h-10 w-10 text-sm";
  return (
    <div className={`shrink-0 ${sz} rounded-2xl bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center font-bold text-primary border border-primary/20`}>
      {initials}
    </div>
  );
}

function JobRow({ job }) {
  const statusCfg = STATUS_CFG[job.status] ?? { label: job.status, color: "bg-gray-100 text-gray-500 border-gray-200" };
  const isOpen = job.status === "เปิดรับ";
  const days   = daysLeft(job.deadline);
  return (
    <Link href={`/marketplace/${job.id}`}
      className={`group flex gap-4 rounded-2xl border-2 bg-surface p-5 transition-all hover:shadow-md hover:border-primary/50 ${
        isOpen ? "border-border" : "border-border opacity-65"
      }`}>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusCfg.color}`}>{statusCfg.label}</span>
          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${getFieldColor(job.field)}`}>{job.field}</span>
          {job.type === "ฝึกงาน"
            ? <span className="rounded-full bg-blue-50 text-blue-600 border border-blue-100 px-2.5 py-0.5 text-xs font-medium">🎓 ฝึกงาน</span>
            : <span className="rounded-full bg-purple-50 text-purple-600 border border-purple-100 px-2.5 py-0.5 text-xs font-medium">💼 งานประจำ</span>
          }
        </div>
        <h3 className="font-bold text-foreground group-hover:text-primary transition-colors leading-snug">{job.title}</h3>
        {job.titleEn && <p className="text-xs text-muted mt-0.5">{job.titleEn}</p>}
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
          <span>📍 {job.location}</span>
          <span>💰 {job.salary}</span>
          {job.duration && <span>⏱ {job.duration}</span>}
          <span>👥 {job.slots} อัตรา</span>
        </div>
      </div>
      <div className="hidden sm:flex flex-col items-end justify-between shrink-0 min-w-[100px]">
        <span className="text-lg text-muted group-hover:text-primary transition-colors">›</span>
        <div className="text-right">
          {isOpen && days !== null && (
            <span className={`block text-xs font-semibold mb-0.5 ${days <= 7 ? "text-red-500" : "text-muted"}`}>
              {days <= 0 ? "หมดเขตแล้ว" : `อีก ${days} วัน`}
            </span>
          )}
          <span className="text-xs text-muted">ถึง {formatDate(job.deadline)}</span>
        </div>
      </div>
    </Link>
  );
}

export default function CompanyDetailPage() {
  const { id } = useParams();
  const [company, setCompany] = useState(null);
  const [jobs, setJobs]       = useState([]);
  const [ready, setReady]     = useState(false);
  const [tab, setTab]         = useState("เปิดรับ");

  useEffect(() => {
    const companies = loadFromStorage("kosen_companies", DEFAULT_COMPANIES);
    const allJobs   = loadFromStorage("kosen_jobs", DEFAULT_JOBS);
    const found = companies.find((c) => c.id === id);
    setCompany(found ?? null);
    if (found) setJobs(allJobs.filter((j) => j.companyName === found.name));
    setReady(true);
  }, [id]);

  if (!ready) return <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12 py-20 text-center text-muted text-sm">กำลังโหลด...</div>;

  if (!company) {
    return (
      <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12 py-20 text-center">
        <p className="text-5xl mb-4">🏢</p>
        <h1 className="text-xl font-bold text-foreground mb-2">ไม่พบข้อมูลบริษัทนี้</h1>
        <Link href="/marketplace/companies" className="inline-block rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors mt-4">
          ← กลับรายชื่อบริษัท
        </Link>
      </div>
    );
  }

  const openJobs   = jobs.filter((j) => j.status === "เปิดรับ");
  const closedJobs = jobs.filter((j) => j.status !== "เปิดรับ");
  const displayJobs = tab === "เปิดรับ" ? openJobs : closedJobs;

  const tabs = [
    { key: "เปิดรับ",    label: `เปิดรับสมัคร (${openJobs.length})` },
    { key: "ปิดแล้ว",   label: `ปิดรับแล้ว (${closedJobs.length})` },
  ];

  return (
    <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12 py-10 md:py-14">

      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted flex-wrap">
        <Link href="/marketplace" className="hover:text-primary transition-colors">ตลาดงาน</Link>
        <span>/</span>
        <Link href="/marketplace/companies" className="hover:text-primary transition-colors">บริษัทพาร์ทเนอร์</Link>
        <span>/</span>
        <span className="text-foreground font-medium line-clamp-1">{company.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1fr_300px] lg:items-start">

        {/* ── Main ── */}
        <div className="space-y-8">

          {/* Company hero */}
          <div className="rounded-2xl border border-border bg-surface p-6 md:p-8">
            <div className="flex items-start gap-5">
              <CompanyAvatar name={company.name} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                    company.status === "ร่วมมือ" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-500 border-gray-200"
                  }`}>{company.status}</span>
                  <span className="rounded-full bg-surface-muted border border-border px-2.5 py-0.5 text-xs text-muted">{company.industry}</span>
                  {company.mouStatus === "มี MOU" && (
                    <span className="rounded-full bg-blue-50 text-blue-600 border border-blue-100 px-2.5 py-0.5 text-xs font-semibold">มี MOU</span>
                  )}
                </div>
                <h1 className="text-2xl font-extrabold text-foreground leading-tight md:text-3xl">{company.name}</h1>
                {company.nameEn && <p className="mt-1 text-sm text-muted">{company.nameEn}</p>}
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted border-t border-border pt-3">
                  <span>📍 {company.province}{company.country !== "ไทย" ? `, ${company.country}` : ""}</span>
                  <span>🏭 {company.type}</span>
                  {company.openPositions > 0 && <span>💼 {company.openPositions} ตำแหน่ง</span>}
                </div>
              </div>
            </div>
            {company.description && (
              <p className="mt-5 text-sm text-foreground/80 leading-relaxed border-t border-border pt-5">{company.description}</p>
            )}
          </div>

          {/* Jobs section */}
          <div>
            <h2 className="text-base font-bold text-foreground mb-3">ตำแหน่งงานทั้งหมด</h2>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-border mb-5">
              {tabs.map((t) => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                    tab === t.key ? "border-primary text-primary" : "border-transparent text-muted hover:text-foreground"
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>

            {displayJobs.length === 0 ? (
              <div className="rounded-2xl border border-border bg-surface-muted py-12 text-center">
                <p className="text-3xl mb-2">💼</p>
                <p className="text-muted font-medium">
                  {tab === "เปิดรับ" ? "ไม่มีตำแหน่งเปิดรับในขณะนี้" : "ไม่มีตำแหน่งที่ปิดรับแล้ว"}
                </p>
                {tab === "เปิดรับ" && closedJobs.length > 0 && (
                  <button onClick={() => setTab("ปิดแล้ว")} className="mt-2 text-sm text-primary hover:underline">
                    ดูตำแหน่งที่ปิดรับแล้ว ({closedJobs.length})
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {displayJobs.map((job) => <JobRow key={job.id} job={job} />)}
              </div>
            )}
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-4 lg:sticky lg:top-24">

          {/* Contact info */}
          <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
            <h3 className="text-sm font-bold text-foreground">ข้อมูลติดต่อ</h3>
            <div className="space-y-2.5 text-sm">
              {company.contactName && (
                <div className="flex items-start gap-2.5">
                  <span className="text-base shrink-0 mt-0.5">👤</span>
                  <div>
                    <p className="text-xs text-muted">ผู้ติดต่อ</p>
                    <p className="font-medium text-foreground">{company.contactName}</p>
                  </div>
                </div>
              )}
              {company.contactEmail && (
                <div className="flex items-start gap-2.5">
                  <span className="text-base shrink-0 mt-0.5">✉️</span>
                  <div>
                    <p className="text-xs text-muted">อีเมล</p>
                    <a href={`mailto:${company.contactEmail}`} className="text-primary hover:underline break-all">{company.contactEmail}</a>
                  </div>
                </div>
              )}
              {company.contactTel && (
                <div className="flex items-start gap-2.5">
                  <span className="text-base shrink-0 mt-0.5">📞</span>
                  <div>
                    <p className="text-xs text-muted">โทรศัพท์</p>
                    <a href={`tel:${company.contactTel}`} className="font-medium text-foreground hover:text-primary">{company.contactTel}</a>
                  </div>
                </div>
              )}
              {company.website && (
                <div className="flex items-start gap-2.5">
                  <span className="text-base shrink-0 mt-0.5">🌐</span>
                  <div>
                    <p className="text-xs text-muted">เว็บไซต์</p>
                    <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">{company.website.replace(/^https?:\/\//, "")}</a>
                  </div>
                </div>
              )}
              {company.address && (
                <div className="flex items-start gap-2.5">
                  <span className="text-base shrink-0 mt-0.5">🏠</span>
                  <div>
                    <p className="text-xs text-muted">ที่อยู่</p>
                    <p className="text-foreground leading-snug text-xs">{company.address}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* MOU info */}
          {company.mouStatus === "มี MOU" && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
              <p className="text-xs font-bold text-blue-700 mb-1.5">📋 สถานะ MOU</p>
              <p className="text-sm font-semibold text-blue-900">มีสัญญาความร่วมมือ</p>
              {company.mouExpiry && (
                <p className="text-xs text-blue-600 mt-1">หมดอายุ {formatDate(company.mouExpiry)}</p>
              )}
            </div>
          )}

          {/* Stats */}
          <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
            <h3 className="text-sm font-bold text-foreground">สรุปตำแหน่งงาน</h3>
            {[
              { label: "ตำแหน่งทั้งหมด", value: jobs.length },
              { label: "เปิดรับสมัคร",   value: openJobs.length,   color: "text-emerald-600" },
              { label: "ปิดรับแล้ว",     value: closedJobs.length, color: "text-muted" },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between text-sm border-b border-border/50 pb-2.5 last:border-0 last:pb-0">
                <span className="text-muted">{label}</span>
                <span className={`font-bold ${color ?? "text-foreground"}`}>{value}</span>
              </div>
            ))}
          </div>

          <Link href="/marketplace/companies"
            className="flex items-center justify-center gap-2 w-full rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted hover:text-foreground hover:border-foreground/30 transition-colors">
            ← ดูบริษัทพาร์ทเนอร์ทั้งหมด
          </Link>
        </div>

      </div>
    </div>
  );
}
