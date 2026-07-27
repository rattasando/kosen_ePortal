"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSyncExternalStore, useMemo, useState } from "react";
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

  const authed = useSyncExternalStore(
    (cb) => { window.addEventListener("storage", cb); return () => window.removeEventListener("storage", cb); },
    () => localStorage.getItem("kosen_auth") === "1",
    () => false,
  );

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
            <>
              <Link href="/admin" className="rounded-lg px-4 py-2 text-sm font-semibold text-white bg-primary hover:opacity-90 transition-opacity whitespace-nowrap">
                {t("nav.portal")}
              </Link>
              <button
                onClick={() => { localStorage.removeItem("kosen_auth"); window.dispatchEvent(new Event("storage")); }}
                className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-muted hover:border-red-400 hover:text-red-500 transition-colors whitespace-nowrap"
              >
                ออกจากระบบ
              </button>
            </>
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
