"use client";

import { useMemo, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useNews } from "@/components/admin/NewsContext";
import { formatDate, estimatedReadTime, publishedNews } from "@/lib/newsUtils";

function NewsCard({ item, featured = false }) {
  return (
    <Link
      href={`/news/${item.id}`}
      className={`group flex flex-col overflow-hidden rounded-2xl border border-border bg-white transition-shadow hover:shadow-lg ${
        featured ? "ring-2 ring-primary/40 shadow-lg shadow-primary/10" : ""
      }`}
    >
      <div className={`relative w-full shrink-0 overflow-hidden bg-slate-100 ${featured ? "min-h-[260px]" : "min-h-[260px]"}`}>
        {item.image ? (
          <Image
            src={item.image}
            alt={item.title}
            fill
            priority={featured}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl text-slate-300">📰</div>
        )}
        {item.featured && (
          <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full px-3.5 py-1.5 text-sm font-extrabold text-white shadow-md" style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}>
            ★ ข่าวเด่น
          </span>
        )}
        {featured && !item.featured && (
          <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full gradient-hero px-3.5 py-1.5 text-sm font-extrabold text-white shadow-md">
            ✦ ใหม่ล่าสุด
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-6">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`rounded-full px-3.5 py-1 text-sm font-bold ${item.catColor}`}>
            {item.category}
          </span>
          <time className="text-sm font-semibold text-muted">{formatDate(item.publishedAt)}</time>
        </div>

        <h2 className={`font-extrabold leading-snug group-hover:text-primary transition-colors ${
          featured ? "text-xl line-clamp-3 text-primary" : "text-lg line-clamp-2 text-foreground"
        }`}>
          {item.title}
        </h2>

        <p className={`text-sm leading-relaxed text-muted ${featured ? "line-clamp-4" : "line-clamp-3"}`}>
          {item.excerpt}
        </p>

        <div className="mt-auto flex items-center justify-between pt-2 border-t border-border/60">
          <span className="text-xs text-muted">✍️ {item.author}</span>
          <div className="flex items-center gap-3 text-xs text-muted">
            <span>⏱️ {estimatedReadTime(item.blocks)}</span>
            <span className="font-semibold text-primary group-hover:underline">อ่านต่อ →</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function NewsContent() {
  const { news } = useNews();
  const pub = publishedNews(news);

  const searchParams = useSearchParams();
  const activeCat = searchParams.get("cat") ?? "ทั้งหมด";

  const filtered = useMemo(
    () => activeCat === "ทั้งหมด" ? pub : pub.filter((n) => n.category === activeCat),
    [pub, activeCat]
  );

  if (pub.length === 0) {
    return (
      <div className="page-container py-24 text-center">
        <p className="text-5xl mb-4">📰</p>
        <h1 className="text-xl font-bold text-foreground mb-2">ยังไม่มีข่าวที่เผยแพร่</h1>
        <p className="text-sm text-muted">โปรดติดตามข่าวสารจากสถาบันในเร็วๆ นี้</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">

      {/* ── Page header ── */}
      <div className="bg-white border-b border-border">
        <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12 pt-10 pb-8">
          <div className="flex items-baseline gap-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
              ข่าวสาร
            </h1>
            <span className="text-xl font-semibold text-muted md:text-2xl">/ {activeCat}</span>
          </div>
          <p className="mt-1 text-sm text-muted">{filtered.length} รายการ</p>
        </div>
      </div>

      <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12 py-8">
        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-4xl mb-3">🗂️</p>
            <p className="text-sm text-muted">ไม่มีข่าวในหมวด "{activeCat}" ขณะนี้</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((item, idx) => (
              <NewsCard key={item.id} item={item} featured={idx === 0} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function NewsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <NewsContent />
    </Suspense>
  );
}
