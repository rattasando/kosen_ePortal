"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

const SplashContext = createContext(null);

export function SplashProvider({ children }) {
  const [config, setConfig] = useState({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch("/api/splash")
      .then((r) => r.json())
      .then(setConfig)
      .catch(console.error)
      .finally(() => setReady(true));
  }, []);

  const updateConfig = useCallback(async (patch) => {
    const next = { ...config, ...patch };
    setConfig(next);
    const res = await fetch("/api/splash", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const saved = await res.json();
    setConfig(saved);
    return saved;
  }, [config]);

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
