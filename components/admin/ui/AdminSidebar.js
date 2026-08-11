"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { adminNav } from "@/lib/config/navigation";

function isActive(pathname, href, children) {
  if (href === "/admin") return pathname === "/admin";
  if (children?.length) {
    return pathname === href || children.some((c) => pathname === c.href || pathname.startsWith(`${c.href}/`));
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

// Flyout — ใช้ position:fixed เพื่อหนีจาก overflow-hidden ของ layout
function FlyoutPanel({ flyout, pathname, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!flyout) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [flyout, onClose]);

  if (!flyout) return null;
  const { section, top, left } = flyout;

  return (
    <div
      ref={ref}
      style={{ top, left: left + 8 }}
      className="fixed z-50 min-w-[200px] overflow-hidden rounded-xl border border-border bg-surface shadow-xl"
    >
      <div className="flex items-center gap-2 border-b border-border bg-surface-muted px-3 py-2.5">
        <span className="text-base">{section.icon}</span>
        <p className="text-xs font-bold uppercase tracking-wider text-muted">{section.label}</p>
      </div>
      <div className="p-1.5 space-y-0.5">
        <Link
          href={section.href}
          onClick={onClose}
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
            pathname === section.href
              ? "bg-accent-soft text-primary"
              : "text-foreground hover:bg-surface-muted"
          }`}
        >
          ภาพรวม
        </Link>
        {section.children?.map((item) => {
          const childActive = pathname === item.href ||
            (item.href !== section.href && pathname.startsWith(`${item.href}/`));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                childActive
                  ? "bg-accent-soft font-semibold text-primary"
                  : "text-muted hover:bg-surface-muted hover:text-foreground"
              }`}
            >
              {childActive && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

const PINNED_KEY     = "kosen_sidebar_pinned";
const SCROLL_KEY     = "kosen_sidebar_scroll";

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  // pinned = ขยายค้างถาวร, hovered = ขยายชั่วคราวเมื่อ hover
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [flyout, setFlyout] = useState(null);
  const sidebarRef = useRef(null);
  const navRef = useRef(null);

  const isExpanded = pinned || hovered;
  // ref สำหรับ guard ใน onScroll handler (ไม่ stale ใน closure)
  const isExpandedRef = useRef(false);
  isExpandedRef.current = isExpanded;

  // โหลดสถานะ pinned จาก localStorage ครั้งแรก
  useEffect(() => {
    try {
      if (localStorage.getItem(PINNED_KEY) === "1") setPinned(true);
    } catch { /* ignore */ }
  }, []);

  // restore scroll ทุกครั้งที่ sidebar ขยาย หรือ pathname เปลี่ยน
  // ใช้ rAF เพื่อรอให้ DOM render + expand เสร็จก่อนกำหนด scrollTop
  useEffect(() => {
    if (!isExpanded) return;
    const raf = requestAnimationFrame(() => {
      try {
        const saved = sessionStorage.getItem(SCROLL_KEY);
        if (saved && navRef.current) navRef.current.scrollTop = parseInt(saved, 10);
      } catch { /* ignore */ }
    });
    return () => cancelAnimationFrame(raf);
  }, [isExpanded, pathname]);

  // ปิด flyout เมื่อ route เปลี่ยน
  useEffect(() => {
    setFlyout(null);
  }, [pathname]);

  const handleCollapsedClick = (e, section) => {
    e.preventDefault();
    if (!section.children?.length) {
      router.push(section.href);
      return;
    }
    if (flyout?.section.label === section.label) {
      setFlyout(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const sidebarRect = sidebarRef.current.getBoundingClientRect();
    setFlyout({ section, top: rect.top, left: sidebarRect.right });
  };

  const handleMouseEnter = () => {
    setHovered(true);
    setFlyout(null);
  };

  const handleMouseLeave = () => {
    setHovered(false);
  };

  const handlePin = () => {
    setPinned(true);
    try { localStorage.setItem(PINNED_KEY, "1"); } catch { /* ignore */ }
  };
  const handleUnpin = () => {
    setPinned(false);
    setHovered(false);
    try { localStorage.removeItem(PINNED_KEY); } catch { /* ignore */ }
  };

  const handleNavScroll = () => {
    // บันทึกเฉพาะตอน expanded เพื่อกัน browser reset scrollTop=0 ตอนหุบ ทับค่าเดิม
    if (!isExpandedRef.current) return;
    try {
      if (navRef.current) sessionStorage.setItem(SCROLL_KEY, String(navRef.current.scrollTop));
    } catch { /* ignore */ }
  };

  return (
    <>
      <aside
        ref={sidebarRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`flex h-screen shrink-0 flex-col border-r border-border bg-surface transition-all duration-200 ${
          isExpanded ? "w-72" : "w-16"
        }`}
      >
        {/* ── Header ── */}
        <div className={`flex h-[65px] shrink-0 items-center border-b border-border ${isExpanded ? "justify-between px-5" : "justify-center"}`}>
          {isExpanded ? (
            <>
              <Link href="/admin" className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg gradient-hero text-sm font-bold text-white">
                  K
                </span>
                <div className="min-w-0 overflow-hidden">
                  <p className="truncate text-sm font-bold text-foreground">Admin Portal</p>
                  <p className="truncate text-xs text-muted">Management System</p>
                </div>
              </Link>

              <div className="flex items-center gap-1">
                {/* Lock / Unlock button */}
                <button
                  onClick={pinned ? handleUnpin : handlePin}
                  title={pinned ? "ปลดล็อค (sidebar จะหุบเมื่อเลื่อนเมาส์ออก)" : "ล็อค sidebar ให้เปิดค้างไว้"}
                  className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                    pinned
                      ? "text-primary hover:bg-accent-soft"
                      : "text-muted hover:bg-surface-muted hover:text-foreground"
                  }`}
                >
                  {pinned ? (
                    /* ล็อคอยู่ */
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    /* ปลดล็อคอยู่ */
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z" />
                    </svg>
                  )}
                </button>
                {/* ← ปิด sidebar */}
                <button
                  onClick={handleUnpin}
                  title="ซ่อน sidebar"
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:bg-surface-muted hover:text-foreground transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </>
          ) : (
            /* Collapsed: K button = pin to expand */
            <button
              onClick={handlePin}
              title="คลิกเพื่อปักหมุด sidebar ให้เปิดค้างไว้"
              className="flex h-9 w-9 items-center justify-center rounded-lg gradient-hero text-sm font-bold text-white hover:opacity-90 transition-opacity"
            >
              K
            </button>
          )}
        </div>

        {/* ── Nav ── */}
        <nav ref={navRef} onScroll={handleNavScroll} className="flex-1 overflow-y-auto overflow-x-hidden p-2">
          {adminNav.map((section) => {
            const active = isActive(pathname, section.href, section.children);
            const flyoutOpen = flyout?.section.label === section.label;

            return (
              <div key={section.label} className="mb-1">
                {isExpanded ? (
                  <>
                    {section.children?.length ? (
                      <div className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold ${
                        active ? "text-primary" : "text-muted"
                      }`}>
                        <span className="shrink-0 text-base leading-none">{section.icon}</span>
                        <span className="truncate">{section.label}</span>
                      </div>
                    ) : (
                      <Link
                        href={section.href}
                        className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                          active ? "bg-accent-soft text-primary" : "text-foreground hover:bg-surface-muted"
                        }`}
                      >
                        <span className="shrink-0 text-base leading-none">{section.icon}</span>
                        <span className="truncate">{section.label}</span>
                      </Link>
                    )}
                    {section.children && (
                      <ul className="ml-3 mt-0.5 space-y-0.5 border-l border-border pl-3">
                        {section.children.map((item) => {
                          const childActive = pathname === item.href ||
                            (item.href !== section.href && pathname.startsWith(`${item.href}/`));
                          return (
                            <li key={item.href}>
                              <Link
                                href={item.href}
                                className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors ${
                                  childActive
                                    ? "bg-accent-soft font-semibold text-primary"
                                    : "text-muted hover:bg-surface-muted hover:text-foreground"
                                }`}
                              >
                                {childActive && (
                                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                                )}
                                {item.label}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </>
                ) : (
                  /* Collapsed: icon button → flyout */
                  <button
                    onClick={(e) => handleCollapsedClick(e, section)}
                    title={section.label}
                    className={`flex w-full items-center justify-center rounded-lg p-2.5 transition-colors ${
                      active || flyoutOpen
                        ? "bg-accent-soft text-primary"
                        : "text-foreground hover:bg-surface-muted"
                    }`}
                  >
                    <span className="text-lg leading-none">{section.icon}</span>
                  </button>
                )}
              </div>
            );
          })}
        </nav>

      </aside>

      <FlyoutPanel flyout={flyout} pathname={pathname} onClose={() => setFlyout(null)} />
    </>
  );
}
