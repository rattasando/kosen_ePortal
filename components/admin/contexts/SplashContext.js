"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  DEFAULT_SPLASH,
  SPLASH_STORAGE_KEY,
  SPLASH_SEED_KEY,
  SPLASH_SEED_VER,
} from "@/lib/data/splashData";

const SplashContext = createContext(null);

export function SplashProvider({ children }) {
  const [config, setConfig] = useState(DEFAULT_SPLASH);
  const [ready, setReady]   = useState(false);

  useEffect(() => {
    let initial = DEFAULT_SPLASH;
    try {
      const savedVer = localStorage.getItem(SPLASH_SEED_KEY);
      const stored   = localStorage.getItem(SPLASH_STORAGE_KEY);
      if (stored && savedVer === SPLASH_SEED_VER) {
        initial = { ...DEFAULT_SPLASH, ...JSON.parse(stored) };
      } else {
        localStorage.setItem(SPLASH_STORAGE_KEY, JSON.stringify(DEFAULT_SPLASH));
        localStorage.setItem(SPLASH_SEED_KEY, SPLASH_SEED_VER);
      }
    } catch { /* use default */ }
    setConfig(initial);
    setReady(true);
  }, []);

  const updateConfig = useCallback((patch) => {
    setConfig((prev) => {
      const next = { ...prev, ...patch };
      try { localStorage.setItem(SPLASH_STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  return (
    <SplashContext.Provider value={{ config, ready, updateConfig }}>
      {children}
    </SplashContext.Provider>
  );
}

export function useSplash() {
  const ctx = useContext(SplashContext);
  if (!ctx) throw new Error("useSplash must be used inside <SplashProvider>");
  return ctx;
}
