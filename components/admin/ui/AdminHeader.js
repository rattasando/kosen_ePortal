"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { usePageTitle } from "@/components/admin/contexts/PageTitleContext";

// ── DB status pill ─────────────────────────────────────────────────────────────
function DbStatus() {
  const [status, setStatus]   = useState("checking");
  const [latency, setLatency] = useState(null);
  const [tip, setTip]         = useState(false);

  const [lastChecked, setLastChecked] = useState(null);
  const [checking, setChecking]       = useState(false);

  const check = useCallback(async (skipHiddenCheck = false) => {
    if (!skipHiddenCheck && document.hidden) return;
    setChecking(true);
    try {
      const res  = await fetch("/api/health", { cache: "no-store" });
      const data = await res.json();
      if (data.ok) { setStatus("ok"); setLatency(data.latency); }
      else          { setStatus("error"); setLatency(null); }
    } catch { setStatus("error"); setLatency(null); }
    setLastChecked(new Date());
    setChecking(false);
  }, []);

  useEffect(() => {
    check(true);
    const id = setInterval(check, 60_000);
    const onVisible = () => { if (!document.hidden) check(true); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", onVisible); };
  }, [check]);

  const dotCls =
    status === "checking" ? "bg-amber-400 animate-pulse" :
    status === "ok"       ? "bg-emerald-500" :
                            "bg-red-500 animate-pulse";

  const pillCls =
    status === "checking" ? "border-amber-200 bg-amber-50 text-amber-700" :
    status === "ok"       ? "border-emerald-200 bg-emerald-50 text-emerald-700" :
                            "border-red-200 bg-red-50 text-red-600";

  const statusRows = [
    {
      label: "สถานะการเชื่อมต่อ",
      value: status === "checking" ? "กำลังตรวจสอบ"
           : status === "ok"       ? "ปกติ"
           :                         "ขัดข้อง",
      color: status === "checking" ? "text-amber-600"
           : status === "ok"       ? "text-emerald-600"
           :                         "text-red-600",
    },
    {
      label: "ความหน่วง (Latency)",
      value: latency != null ? `${latency} ms` : "—",
    },
    {
      label: "ตรวจสอบล่าสุด",
      value: lastChecked
        ? lastChecked.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
        : "—",
    },
    {
      label: "ตรวจสอบอัตโนมัติ",
      value: "ทุก 60 วินาที",
    },
  ];

  return (
    <div
      className="relative shrink-0"
      onMouseEnter={() => setTip(true)}
      onMouseLeave={() => setTip(false)}
    >
      {/* Pill */}
      <div className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium select-none cursor-default ${pillCls}`}>
        <span className={`h-2 w-2 rounded-full shrink-0 ${dotCls}`} />
        <span>สถานะฐานข้อมูล</span>
      </div>

      {/* Tooltip on hover */}
      {tip && (
        <div className="absolute right-0 top-full z-50 w-64 pt-1.5">
          <div className="rounded-xl border border-border bg-surface shadow-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border bg-surface-muted">
              <p className="text-xs font-semibold text-foreground">สถานะฐานข้อมูล</p>
              <button
                type="button"
                onClick={() => check(true)}
                disabled={checking}
                className="flex items-center gap-1 text-[11px] text-primary hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 ${checking ? "animate-spin" : ""}`} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                {checking ? "กำลังตรวจสอบ" : "รีเฟรช"}
              </button>
            </div>
            {/* Rows */}
            <div className="divide-y divide-border">
              {statusRows.map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between px-3.5 py-2 gap-3">
                  <span className="text-[11px] text-muted shrink-0">{label}</span>
                  <span className={`text-[11px] font-medium text-right truncate ${color ?? "text-foreground"}`}>{value}</span>
                </div>
              ))}
            </div>

            {/* Legend — 3 สถานะ */}
            <div className="border-t border-border bg-surface-muted px-3.5 py-2.5 space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted mb-1">สถานะที่เป็นไปได้</p>
              {[
                { dot: "bg-emerald-500",              label: "ปกติ",          desc: "เชื่อมต่อฐานข้อมูลสำเร็จ" },
                { dot: "bg-amber-400 animate-pulse",  label: "กำลังตรวจสอบ", desc: "รอผลการเชื่อมต่อ" },
                { dot: "bg-red-500 animate-pulse",    label: "ขัดข้อง",       desc: "ไม่สามารถเชื่อมต่อได้" },
              ].map(({ dot, label, desc }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full shrink-0 ${dot}`} />
                  <span className="text-[11px] font-medium text-foreground w-20 shrink-0">{label}</span>
                  <span className="text-[11px] text-muted">{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── AdminHeader ────────────────────────────────────────────────────────────────
export default function AdminHeader() {
  const { title, description } = usePageTitle();
  const [username, setUsername] = useState("admin");
  const [open, setOpen]         = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("kosen_remember_user");
      if (saved) setUsername(saved);
    } catch { /* ignore */ }
  }, []);

  return (
    <header className="flex h-[65px] shrink-0 items-center justify-between border-b border-border bg-surface px-4 sm:px-5 gap-3">
      {/* Left: page title */}
      <div className="min-w-0 flex-1">
        {title && (
          <div className="flex flex-col gap-0.5">
            <h1 className="truncate text-lg sm:text-xl font-extrabold tracking-tight text-foreground leading-none">{title}</h1>
            {description && <p className="hidden lg:block text-xs text-muted">{description}</p>}
          </div>
        )}
      </div>

      {/* Right: db status + profile dropdown */}
      <div className="flex items-center gap-2 shrink-0">

        {/* DB status */}
        <DbStatus />

        {/* Profile dropdown */}
        <div
          className="relative"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          <button className="flex items-center gap-2 rounded-lg border border-border bg-surface-muted px-2.5 py-1.5 transition-colors hover:border-primary">
            <span className="flex h-6 w-6 items-center justify-center rounded-full gradient-hero text-[11px] font-bold text-white shrink-0">
              {username.charAt(0).toUpperCase()}
            </span>
            <span className="hidden sm:inline text-sm font-medium text-foreground">{username}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-3.5 w-3.5 text-muted transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>

          {open && (
            <div className="absolute right-0 top-full w-44 pt-2 z-50">
              <div className="rounded-xl border border-border bg-surface shadow-lg overflow-hidden">
                <Link
                  href="/"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-surface-muted transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-muted shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                  </svg>
                  เว็บหน้าหลัก
                </Link>
                <div className="border-t border-border" />
                <button
                  onClick={() => { setOpen(false); signOut({ callbackUrl: "/login" }); }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  ออกจากระบบ
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
