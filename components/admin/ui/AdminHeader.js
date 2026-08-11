"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useLanguage } from "@/components/admin/contexts/LanguageContext";
import { usePageTitle } from "@/components/admin/contexts/PageTitleContext";

export default function AdminHeader() {
  const { lang, switchLang, t } = useLanguage();
  const { title, description } = usePageTitle();
  const [username, setUsername] = useState("admin");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("kosen_remember_user");
      if (saved) setUsername(saved);
    } catch { /* ignore */ }
  }, []);

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
  };

  return (
    <header className="flex h-[65px] shrink-0 items-center justify-between border-b border-border bg-surface px-5">
      {/* Left: page title */}
      <div className="min-w-0 mr-4">
        {title && (
          <div className="flex flex-col gap-0.5">
            <h1 className="text-xl font-extrabold tracking-tight text-foreground leading-none">{title}</h1>
            {description && <p className="hidden lg:block text-xs text-muted">{description}</p>}
          </div>
        )}
      </div>

      {/* Right: back to site + lang toggle + user info + logout */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Back to website */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted hover:bg-surface-muted hover:text-foreground transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          {t("header.backToSite")}
        </Link>

        {/* Language toggle */}
        <div className="flex items-center rounded-lg border border-border overflow-hidden">
          {["th", "en"].map((l) => (
            <button key={l} onClick={() => switchLang(l)}
              className={`px-3 py-1.5 text-xs font-semibold uppercase transition-colors ${
                lang === l
                  ? "bg-primary text-white"
                  : "text-muted hover:bg-surface-muted hover:text-foreground"
              }`}>
              {l}
            </button>
          ))}
        </div>

        <div className="h-5 w-px bg-border" />

        <div className="flex items-center gap-2.5 rounded-lg border border-border bg-surface-muted px-3 py-1.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-full gradient-hero text-[11px] font-bold text-white shrink-0">
            {username.charAt(0).toUpperCase()}
          </span>
          <span className="text-sm font-medium text-foreground">{username}</span>
          <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">Admin</span>
        </div>

        <button
          onClick={handleLogout}
          className="rounded-lg border border-border px-3 py-2 text-sm font-semibold text-muted hover:border-red-400 hover:text-red-500 transition-colors"
        >
          ออกจากระบบ
        </button>
      </div>
    </header>
  );
}
