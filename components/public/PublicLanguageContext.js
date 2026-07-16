"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { translations } from "@/lib/i18n";

const PublicLanguageContext = createContext(null);

export function PublicLanguageProvider({ children }) {
  const [lang, setLang] = useState("th");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("kosen_lang");
      if (saved === "en" || saved === "th") setLang(saved);
    } catch { /* ignore */ }
  }, []);

  const switchLang = (l) => {
    setLang(l);
    try { localStorage.setItem("kosen_lang", l); } catch { /* ignore */ }
  };

  const t = (key, vars) => {
    const dict = translations[lang] ?? translations.th;
    let str = dict[key] ?? translations.th[key] ?? key;
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replace(`{${k}}`, v);
      });
    }
    return str;
  };

  return (
    <PublicLanguageContext.Provider value={{ lang, switchLang, t }}>
      {children}
    </PublicLanguageContext.Provider>
  );
}

export function usePublicLanguage() {
  const ctx = useContext(PublicLanguageContext);
  if (!ctx) throw new Error("usePublicLanguage must be used inside PublicLanguageProvider");
  return ctx;
}
