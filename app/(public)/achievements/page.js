"use client";

import { useState } from "react";
import { topStudents } from "@/lib/data/achievementsData";

function StudentAvatar({ size = "md" }) {
  const dim = size === "lg" ? "w-20 h-20" : "w-14 h-14";
  const svg = size === "lg" ? "w-14 h-14" : "w-10 h-10";
  return (
    <div className={`${dim} rounded-full bg-gradient-to-b from-slate-600 to-slate-800 flex items-end justify-center overflow-hidden shrink-0`}>
      <svg viewBox="0 0 64 72" className={`${svg} translate-y-1`} fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="32" cy="18" rx="16" ry="3.5" fill="white" fillOpacity="0.25" />
        <polygon points="32,9 48,18 32,22 16,18" fill="white" fillOpacity="0.85" />
        <rect x="44" y="18" width="1.5" height="8" rx="0.75" fill="white" fillOpacity="0.7" />
        <circle cx="45.75" cy="27" r="2" fill="#FBBF24" />
        <circle cx="32" cy="32" r="8" fill="white" fillOpacity="0.9" />
        <path d="M16 58 Q16 46 32 46 Q48 46 48 58" fill="white" fillOpacity="0.75" />
      </svg>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/10 text-white hover:bg-black/20 transition-colors text-sm">✕</button>

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

        <div className={`px-6 py-2.5 flex items-center gap-2 ${student.awardColor}`}>
          <span className="text-sm font-bold">{student.award}</span>
        </div>

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
            <a href={`mailto:${student.email}`} className="flex items-center gap-2 text-sm text-primary hover:underline">
              <span>📧</span> {student.email}
            </a>
          </div>
        </div>

        <div className="px-6 pb-5">
          <button onClick={handleShare} className="w-full flex items-center justify-center gap-2 rounded-xl border border-border bg-surface-muted py-2.5 text-sm font-semibold text-foreground hover:bg-border transition-colors">
            {copied ? <><span>✅</span> คัดลอกแล้ว</> : <><span>🔗</span> แชร์ข้อมูลนักเรียน</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AchievementsPage() {
  const [selected, setSelected] = useState(null);
  const [paused, setPaused] = useState(false);
  const doubled = [...topStudents, ...topStudents];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <StudentModal student={selected} onClose={() => setSelected(null)} />

      {/* ── Hero marquee banner ── */}
      <section className="bg-gradient-to-b from-slate-900 to-slate-800 pt-10 pb-6">
        <div className="page-container mb-4">
          <p className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-1">Hall of Fame</p>
          <h1 className="text-3xl font-extrabold text-white md:text-4xl">ผลงานนักเรียน</h1>
          <p className="text-sm text-slate-400 mt-1">นักเรียน KOSEN-KMUTT ที่สร้างชื่อเสียงในเวทีระดับชาติและนานาชาติ</p>
        </div>

        <style>{`
          @keyframes marquee-ach { from { transform: translateX(0); } to { transform: translateX(-50%); } }
          .marquee-ach { animation: marquee-ach 40s linear infinite; }
          .marquee-ach.paused { animation-play-state: paused; }
        `}</style>

        <div
          className="w-full overflow-hidden py-4"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className={`marquee-ach${paused ? " paused" : ""} flex gap-10 w-max`}>
            {doubled.map((s, idx) => (
              <div
                key={idx}
                onClick={() => setSelected(s)}
                className="group flex flex-col items-center gap-1.5 cursor-pointer"
              >
                <div className="relative h-20 w-20 sm:h-24 sm:w-24">
                  <div className="h-full w-full rounded-full overflow-hidden ring-4 ring-white/20 group-hover:ring-amber-400 transition-all duration-300 shadow-lg bg-gradient-to-b from-slate-600 to-slate-800 flex items-end justify-center">
                    <svg viewBox="0 0 64 72" className="w-14 h-14 sm:w-16 sm:h-16 translate-y-1" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <ellipse cx="32" cy="18" rx="16" ry="3.5" fill="white" fillOpacity="0.25" />
                      <polygon points="32,9 48,18 32,22 16,18" fill="white" fillOpacity="0.85" />
                      <rect x="44" y="18" width="1.5" height="8" rx="0.75" fill="white" fillOpacity="0.7" />
                      <circle cx="45.75" cy="27" r="2" fill="#FBBF24" />
                      <circle cx="32" cy="32" r="8" fill="white" fillOpacity="0.9" />
                      <path d="M16 58 Q16 46 32 46 Q48 46 48 58" fill="white" fillOpacity="0.75" />
                    </svg>
                  </div>
                  <span className={`absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-0.5 text-[9px] font-bold shadow-lg ring-1 ring-slate-900 ${s.awardColor}`}>
                    {s.award.replace(/^[\p{Emoji}\s]+/u, "").trim()}
                  </span>
                </div>
                <div className="text-center mt-1">
                  <p className="text-xs font-bold text-white leading-tight">{s.name}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{s.field}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* gradient transition */}
      <div className="h-3 bg-gradient-to-b from-slate-800 to-slate-50" />

      {/* ── Grid รายการทั้งหมด ── */}
      <div className="page-container py-10">
        <p className="text-xs font-bold uppercase tracking-widest text-primary mb-6">รายชื่อทั้งหมด</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {topStudents.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelected(s)}
              className="group flex items-center gap-4 rounded-2xl border border-border bg-white p-4 text-left shadow-sm hover:shadow-md hover:border-primary/30 transition-all"
            >
              <div className="h-14 w-14 shrink-0 rounded-full bg-gradient-to-b from-slate-600 to-slate-800 ring-2 ring-border group-hover:ring-amber-400 transition-all flex items-end justify-center overflow-hidden">
                <svg viewBox="0 0 64 72" className="w-10 h-10 translate-y-1" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <ellipse cx="32" cy="18" rx="16" ry="3.5" fill="white" fillOpacity="0.25" />
                  <polygon points="32,9 48,18 32,22 16,18" fill="white" fillOpacity="0.85" />
                  <rect x="44" y="18" width="1.5" height="8" rx="0.75" fill="white" fillOpacity="0.7" />
                  <circle cx="45.75" cy="27" r="2" fill="#FBBF24" />
                  <circle cx="32" cy="32" r="8" fill="white" fillOpacity="0.9" />
                  <path d="M16 58 Q16 46 32 46 Q48 46 48 58" fill="white" fillOpacity="0.75" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-foreground text-sm leading-tight group-hover:text-primary transition-colors">{s.name}</p>
                <p className="text-xs text-muted mt-0.5 truncate">{s.field} · ปีที่ {s.year}</p>
                <span className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${s.awardColor}`}>
                  {s.award}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
