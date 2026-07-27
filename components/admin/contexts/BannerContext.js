"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { DEFAULT_BANNERS, BANNER_STORAGE_KEY, BANNER_SEED_KEY, BANNER_SEED_VER } from "@/lib/data/bannerData";

const BannerContext = createContext(null);

export function BannerProvider({ children }) {
  const [banners, setBanners] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let initial = DEFAULT_BANNERS;
    try {
      const savedVer = localStorage.getItem(BANNER_SEED_KEY);
      const stored   = localStorage.getItem(BANNER_STORAGE_KEY);
      if (!stored || savedVer !== BANNER_SEED_VER) {
        localStorage.setItem(BANNER_STORAGE_KEY, JSON.stringify(DEFAULT_BANNERS));
        localStorage.setItem(BANNER_SEED_KEY, BANNER_SEED_VER);
      } else {
        initial = JSON.parse(stored);
      }
    } catch { /* use DEFAULT_BANNERS */ }
    setBanners(initial);
    setReady(true);
  }, []);

  const save = useCallback((next) => {
    setBanners(next);
    localStorage.setItem(BANNER_STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new StorageEvent("storage", { key: BANNER_STORAGE_KEY }));
  }, []);

  const addBanner    = useCallback((b)       => save([...banners, b]), [banners, save]);
  const updateBanner = useCallback((id, data) => save(banners.map((b) => b.id === id ? { ...b, ...data } : b)), [banners, save]);
  const deleteBanner = useCallback((id)       => save(banners.filter((b) => b.id !== id)), [banners, save]);
  const reorder      = useCallback((ordered)  => save(ordered), [save]);

  return (
    <BannerContext.Provider value={{ banners, ready, addBanner, updateBanner, deleteBanner, reorder }}>
      {children}
    </BannerContext.Provider>
  );
}

export function useBanners() {
  const ctx = useContext(BannerContext);
  if (!ctx) throw new Error("useBanners must be used inside <BannerProvider>");
  return ctx;
}
