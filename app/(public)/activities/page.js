"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useActivities } from "@/components/admin/contexts/ActivitiesContext";
import { publishedActivities } from "@/lib/utils/newsUtils";

function formatDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });
  } catch { return iso; }
}


function ActivityCard({ item, hero = false }) {
  return (
    <Link
      href={`/activities/${item.id}`}
      className={`group flex overflow-hidden rounded-2xl border border-border bg-white transition-shadow hover:shadow-lg ${
        hero ? "ring-2 ring-primary/40 shadow-lg shadow-primary/10" : ""
      }`}
    >
      {/* Image */}
      <div className={`relative w-1/2 shrink-0 overflow-hidden bg-slate-100 ${hero ? "min-h-[340px]" : "min-h-[260px]"}`}>
        {item.image ? (
          <Image
            src={item.image}
            alt={item.title}
            fill
            priority={hero}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="50vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl text-slate-300">🎪</div>
        )}
        {item.featured && (
          <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full gradient-hero px-2.5 py-1 text-xs font-extrabold text-white shadow-md">
            ✦ กิจกรรมเด่น
          </span>
        )}
        {hero && !item.featured && (
          <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full gradient-hero px-2.5 py-1 text-xs font-extrabold text-white shadow-md">
            ✦ ล่าสุด
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2.5 p-6">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${item.typeColor}`}>
            {item.type}
          </span>
          <span className="text-xs text-muted">📅 {formatDate(item.date)}</span>
        </div>

        <h2 className={`font-extrabold leading-snug group-hover:text-primary transition-colors ${
          hero ? "text-xl line-clamp-3 text-primary" : "text-lg line-clamp-2 text-foreground"
        }`}>
          {item.title}
        </h2>

        <p className={`text-sm leading-relaxed text-muted ${hero ? "line-clamp-4" : "line-clamp-3"}`}>
          {item.excerpt}
        </p>

        <div className="mt-auto flex items-center justify-between pt-2 border-t border-border/60">
          <span className="text-xs text-muted truncate">📍 {item.location}</span>
          <span className="shrink-0 text-xs font-semibold text-primary group-hover:underline ml-3">ดูรายละเอียด →</span>
        </div>
      </div>
    </Link>
  );
}

export default function ActivitiesPage() {
  const { activities } = useActivities();
  const pub = publishedActivities(activities);

  const types = useMemo(() => {
    const seen = new Set();
    const result = [];
    for (const a of pub) {
      if (!seen.has(a.type)) {
        seen.add(a.type);
        result.push({ name: a.type, color: a.typeColor });
      }
    }
    return result;
  }, [pub]);

  const [activeType, setActiveType] = useState("ทั้งหมด");

  const filtered = useMemo(
    () => activeType === "ทั้งหมด" ? pub : pub.filter((a) => a.type === activeType),
    [pub, activeType]
  );

  const [hero, ...rest] = filtered;

  if (pub.length === 0) {
    return (
      <div className="page-container py-24 text-center">
        <p className="text-5xl mb-4">🎪</p>
        <h1 className="text-xl font-bold text-foreground mb-2">ยังไม่มีกิจกรรมที่เผยแพร่</h1>
        <p className="text-sm text-muted">โปรดติดตามกิจกรรมจากสถาบันในเร็วๆ นี้</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">

      {/* ── Page header + type tabs ── */}
      <div className="bg-white border-b border-border">
        <div className="page-container pt-10 pb-0">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl mb-6">
            กิจกรรม
          </h1>

          <div className="flex gap-1.5 overflow-x-auto pb-px scrollbar-none -mx-4 px-4 md:mx-0 md:px-0">
            {[{ name: "ทั้งหมด" }, ...types].map(({ name }) => {
              const count = name === "ทั้งหมด" ? pub.length : pub.filter((a) => a.type === name).length;
              const active = activeType === name;
              return (
                <button
                  key={name}
                  onClick={() => setActiveType(name)}
                  className={`shrink-0 inline-flex items-center gap-1.5 rounded-t-xl border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
                    active
                      ? "border-primary text-primary bg-primary/5"
                      : "border-transparent text-muted hover:text-foreground hover:border-border"
                  }`}
                >
                  {name}
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
                    active ? "bg-primary text-white" : "bg-border text-muted"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="page-container py-8">
        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-4xl mb-3">🗂️</p>
            <p className="text-sm text-muted">ไม่มีกิจกรรมในหมวด "{activeType}" ขณะนี้</p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {hero && <ActivityCard item={hero} hero />}
            {rest.map((item) => (
              <ActivityCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
