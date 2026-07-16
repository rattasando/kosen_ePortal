"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { useNews } from "@/components/admin/NewsContext";
import { useActivities } from "@/components/admin/ActivitiesContext";
import { publishedNews, publishedActivities, formatDate } from "@/lib/newsUtils";
import { DEFAULT_BANNERS, BANNER_STORAGE_KEY, BANNER_SEED_KEY, BANNER_SEED_VER } from "@/lib/bannerData";

// ─── CONFIG ───────────────────────────────────────────────
const AUTOPLAY_MS = 6000;
const SWIPE_THRESHOLD = 50;
// ──────────────────────────────────────────────────────────

type SlideLayout = "hero" | "news" | "activity" | "news-single" | "activity-single";

interface BannerSliderProps { className?: string; }

interface Slide {
  id: string;
  layout: SlideLayout;
  eyebrow: string;
  headline: string;
  body?: string;
  ctaLabel: string;
  ctaHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  image: string;
  imagePosition?: string;
  status: "active" | "inactive";
  order: number;
  newsId?: string;
  badge?: string;
}

interface ContentProps {
  slide: Slide;
  animating: boolean;
  onPause: () => void;
  onResume: () => void;
}

// ── Read active slides from localStorage (fallback to defaults) ──
function useBannerSlides(): Slide[] {
  const [slides, setSlides] = useState<Slide[]>([]);

  useEffect(() => {
    const load = () => {
      try {
        const savedVer = localStorage.getItem(BANNER_SEED_KEY);
        const stored   = localStorage.getItem(BANNER_STORAGE_KEY);
        if (stored && savedVer === BANNER_SEED_VER) {
          const parsed: Slide[] = JSON.parse(stored);
          setSlides(parsed.filter((s) => s.status === "active").sort((a, b) => a.order - b.order));
          return;
        }
      } catch { /* fall through */ }
      setSlides((DEFAULT_BANNERS as Slide[]).filter((s) => s.status === "active").sort((a, b) => a.order - b.order));
    };
    load();

    const onStorage = (e: StorageEvent) => {
      if (e.key === BANNER_STORAGE_KEY) load();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return slides;
}

// ── Slide content renderers ────────────────────────────────
function HeroContent({ slide, animating, onPause, onResume }: ContentProps) {
  return (
    <div
      key={slide.id}
      className={`max-w-2xl transition-all duration-500 ${animating ? "translate-x-4 opacity-0" : "translate-x-0 opacity-100"}`}
    >
      <p className="mb-4 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-white/70">
        <span className="h-px w-8 bg-white/50" />
        {slide.eyebrow}
      </p>
      <h1 className="text-3xl font-extrabold leading-tight tracking-tight md:text-4xl lg:text-5xl">
        {slide.headline}
      </h1>
      {slide.body && <p className="mt-4 text-base text-white/80 md:text-lg max-w-2xl">{slide.body}</p>}
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href={slide.ctaHref} className="btn-primary text-base px-6 py-3" onMouseEnter={onPause} onMouseLeave={onResume}>
          {slide.ctaLabel}
        </Link>
        {slide.secondaryLabel && slide.secondaryHref && (
          <Link
            href={slide.secondaryHref}
            className="inline-flex items-center rounded-xl border border-white/30 px-6 py-3 text-base font-semibold text-white hover:bg-white/10 transition-colors"
            onMouseEnter={onPause}
            onMouseLeave={onResume}
          >
            {slide.secondaryLabel}
          </Link>
        )}
      </div>
    </div>
  );
}

function NewsContent({ slide, animating, onPause, onResume }: ContentProps) {
  const { news } = useNews();
  const pub = publishedNews(news);
  const [featured, latest] = pub.slice(0, 2);
  return (
    <div
      key={slide.id}
      className={`w-full transition-all duration-500 ${animating ? "translate-x-4 opacity-0" : "translate-x-0 opacity-100"}`}
    >
      <p className="mb-3 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-white/60">
        <span className="h-px w-6 bg-white/40" />
        {slide.eyebrow}
      </p>
      <div className="grid grid-cols-[3fr_2fr] gap-3 h-64">
        {/* Featured — left */}
        <Link
          href={`/news/${featured.id}`}
          className="group relative overflow-hidden rounded-2xl ring-1 ring-white/30 hover:ring-white/60 transition-all duration-200"
          onMouseEnter={onPause}
          onMouseLeave={onResume}
        >
          <Image src={featured.image} alt={featured.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="60vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute inset-0 p-4 flex flex-col justify-between">
            <span className="self-start inline-flex items-center gap-1 rounded-full bg-white/20 backdrop-blur-sm px-2.5 py-1 text-xs font-bold text-white border border-white/30">
              ★ เรื่องเด่น
            </span>
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${featured.catColor}`}>{featured.category}</span>
                <time className="text-sm font-bold text-white/90 rounded-full bg-black/30 backdrop-blur-sm px-2.5 py-0.5">{formatDate(featured.publishedAt)}</time>
              </div>
              <p className="text-xl font-extrabold text-white line-clamp-2 leading-snug">{featured.title}</p>
              <Link href={slide.ctaHref} className="mt-3 btn-primary inline-flex text-sm px-4 py-2" onMouseEnter={onPause} onMouseLeave={onResume}>
                {slide.ctaLabel}
              </Link>
            </div>
          </div>
        </Link>

        {/* Latest — right */}
        {latest && (
          <Link
            href={`/news/${latest.id}`}
            className="group relative overflow-hidden rounded-2xl border border-white/20 hover:border-white/40 transition-all duration-200"
            onMouseEnter={onPause}
            onMouseLeave={onResume}
          >
            <Image src={latest.image} alt={latest.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="40vw" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute inset-0 p-4 flex flex-col justify-between">
              <span className="self-start inline-flex items-center gap-1 rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 text-sm font-bold text-white border border-white/30">
                ล่าสุด
              </span>
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${latest.catColor}`}>{latest.category}</span>
                  <time className="text-sm font-bold text-white/90 rounded-full bg-black/30 backdrop-blur-sm px-2.5 py-0.5">{formatDate(latest.publishedAt)}</time>
                </div>
                <p className="text-base font-bold text-white line-clamp-3 leading-snug">{latest.title}</p>
              </div>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}

function ActivityContent({ slide, animating, onPause, onResume }: ContentProps) {
  const { activities } = useActivities();
  const pub = publishedActivities(activities);
  const [featured, latest] = pub.slice(0, 2);
  return (
    <div
      key={slide.id}
      className={`w-full transition-all duration-500 ${animating ? "translate-x-4 opacity-0" : "translate-x-0 opacity-100"}`}
    >
      <p className="mb-3 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-white/60">
        <span className="h-px w-6 bg-white/40" />
        {slide.eyebrow}
      </p>
      <div className="grid grid-cols-[3fr_2fr] gap-3 h-64">
        {/* Featured — left */}
        <Link
          href={`/activities/${featured.id}`}
          className="group relative overflow-hidden rounded-2xl ring-1 ring-white/30 hover:ring-white/60 transition-all duration-200"
          onMouseEnter={onPause}
          onMouseLeave={onResume}
        >
          <Image src={featured.image} alt={featured.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="60vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute inset-0 p-4 flex flex-col justify-between">
            <span className="self-start inline-flex items-center gap-1 rounded-full bg-white/20 backdrop-blur-sm px-2.5 py-1 text-xs font-bold text-white border border-white/30">
              ★ กิจกรรมเด่น
            </span>
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${featured.typeColor}`}>{featured.type}</span>
                <time className="text-sm font-bold text-white/90 rounded-full bg-black/30 backdrop-blur-sm px-2.5 py-0.5">{formatDate(featured.date)}</time>
                <span className="text-xs text-white/50">📍 {featured.location}</span>
              </div>
              <p className="text-xl font-extrabold text-white line-clamp-2 leading-snug">{featured.title}</p>
              <Link href={slide.ctaHref} className="mt-3 btn-primary inline-flex text-sm px-4 py-2" onMouseEnter={onPause} onMouseLeave={onResume}>
                {slide.ctaLabel}
              </Link>
            </div>
          </div>
        </Link>

        {/* Latest — right */}
        {latest && (
          <Link
            href={`/activities/${latest.id}`}
            className="group relative overflow-hidden rounded-2xl border border-white/20 hover:border-white/40 transition-all duration-200"
            onMouseEnter={onPause}
            onMouseLeave={onResume}
          >
            <Image src={latest.image} alt={latest.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="40vw" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute inset-0 p-4 flex flex-col justify-between">
              <span className="self-start inline-flex items-center gap-1 rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 text-sm font-bold text-white border border-white/30">
                ล่าสุด
              </span>
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${latest.typeColor}`}>{latest.type}</span>
                  <time className="text-sm font-bold text-white/90 rounded-full bg-black/30 backdrop-blur-sm px-2.5 py-0.5">{formatDate(latest.date)}</time>
                </div>
                <p className="text-base font-bold text-white line-clamp-3 leading-snug">{latest.title}</p>
                <p className="text-xs text-white/50 mt-1">📍 {latest.location}</p>
              </div>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}

function NewsSingleContent({ slide, animating, onPause, onResume }: ContentProps) {
  const { news: allNews } = useNews();
  const pub = publishedNews(allNews);
  // Look up by news.id first; fall back to index for legacy data
  const news = pub.find((n) => n.id === slide.newsId)
    ?? pub[parseInt(slide.newsId ?? "0", 10)]
    ?? pub[0];
  return (
    <div
      key={slide.id}
      className={`w-full transition-all duration-500 ${animating ? "translate-x-4 opacity-0" : "translate-x-0 opacity-100"}`}
    >
      <div className="flex items-center gap-3 mb-4">
        <span className={`rounded-full px-4 py-1.5 text-base font-bold ${news.catColor}`}>{news.category}</span>
        <time className="text-lg font-bold text-white/90 rounded-full bg-black/30 backdrop-blur-sm px-3 py-1">{formatDate(news.publishedAt)}</time>
      </div>
      <div className="flex items-end justify-between gap-10">
        <div className="min-w-0">
          {(() => {
            const text = slide.headline?.trim() || news.title;
            const long = text.length > 50;
            return (
              <h1 className={`font-extrabold leading-tight tracking-tight line-clamp-3 ${long ? "text-2xl md:text-3xl lg:text-4xl" : "text-3xl md:text-4xl lg:text-5xl"}`}>
                {text}
              </h1>
            );
          })()}
        </div>
        <Link
          href={slide.ctaHref || `/news/${news.id}`}
          className="btn-primary inline-flex shrink-0 text-base px-6 py-3"
          onMouseEnter={onPause}
          onMouseLeave={onResume}
        >
          {slide.ctaLabel || "อ่านข่าวเต็ม"}
        </Link>
      </div>
    </div>
  );
}

function ActivitySingleContent({ slide, animating, onPause, onResume }: ContentProps) {
  const { activities } = useActivities();
  const pub = publishedActivities(activities);
  const idx = parseInt(slide.newsId ?? "0", 10);
  const act = pub[idx] ?? pub[0];
  if (!act) return null;
  return (
    <div
      key={slide.id}
      className={`w-full transition-all duration-500 ${animating ? "translate-x-4 opacity-0" : "translate-x-0 opacity-100"}`}
    >
      <div className="flex items-center gap-3 mb-4">
        <span className={`rounded-full px-4 py-1.5 text-base font-bold ${act.typeColor}`}>{act.type}</span>
        <time className="text-lg font-bold text-white/90 rounded-full bg-black/30 backdrop-blur-sm px-3 py-1">{formatDate(act.date)}</time>
        <span className="text-base font-medium text-white/80">📍 {act.location}</span>
      </div>
      <div className="flex items-end justify-between gap-10">
        <div className="min-w-0">
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight md:text-4xl lg:text-5xl line-clamp-2">
            {act.title}
          </h1>
        </div>
        <Link
          href={`/activities/${act.id}`}
          className="btn-primary inline-flex shrink-0 text-base px-6 py-3"
          onMouseEnter={onPause}
          onMouseLeave={onResume}
        >
          ดูรายละเอียดกิจกรรม
        </Link>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────
export default function BannerSlider({ className = "" }: BannerSliderProps) {
  const slides = useBannerSlides();
  const { news: allNews } = useNews();
  const { activities: allActivities } = useActivities();
  const pubNews = publishedNews(allNews);
  const pubActs = publishedActivities(allActivities);

  const getSlideImage = (s: Slide) => {
    if (s.layout === "news-single") {
      const found = pubNews.find((n) => n.id === s.newsId) ?? pubNews[parseInt(s.newsId ?? "0", 10)];
      return found?.image ?? s.image;
    }
    if (s.layout === "activity-single") {
      const idx = parseInt(s.newsId ?? "0", 10);
      return pubActs[idx]?.image ?? s.image;
    }
    return s.image;
  };

  const [current, setCurrent]   = useState(0);
  const [animating, setAnimating] = useState(false);
  const [paused, setPaused]     = useState(false);
  const [hoveredDot, setHoveredDot] = useState<number | null>(null);

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const goTo = useCallback(
    (index: number) => {
      if (animating || index === current || slides.length === 0) return;
      setAnimating(true);
      setTimeout(() => {
        setCurrent(index);
        setAnimating(false);
      }, 400);
    },
    [animating, current, slides.length],
  );

  const next = useCallback(() => goTo((current + 1) % Math.max(slides.length, 1)), [current, goTo, slides.length]);
  const prev = useCallback(() => goTo((current - 1 + Math.max(slides.length, 1)) % Math.max(slides.length, 1)), [current, goTo, slides.length]);

  useEffect(() => {
    if (paused || slides.length <= 1) return;
    const id = setInterval(next, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [next, paused, slides.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > SWIPE_THRESHOLD) {
      if (deltaX < 0) next(); else prev();
    }
    touchStartX.current = null;
    touchStartY.current = null;
    setPaused(false);
  };

  const mouseStartX = useRef<number | null>(null);
  const isDragging = useRef(false);

  const handleMouseDown = (e: React.MouseEvent) => { mouseStartX.current = e.clientX; isDragging.current = true; setPaused(true); };
  const handleMouseUp   = (e: React.MouseEvent) => {
    if (!isDragging.current || mouseStartX.current === null) return;
    const deltaX = e.clientX - mouseStartX.current;
    if (Math.abs(deltaX) > SWIPE_THRESHOLD) { if (deltaX < 0) next(); else prev(); }
    mouseStartX.current = null; isDragging.current = false; setPaused(false);
  };
  const handleMouseLeave = () => { isDragging.current = false; mouseStartX.current = null; setPaused(false); };

  if (slides.length === 0) return null;

  const slide = slides[Math.min(current, slides.length - 1)];

  const effectiveBadge = (() => {
    if (slide.badge) return slide.badge;
    if (slide.layout === "news-single") {
      const linked = pubNews.find((n) => n.id === slide.newsId)
        ?? pubNews[parseInt(slide.newsId ?? "0", 10)];
      if (linked?.featured) return "เรื่องเด่น";
    }
    return "";
  })();

  const renderContent = () => {
    const props = { slide, animating, onPause: () => setPaused(true), onResume: () => setPaused(false) };
    if (slide.layout === "news")             return <NewsContent           {...props} />;
    if (slide.layout === "activity")         return <ActivityContent       {...props} />;
    if (slide.layout === "news-single")      return <NewsSingleContent     {...props} />;
    if (slide.layout === "activity-single")  return <ActivitySingleContent {...props} />;
    return                                          <HeroContent           {...props} />;
  };

  return (
    <section
      className={`relative overflow-hidden text-white select-none ${className}`}
      style={{ cursor: "grab" }}
      aria-label="Banner slider"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {/* Background images */}
      {slides.map((s, i) => (
        <div key={s.id} className="absolute inset-0 transition-opacity duration-700" style={{ opacity: i === current ? 1 : 0 }} aria-hidden={i !== current}>
          <Image src={getSlideImage(s)} alt="" fill priority={i === 0} className="object-cover" style={{ objectPosition: s.imagePosition ?? "center" }} sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />
        </div>
      ))}

      {/* Badge — top-left corner */}
      {effectiveBadge && (
        <div className="absolute top-6 left-8 z-20">
          <span className="inline-flex items-center gap-2 rounded-2xl px-5 py-2 text-sm font-extrabold shadow-lg tracking-wide" style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#fff", textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>
            ★ {effectiveBadge}
          </span>
        </div>
      )}

      {/* Slide content */}
      <div className="absolute inset-0 z-10 flex items-end">
        <div className="page-container w-full pb-16">
          {renderContent()}
        </div>
      </div>

      {/* Left arrow */}
      <button onClick={prev} aria-label="Previous slide"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        className="absolute left-4 top-1/2 z-10 -translate-y-1/2 flex h-14 w-14 items-center justify-center rounded-full bg-black/25 text-white/70 backdrop-blur-sm border border-white/10 hover:bg-white hover:text-primary hover:scale-110 hover:border-white transition-all duration-200 text-3xl leading-none">
        ‹
      </button>

      {/* Right arrow */}
      <button onClick={next} aria-label="Next slide"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        className="absolute right-4 top-1/2 z-10 -translate-y-1/2 flex h-14 w-14 items-center justify-center rounded-full bg-black/25 text-white/70 backdrop-blur-sm border border-white/10 hover:bg-white hover:text-primary hover:scale-110 hover:border-white transition-all duration-200 text-3xl leading-none">
        ›
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 flex items-center gap-1.5"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => { setPaused(false); setHoveredDot(null); }}
      >
        {slides.map((s, i) => {
          const isActive = i === current;
          const isHovered = hoveredDot === i;
          return (
            <button
              key={s.id}
              onClick={() => goTo(i)}
              onMouseEnter={() => setHoveredDot(i)}
              onMouseLeave={() => setHoveredDot(null)}
              aria-label={`Go to slide ${i + 1}`}
              className={`rounded-full transition-all duration-200 ${
                isActive
                  ? "h-3 w-8 bg-white"
                  : isHovered
                  ? "h-4 w-7 bg-white/90"
                  : "h-3 w-3 bg-white/40"
              }`}
            />
          );
        })}
      </div>
    </section>
  );
}
