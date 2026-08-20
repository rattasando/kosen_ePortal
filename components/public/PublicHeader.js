"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useMemo, useRef, useState } from "react";
import { publicNav } from "@/lib/config/navigation";
import { usePublicLanguage } from "@/components/public/PublicLanguageContext";
import { useNews } from "@/components/admin/contexts/NewsContext";
import { publishedNews } from "@/lib/utils/newsUtils";
import { DOCUMENT_CATEGORIES } from "@/lib/data/documentsData";

function NavItem({ item, active, label, pathname, dropdownLinks }) {
  const [open, setOpen] = useState(false);
  const hasDropdown = dropdownLinks && dropdownLinks.length > 0;
  return (
    <div
      className="relative flex items-stretch"
      onMouseEnter={() => hasDropdown && setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <Link
        href={item.href}
        onClick={(e) => {
          if (pathname === item.href) {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        }}
        className={`shrink-0 flex items-center gap-1 px-5 whitespace-nowrap transition-all duration-200 border-b-[3px] text-lg ${
          active
            ? "border-primary text-primary font-bold bg-primary/5"
            : "border-transparent text-muted font-semibold hover:text-foreground hover:bg-surface-muted"
        }`}
      >
        {label}
      </Link>

      {hasDropdown && open && (
        <div className="absolute top-full left-0 z-50 pt-1" style={{ minWidth: "200px" }}>
          <div className="rounded-2xl border border-border bg-white shadow-xl py-2">
            {dropdownLinks.map((link, i) =>
              link.divider ? (
                <div key={`div-${i}`} className="my-1.5 border-t border-border/60" />
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block px-5 py-3 text-base hover:bg-primary/5 hover:text-primary transition-colors ${
                    link.bold ? "font-bold text-foreground" : "text-muted"
                  }`}
                >
                  {link.label}
                </Link>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PublicHeader() {
  const pathname = usePathname();
  const { lang, switchLang, t } = usePublicLanguage();

  const { news } = useNews();
  const newsDropdownLinks = useMemo(() => {
    const pub = publishedNews(news);
    const seen = new Set();
    const cats = [];
    for (const n of pub) {
      if (!seen.has(n.category)) {
        seen.add(n.category);
        cats.push(n.category);
      }
    }
    if (cats.length === 0) return [];
    return [
      { label: "ทั้งหมด", href: "/news", bold: true },
      { label: "", href: "", divider: true },
      ...cats.map((cat) => ({ label: cat, href: `/news?cat=${encodeURIComponent(cat)}` })),
    ];
  }, [news]);

  const docDropdownLinks = useMemo(() => [
    { label: "ทั้งหมด", href: "/documents", bold: true },
    { label: "", href: "", divider: true },
    ...DOCUMENT_CATEGORIES.map((c) => ({ label: c.label, href: `/documents?cat=${c.id}` })),
  ], []);

  const marketplaceDropdownLinks = [
    { label: "ทั้งหมด",             href: "/marketplace",               bold: true },
    { label: "", href: "", divider: true },
    { label: "🎓 ฝึกงาน",           href: "/marketplace?type=ฝึกงาน" },
    { label: "💼 ตำแหน่งงานประจำ",  href: "/marketplace?type=งานประจำ" },
    { label: "", href: "", divider: true },
    { label: "🏢 รายชื่อบริษัท",    href: "/marketplace/companies" },
  ];

  const { data: session, status } = useSession();
  const authed = status === "authenticated";
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const isActive = (href) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/95 backdrop-blur-md shadow-sm">
      <div className="w-full px-5 md:px-8 grid grid-cols-[auto_1fr_auto] items-center gap-6" style={{ height: "5rem" }}>

        {/* Logo */}
        <Link
          href="/"
          onClick={(e) => {
            if (pathname === "/") {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
          className="flex items-center gap-3 shrink-0"
        >
          <div className="relative h-11 w-11 shrink-0">
            <Image src="/logo/kosen.png" alt="KOSEN Logo" fill className="object-contain" />
          </div>
          <p className="hidden lg:block text-base font-bold leading-tight text-foreground whitespace-nowrap">
            {lang === "th" ? "โครงการไทย-โคเซ็น" : "Thai-KOSEN"}
          </p>
        </Link>

        {/* Nav — centered */}
        <nav className="hidden md:flex justify-center self-stretch">
          <div className="flex items-stretch gap-1">
            {publicNav.map((item) => {
              const active = isActive(item.href);
              const dropdownLinks =
                item.href === "/news"        ? newsDropdownLinks :
                item.href === "/documents"   ? docDropdownLinks :
                item.href === "/marketplace" ? marketplaceDropdownLinks :
                null;
              return (
                <NavItem
                  key={item.href}
                  item={item}
                  active={active}
                  label={t(item.labelKey)}
                  pathname={pathname}
                  dropdownLinks={dropdownLinks}
                />
              );
            })}
          </div>
        </nav>

        {/* Right: lang toggle + login */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center rounded-lg border border-border overflow-hidden">
            {["th", "en"].map((l) => (
              <button key={l} onClick={() => switchLang(l)}
                className={`px-3 py-1.5 text-sm font-semibold uppercase transition-colors ${
                  lang === l
                    ? "bg-primary text-white"
                    : "text-muted hover:bg-surface-muted hover:text-foreground"
                }`}>
                {l}
              </button>
            ))}
          </div>

          {authed ? (
            <div
              className="relative"
              ref={profileRef}
              onMouseEnter={() => setProfileOpen(true)}
              onMouseLeave={() => setProfileOpen(false)}
            >
              {/* Avatar button */}
              <button className="flex items-center gap-2 rounded-full border border-border bg-surface-muted px-2 py-1.5 transition-colors hover:border-primary">
                <span className="flex h-7 w-7 items-center justify-center rounded-full gradient-hero text-[12px] font-bold text-white shrink-0">
                  {(session.user?.name || "?").charAt(0).toUpperCase()}
                </span>
                <span className="hidden sm:inline text-sm font-medium text-foreground pr-1 whitespace-nowrap">
                  {session.user?.name}
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-3.5 w-3.5 text-muted transition-transform mr-0.5 ${profileOpen ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>

              {/* Dropdown — pt-2 แทน mt-2 เพื่อไม่ให้มี gap ที่ทำให้ mouse leave */}
              {profileOpen && (
                <div className="absolute right-0 top-full w-44 pt-2 z-50">
                <div className="rounded-xl border border-border bg-white shadow-xl overflow-hidden">
                  <Link
                    href="/admin"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-3 text-sm text-foreground hover:bg-primary/5 hover:text-primary transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-muted shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
                    </svg>
                    ePortal
                  </Link>
                  <div className="border-t border-border" />
                  <button
                    onClick={() => { setProfileOpen(false); signOut({ callbackUrl: "/" }); }}
                    className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors"
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
          ) : (
            <Link href="/login" className="rounded-lg px-4 py-2 text-sm font-semibold text-white bg-primary hover:opacity-90 transition-opacity whitespace-nowrap">
              {t("nav.login")}
            </Link>
          )}
        </div>
      </div>

      {/* ── Mobile nav ── */}
      <nav className="flex gap-1 overflow-x-auto border-t border-border px-4 py-2 md:hidden">
        {publicNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              isActive(item.href)
                ? "bg-primary text-white font-semibold"
                : "bg-surface-muted text-muted"
            }`}
          >
            {t(item.labelKey)}
          </Link>
        ))}
      </nav>

    </header>
  );
}
