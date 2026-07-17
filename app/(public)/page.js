"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import BannerSlider from "@/components/BannerSlider";
import SplashOverlay from "@/components/SplashOverlay";
import { useNews } from "@/components/admin/NewsContext";
import { formatDate, publishedNews } from "@/lib/newsUtils";
import { usePublicLanguage } from "@/components/public/PublicLanguageContext";
import FAQChatbot from "@/components/public/FAQChatbot";
import { DEFAULT_JOBS } from "@/lib/jobData";

function SectionHeader({ eyebrow, title, subtitle, href, linkLabel }) {
  return (
    <div className="mb-8 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-primary">{eyebrow}</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {href && (
        <Link href={href} className="mt-3 shrink-0 text-sm font-semibold text-primary hover:underline sm:mt-0">
          {linkLabel} →
        </Link>
      )}
    </div>
  );
}

function StudentModal({ student, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!student) return null;

  const handleShare = async () => {
    const text = `✨ ผลงานนักเรียน KOSEN-KMUTT\n👤 ${student.name}\n🎓 สาขา: ${student.field} ชั้นปีที่ ${student.year}\n🏆 ${student.award}\n💡 โปรเจกต์: ${student.project}\n📧 ${student.email}`;
    if (navigator.share) {
      try { await navigator.share({ title: `ผลงาน ${student.name}`, text }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/10 text-white hover:bg-black/20 transition-colors text-sm"
        >
          ✕
        </button>

        {/* Header */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-600 px-6 pt-8 pb-10 flex items-center gap-4">
          <div className="h-16 w-16 shrink-0 rounded-full bg-gradient-to-b from-slate-500 to-slate-700 ring-4 ring-white/30 flex items-end justify-center overflow-hidden shadow-lg">
            <svg viewBox="0 0 64 72" className="w-12 h-12 translate-y-1" fill="none" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="32" cy="18" rx="16" ry="3.5" fill="white" fillOpacity="0.25" />
              <polygon points="32,9 48,18 32,22 16,18" fill="white" fillOpacity="0.85" />
              <rect x="44" y="18" width="1.5" height="8" rx="0.75" fill="white" fillOpacity="0.7" />
              <circle cx="45.75" cy="27" r="2" fill="#FBBF24" />
              <circle cx="32" cy="32" r="8" fill="white" fillOpacity="0.9" />
              <path d="M16 58 Q16 46 32 46 Q48 46 48 58" fill="white" fillOpacity="0.75" />
            </svg>
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-extrabold text-white leading-tight">{student.name}</h2>
            <p className="text-sm text-slate-300 mt-0.5">{student.field}</p>
            <p className="text-xs text-slate-400 mt-0.5">ชั้นปีที่ {student.year} · KOSEN-KMUTT</p>
          </div>
        </div>

        {/* Award banner */}
        <div className={`px-6 py-2.5 flex items-center gap-2 ${student.awardColor}`}>
          <span className="text-sm font-bold">{student.award}</span>
        </div>

        {/* Info */}
        <div className="px-6 py-4 space-y-3">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 shrink-0 text-base">💡</span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">โปรเจกต์ / ผลงานวิจัย</p>
              <p className="text-sm text-foreground leading-snug mt-0.5">{student.project}</p>
            </div>
          </div>

          <div className="border-t border-border pt-3 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">ติดต่อ</p>
            <a
              href={`mailto:${student.email}`}
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <span>📧</span> {student.email}
            </a>
          </div>
        </div>

        {/* Share button */}
        <div className="px-6 pb-5">
          <button
            onClick={handleShare}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-border bg-surface-muted py-2.5 text-sm font-semibold text-foreground hover:bg-border transition-colors"
          >
            {copied ? (
              <><span>✅</span> คัดลอกแล้ว</>
            ) : (
              <><span>🔗</span> แชร์ข้อมูลนักเรียน</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function getInitials(name) {
  return (name || "").replace(/บริษัท|จำกัด|\(มหาชน\)/g, "").trim().slice(0, 2);
}

const AVATAR_COLORS = ["bg-blue-600","bg-orange-500","bg-violet-600","bg-teal-600","bg-red-500","bg-emerald-600","bg-amber-500","bg-pink-600","bg-sky-600","bg-indigo-600"];

export default function HomePage() {
  const { t } = usePublicLanguage();
  const { news } = useNews();
  const pubNews = publishedNews(news);
  const pubAnnouncements = pubNews.filter((n) => n.category === "ประกาศ");
  const pubNewsOnly = pubNews.filter((n) => n.category !== "ประกาศ");

  const [jobs, setJobs] = useState([]);
  useEffect(() => {
    try {
      const SEED_VERSION = `v${DEFAULT_JOBS.length}r8`;
      const version = localStorage.getItem("kosen_jobs_seed_version");
      if (version !== SEED_VERSION) {
        localStorage.setItem("kosen_jobs", JSON.stringify(DEFAULT_JOBS));
        localStorage.setItem("kosen_jobs_seed_version", SEED_VERSION);
        setJobs(DEFAULT_JOBS);
      } else {
        const stored = localStorage.getItem("kosen_jobs");
        setJobs(stored ? JSON.parse(stored) : DEFAULT_JOBS);
      }
    } catch { setJobs(DEFAULT_JOBS); }
  }, []);

  const previewJobs = jobs.filter((j) => j.status === "เปิดรับ").slice(0, 6);

  return (
    <>
      <SplashOverlay />
      {/* ── 1. Banner ── */}
      <BannerSlider className="h-[65vh] shrink-0" />

      {/* ── 3. News ── */}
      <section className="bg-slate-50 pt-8 pb-14 md:pb-20">
        <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{t("home.news.title")}</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
            {pubNewsOnly.slice(0, 6).map((item, idx) => {
              const isNew = idx === 0;
              return (
                <Link key={item.id} href={`/news/${item.id}`}
                  className={`card card-hover group flex flex-col overflow-hidden ${isNew ? "ring-2 ring-primary/40 shadow-lg shadow-primary/10" : ""}`}>
                  <div className="relative w-full min-h-[260px] shrink-0 overflow-hidden bg-slate-100">
                    {item.image ? (
                      <Image src={item.image} alt={item.title} fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 33vw" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-4xl text-slate-300">📰</div>
                    )}
                    {isNew && (
                      <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full gradient-hero px-3.5 py-1.5 text-sm font-extrabold text-white shadow-md">
                        ✦ ใหม่ล่าสุด
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-6">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`rounded-full px-3.5 py-1 text-sm font-semibold ${item.catColor}`}>{item.category}</span>
                      <time className="text-sm font-semibold text-muted">{formatDate(item.publishedAt)}</time>
                    </div>
                    <h3 className={`font-extrabold group-hover:text-primary transition-colors leading-snug line-clamp-2 ${isNew ? "text-xl text-primary" : "text-lg text-foreground"}`}>{item.title}</h3>
                    <p className="text-sm text-muted leading-relaxed line-clamp-3">{item.excerpt}</p>
                    <span className="mt-auto text-sm font-semibold text-primary">{t("home.news.readMore")} →</span>
                  </div>
                </Link>
              );
            })}
          </div>
          <Link href="/news"
            className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-border bg-white py-5 text-base font-semibold text-muted hover:border-primary hover:text-primary hover:bg-primary/5 transition-all duration-200 group">
            ดูข่าวทั้งหมด
            <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </section>

      {/* ── 3.5 Announcements ── */}
      <section className="bg-white py-14 md:py-20 border-t border-border">
        <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">ประกาศ</h2>
            </div>
          </div>
          {pubAnnouncements.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-4xl mb-3">📋</p>
              <p className="text-sm text-muted">ยังไม่มีประกาศในขณะนี้</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
              {pubAnnouncements.slice(0, 3).map((item, idx) => {
                const isNew = idx === 0;
                return (
                  <Link key={item.id} href={`/news/${item.id}`}
                    className={`card card-hover group flex flex-col overflow-hidden ${isNew ? "ring-2 ring-primary/40 shadow-lg shadow-primary/10" : ""}`}>
                    <div className="relative w-full min-h-[260px] shrink-0 overflow-hidden bg-slate-100">
                      {item.image ? (
                        <Image src={item.image} alt={item.title} fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 768px) 100vw, 33vw" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-4xl text-slate-300">📋</div>
                      )}
                      {isNew && (
                        <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full gradient-hero px-3.5 py-1.5 text-sm font-extrabold text-white shadow-md">
                          ✦ ล่าสุด
                        </span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-2 p-6">
                      <time className="text-sm font-semibold text-muted">{formatDate(item.publishedAt)}</time>
                      <h3 className={`font-extrabold group-hover:text-primary transition-colors leading-snug line-clamp-2 ${isNew ? "text-xl text-primary" : "text-lg text-foreground"}`}>{item.title}</h3>
                      <p className="text-sm text-muted leading-relaxed line-clamp-3">{item.excerpt}</p>
                      <span className="mt-auto text-sm font-semibold text-primary">อ่านประกาศ →</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
          <Link href="/news?cat=%E0%B8%9B%E0%B8%A3%E0%B8%B0%E0%B8%81%E0%B8%B2%E0%B8%A8"
            className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-border bg-slate-50 py-5 text-base font-semibold text-muted hover:border-primary hover:text-primary hover:bg-primary/5 transition-all duration-200 group">
            ดูประกาศทั้งหมด
            <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </section>

      {/* ── 5. Marketplace ── */}
      <section className="bg-slate-50 pt-8 pb-14 md:pb-20">
        <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{t("home.marketplace.title")}</h2>
            </div>
            <Link href="/marketplace" className="mt-3 shrink-0 text-sm font-semibold text-primary hover:underline sm:mt-0">
              {t("home.marketplace.viewAll")} →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
            {previewJobs.map((job, idx) => (
              <Link key={job.id} href={`/marketplace/${job.id}`} className="card card-hover group flex flex-col overflow-hidden">
                {/* Top image-like area */}
                <div className={`relative flex min-h-[180px] w-full items-center justify-center ${AVATAR_COLORS[idx % AVATAR_COLORS.length]}`}>
                  <span className="text-5xl font-extrabold text-white/30 tracking-tight select-none">{getInitials(job.companyName)}</span>
                  <span className={`absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-semibold ${job.type === "ฝึกงาน" ? "bg-accent-soft text-primary" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
                    {job.type === "ฝึกงาน" ? "🎓 ฝึกงาน" : "💼 งานประจำ"}
                  </span>
                  <span className="absolute right-3 top-3 rounded-full bg-green-50 border border-green-200 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                    เปิดรับ
                  </span>
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col gap-2 p-6">
                  <p className="text-xs text-muted font-medium">{job.companyName}</p>
                  <h3 className="font-extrabold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors text-lg">
                    {job.title}
                  </h3>
                  {job.titleEn && <p className="text-xs text-muted line-clamp-1">{job.titleEn}</p>}
                  {job.tags && job.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {job.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="rounded-md border border-border bg-surface px-1.5 py-0.5 text-[11px] text-muted font-mono">
                          {tag}
                        </span>
                      ))}
                      {job.tags.length > 3 && <span className="text-[11px] text-muted self-center">+{job.tags.length - 3}</span>}
                    </div>
                  )}
                  <div className="mt-auto flex items-center justify-between pt-3 border-t border-border">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[11px] text-muted">📍 {job.location}</span>
                      <span className="text-[11px] text-muted">⏰ หมดเขต {job.deadline}</span>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-primary">{t("home.news.readMore")} →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <Link href="/marketplace"
            className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-border bg-white py-5 text-base font-semibold text-muted hover:border-primary hover:text-primary hover:bg-primary/5 transition-all duration-200 group">
            {t("home.marketplace.viewAll")}
            <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </section>

      <FAQChatbot />
    </>
  );
}
