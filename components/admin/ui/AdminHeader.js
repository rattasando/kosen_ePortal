"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { usePageTitle } from "@/components/admin/contexts/PageTitleContext";

export default function AdminHeader() {
  const { title, description } = usePageTitle();
  const [username, setUsername] = useState("admin");
  const [open, setOpen] = useState(false);

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

      {/* Right: profile dropdown */}
      <div
        className="relative shrink-0"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        {/* Avatar button */}
        <button className="flex items-center gap-2 rounded-lg border border-border bg-surface-muted px-2.5 py-1.5 transition-colors hover:border-primary">
          <span className="flex h-6 w-6 items-center justify-center rounded-full gradient-hero text-[11px] font-bold text-white shrink-0">
            {username.charAt(0).toUpperCase()}
          </span>
          <span className="hidden sm:inline text-sm font-medium text-foreground">{username}</span>
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-3.5 w-3.5 text-muted transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>

        {/* Dropdown — pt-2 ป้องกัน gap ทำให้ mouse leave กลางทาง */}
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
    </header>
  );
}
