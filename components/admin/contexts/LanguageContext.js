"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { translations } from "@/lib/config/i18n";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
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

  // t("key") — returns translated string, supports {placeholder} interpolation
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
    <LanguageContext.Provider value={{ lang, switchLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
}
