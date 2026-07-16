"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  DEFAULT_SPLASH,
  SPLASH_STORAGE_KEY,
  SPLASH_SEED_KEY,
  SPLASH_SEED_VER,
  SPLASH_SEEN_SESSION_KEY,
  SPLASH_SEEN_DATE_KEY,
} from "@/lib/splashData";

const WIDTH_MAP = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
};

const RADIUS_MAP = {
  none: "rounded-none",
  lg:   "rounded-lg",
  "2xl": "rounded-2xl",
  "3xl": "rounded-3xl",
};

function shouldShow(config) {
  if (!config.enabled) return false;
  try {
    // ปุ่ม "ไม่แสดงอีกในวันนี้" override ทุก frequency
    const seenDate = localStorage.getItem(SPLASH_SEEN_DATE_KEY);
    if (seenDate === new Date().toDateString()) return false;

    if (config.showFrequency === "always") return true;
    if (config.showFrequency === "once_per_session") {
      return !sessionStorage.getItem(SPLASH_SEEN_SESSION_KEY);
    }
    if (config.showFrequency === "once_per_day") return true;
  } catch { /* ignore */ }
  return true;
}

function markSeen(config) {
  try {
    if (config.showFrequency === "once_per_session") {
      sessionStorage.setItem(SPLASH_SEEN_SESSION_KEY, "1");
    }
    if (config.showFrequency === "once_per_day") {
      localStorage.setItem(SPLASH_SEEN_DATE_KEY, new Date().toDateString());
    }
  } catch { /* ignore */ }
}

export default function SplashOverlay() {
  const [config, setConfig] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // โหลด config จาก localStorage
    let cfg = DEFAULT_SPLASH;
    try {
      const savedVer = localStorage.getItem(SPLASH_SEED_KEY);
      const stored   = localStorage.getItem(SPLASH_STORAGE_KEY);
      if (stored && savedVer === SPLASH_SEED_VER) {
        cfg = { ...DEFAULT_SPLASH, ...JSON.parse(stored) };
      }
    } catch { /* use default */ }

    setConfig(cfg);

    if (!shouldShow(cfg)) return;

    const timer = setTimeout(() => {
      setVisible(true);
      markSeen(cfg);
    }, cfg.delayMs ?? 500);

    return () => clearTimeout(timer);
  }, []);

  const close = () => setVisible(false);

  const closeForToday = () => {
    try {
      localStorage.setItem(SPLASH_SEEN_DATE_KEY, new Date().toDateString());
    } catch { /* ignore */ }
    setVisible(false);
  };

  useEffect(() => {
    if (!visible) return;
    const onKey = (e) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible]);

  if (!visible || !config) return null;

  const widthCls  = WIDTH_MAP[config.width]  ?? WIDTH_MAP.md;
  const radiusCls = RADIUS_MAP[config.radius] ?? RADIUS_MAP["2xl"];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
    >
      <div
        className={`relative w-full ${widthCls} ${radiusCls} overflow-hidden bg-surface shadow-2xl animate-in fade-in zoom-in-95 duration-200 ${config.border !== false ? "border border-border" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={close}
          aria-label="ปิด"
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>

        {/* Image — ใช้ img ธรรมดาเพื่อให้ popup ยืดตามสัดส่วนรูปจริง */}
        {config.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={config.image}
            alt={config.title || "Splash"}
            className="block w-full"
          />
        )}

        {/* Content */}
        {(config.title || config.body || (config.ctaLabel && config.ctaHref)) && (
          <div className="p-5">
            {config.title && (
              <p className="text-lg font-extrabold leading-snug text-foreground">{config.title}</p>
            )}
            {config.body && (
              <p className="mt-2 text-sm text-muted leading-relaxed">{config.body}</p>
            )}
            {config.ctaLabel && config.ctaHref && (
              <div className="mt-4">
                <Link href={config.ctaHref} onClick={close} className="btn-primary">
                  {config.ctaLabel}
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Don't show today footer */}
        <div className="flex justify-center border-t border-border/50 px-5 py-3">
          <button
            onClick={closeForToday}
            className="text-xs text-muted hover:text-foreground transition-colors underline underline-offset-2"
          >
            ไม่แสดงอีกในวันนี้
          </button>
        </div>
      </div>
    </div>
  );
}
