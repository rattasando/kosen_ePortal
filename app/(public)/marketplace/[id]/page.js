"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { DEFAULT_JOBS } from "@/lib/jobData";
import { DEFAULT_COMPANIES } from "@/lib/companyData";

function loadFromStorage(key, fallback) {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; }
  catch { return fallback; }
}

function formatDate(iso) {
  if (!iso) return "–";
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" });
}

function daysLeft(iso) {
  if (!iso) return null;
  const diff = Math.ceil((new Date(iso) - new Date()) / 86400000);
  return diff;
}

const STATUS_CFG = {
  เปิดรับ:   { label: "เปิดรับสมัคร",   color: "bg-green-50 text-green-700 border-green-200" },
  ปิดรับ:   { label: "ปิดรับสมัครแล้ว", color: "bg-gray-50 text-gray-500 border-gray-200" },
  เต็มแล้ว:  { label: "ที่นั่งเต็มแล้ว", color: "bg-orange-50 text-orange-600 border-orange-200" },
};

function CompanyAvatar({ name, logo, size = "md" }) {
  const initials = name.replace(/บริษัท|จำกัด|\(มหาชน\)/g, "").trim().slice(0, 2);
  const sz = size === "xl" ? "h-20 w-20 text-2xl" : size === "lg" ? "h-14 w-14 text-lg" : "h-10 w-10 text-sm";
  if (logo) {
    return (
      <div className={`shrink-0 ${sz} rounded-2xl border border-border bg-white flex items-center justify-center overflow-hidden p-2`}>
        <img src={logo} alt={name} className="w-full h-full object-contain" />
      </div>
    );
  }
  return (
    <div className={`shrink-0 ${sz} rounded-2xl bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center font-bold text-primary border border-primary/20`}>
      {initials}
    </div>
  );
}

function InfoChip({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-surface-muted px-4 py-3.5">
      <span className="text-xl mt-0.5 shrink-0">{icon}</span>
      <div>
        <p className="text-xs text-muted mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-foreground leading-snug">{value}</p>
      </div>
    </div>
  );
}

export default function JobDetailPage() {
  const { id } = useParams();
  const [job, setJob]         = useState(null);
  const [company, setCompany] = useState(null);
  const [related, setRelated] = useState([]);
  const [ready, setReady]     = useState(false);

  useEffect(() => {
    const jobs      = loadFromStorage("kosen_jobs", DEFAULT_JOBS);
    const companies = loadFromStorage("kosen_companies", DEFAULT_COMPANIES);
    const found     = jobs.find((j) => j.id === id);
    setJob(found ?? null);
    if (found) {
      setCompany(companies.find((c) => c.name === found.companyName) ?? null);
      setRelated(jobs.filter((j) => j.id !== id && (j.companyName === found.companyName || j.field === found.field) && j.status === "เปิดรับ").slice(0, 3));
    }
    setReady(true);
  }, [id]);

  if (!ready) {
    return <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12 py-20 text-center text-muted text-sm">กำลังโหลด...</div>;
  }

  if (!job) {
    return (
      <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12 py-20 text-center">
        <p className="text-5xl mb-4">🔍</p>
        <h1 className="text-xl font-bold text-foreground mb-2">ไม่พบตำแหน่งงานนี้</h1>
        <p className="text-muted text-sm mb-6">อาจถูกปิดรับหรือลบออกจากระบบแล้ว</p>
        <Link href="/marketplace" className="inline-block rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors">
          ← กลับไปตลาดงาน
        </Link>
      </div>
    );
  }

  const statusCfg = STATUS_CFG[job.status] ?? { label: job.status, color: "bg-gray-100 text-gray-500 border-gray-200" };
  const days      = daysLeft(job.deadline);

  return (
    <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12 py-10 md:py-14">

      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted">
        <Link href="/marketplace" className="hover:text-primary transition-colors">ตลาดงาน</Link>
        <span>/</span>
        <span className="text-foreground font-medium line-clamp-1">{job.title}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px] lg:items-start">

        {/* ── Main content ── */}
        <div className="space-y-8">

          {/* Hero block */}
          <div className="rounded-2xl border border-border bg-surface p-6 md:p-8">
            <div className="flex items-start gap-5">
              <CompanyAvatar name={job.companyName} size="xl" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusCfg.color}`}>
                    {statusCfg.label}
                  </span>
                  <span className="rounded-full bg-surface-muted border border-border px-3 py-1 text-xs font-medium text-muted">
                    {job.type}
                  </span>
                  <span className="rounded-full bg-surface-muted border border-border px-3 py-1 text-xs font-medium text-muted">
                    {job.field}
                  </span>
                </div>
                <h1 className="text-2xl font-extrabold text-foreground leading-tight md:text-3xl">{job.title}</h1>
                {job.titleEn && <p className="mt-1 text-base text-muted">{job.titleEn}</p>}
                <p className="mt-2 text-sm text-muted">{job.companyName}</p>

                {/* Tags */}
                {job.tags && job.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {job.tags.map((tag) => (
                      <span key={tag} className="rounded-md border border-border bg-background px-2 py-0.5 text-xs text-muted font-mono">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Quick meta row */}
                <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted border-t border-border pt-4">
                  <span className="flex items-center gap-1.5">📍 {job.location}{job.country && job.country !== "ไทย" ? `, ${job.country}` : ""}</span>
                  <span className="flex items-center gap-1.5">💰 {job.salary}</span>
                  {job.duration && <span className="flex items-center gap-1.5">⏱ {job.duration}</span>}
                  <span className="flex items-center gap-1.5">👥 รับ {job.slots} อัตรา</span>
                </div>
              </div>
            </div>
          </div>

          {/* Info grid */}
          <div>
            <h2 className="text-base font-bold text-foreground mb-3">ข้อมูลตำแหน่ง</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoChip icon="📋" label="ประเภทงาน"        value={job.type} />
              <InfoChip icon="🎓" label="สาขาที่เกี่ยวข้อง" value={job.field} />
              <InfoChip icon="📍" label="สถานที่ทำงาน"      value={`${job.location}${job.country && job.country !== "ไทย" ? `, ${job.country}` : ""}`} />
              <InfoChip icon="💰" label="เงินเดือน/ค่าตอบแทน" value={job.salary} />
              <InfoChip icon="📅" label="วันเริ่มงาน"       value={formatDate(job.startDate)} />
              <InfoChip icon="⏰" label="รับสมัครถึง"       value={`${formatDate(job.deadline)}${days !== null ? ` (${days > 0 ? `อีก ${days} วัน` : days === 0 ? "วันนี้วันสุดท้าย" : "หมดเขตแล้ว"})` : ""}`} />
              {job.duration && <InfoChip icon="⏱" label="ระยะเวลา" value={job.duration} />}
              <InfoChip icon="👥" label="จำนวนที่รับ"       value={`${job.slots} อัตรา`} />
            </div>
          </div>

          {/* Description */}
          {job.description && (
            <div>
              <h2 className="text-base font-bold text-foreground mb-3">รายละเอียดงาน</h2>
              <div className="rounded-2xl border border-border bg-surface p-6">
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">{job.description}</p>
              </div>
            </div>
          )}

          {/* Requirements */}
          {job.requirements && (
            <div>
              <h2 className="text-base font-bold text-foreground mb-3">คุณสมบัติที่ต้องการ</h2>
              <div className="rounded-2xl border border-border bg-surface p-6">
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">{job.requirements}</p>
              </div>
            </div>
          )}

          {/* Welfare */}
          {job.welfare && (
            <div>
              <h2 className="text-base font-bold text-foreground mb-3">สวัสดิการที่ได้รับ</h2>
              <div className="rounded-2xl border border-border bg-surface p-6">
                <ul className="space-y-1.5 text-sm text-foreground/80">
                  {job.welfare.split(/[·,]/).map((item) => item.trim()).filter(Boolean).map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-0.5">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Note */}
          {job.note && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-1.5">หมายเหตุ</p>
              <p className="text-sm text-amber-900 leading-relaxed">{job.note}</p>
            </div>
          )}

          {/* Company card */}
          {company && (
            <div>
              <h2 className="text-base font-bold text-foreground mb-3">เกี่ยวกับบริษัท</h2>
              <div className="rounded-2xl border border-border bg-surface p-6 space-y-4">
                <div className="flex items-start gap-4">
                  <CompanyAvatar name={company.name} size="lg" />
                  <div className="min-w-0">
                    <p className="font-bold text-foreground leading-snug">{company.name}</p>
                    {company.nameEn && <p className="text-sm text-muted">{company.nameEn}</p>}
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="rounded-full bg-surface-muted border border-border px-2.5 py-0.5 text-xs text-muted">{company.industry}</span>
                      <span className="rounded-full bg-surface-muted border border-border px-2.5 py-0.5 text-xs text-muted">{company.province}</span>
                      {company.mouStatus === "มี MOU" && (
                        <span className="rounded-full bg-blue-50 text-blue-600 border border-blue-100 px-2.5 py-0.5 text-xs font-semibold">มี MOU</span>
                      )}
                    </div>
                  </div>
                </div>

                {company.description && (
                  <p className="text-sm text-muted leading-relaxed">{company.description}</p>
                )}

                <div className="border-t border-border pt-4 grid gap-2 text-sm">
                  {company.contactName  && <p className="text-muted">👤 ผู้ติดต่อ: <span className="text-foreground font-medium">{company.contactName}</span></p>}
                  {company.contactEmail && <p className="text-muted">✉️ อีเมล: <a href={`mailto:${company.contactEmail}`} className="text-primary hover:underline">{company.contactEmail}</a></p>}
                  {company.contactTel   && <p className="text-muted">📞 โทร: <a href={`tel:${company.contactTel}`} className="text-foreground hover:text-primary">{company.contactTel}</a></p>}
                  {company.website      && <p className="text-muted">🌐 เว็บไซต์: <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{company.website}</a></p>}
                </div>
              </div>
            </div>
          )}

          {/* Related jobs */}
          {related.length > 0 && (
            <div>
              <h2 className="text-base font-bold text-foreground mb-3">ตำแหน่งงานที่คล้ายกัน</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((r) => (
                  <Link key={r.id} href={`/marketplace/${r.id}`}
                    className="rounded-xl border border-border bg-surface p-4 hover:border-primary/50 hover:shadow-sm transition-all">
                    <p className="font-semibold text-sm text-foreground leading-snug line-clamp-2 mb-1">{r.title}</p>
                    <p className="text-xs text-muted line-clamp-1">{r.companyName}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-muted">{r.location}</span>
                      <span className="rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 text-[11px] font-semibold">เปิดรับ</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-4 lg:sticky lg:top-24">

          {/* Summary card */}
          <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
            <h3 className="text-sm font-bold text-foreground">สรุปตำแหน่ง</h3>
            {[
              { icon: "📋", label: "ประเภท",   value: job.type },
              { icon: "📍", label: "สถานที่",  value: job.location },
              { icon: "💰", label: "ค่าตอบแทน", value: job.salary },
              { icon: "👥", label: "รับจำนวน", value: `${job.slots} อัตรา` },
              { icon: "⏰", label: "หมดเขต",   value: formatDate(job.deadline) },
            ].map(({ icon, label, value }) => (
              <div key={label} className="flex items-center justify-between text-sm border-b border-border/50 pb-2 last:border-0 last:pb-0">
                <span className="text-muted">{icon} {label}</span>
                <span className="font-semibold text-foreground text-right max-w-[55%] leading-snug">{value}</span>
              </div>
            ))}
          </div>

          <Link href="/marketplace"
            className="flex items-center justify-center gap-2 w-full rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted hover:text-foreground hover:border-foreground/30 transition-colors">
            ← ดูตำแหน่งงานทั้งหมด
          </Link>
        </div>

      </div>
    </div>
  );
}
