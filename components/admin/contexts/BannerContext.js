"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { BANNER_STORAGE_KEY, BANNER_SEED_KEY, BANNER_SEED_VER } from "@/lib/data/bannerData";

const BannerContext = createContext(null);

// sync ข้อมูล banners ลง localStorage ให้ BannerSlider (หน้าหลัก) อ่านได้ทันที
function syncToLocalStorage(banners) {
  try {
    localStorage.setItem(BANNER_STORAGE_KEY, JSON.stringify(banners));
    localStorage.setItem(BANNER_SEED_KEY, BANNER_SEED_VER);
  } catch { /* ignore — SSR / private mode */ }
}

export function BannerProvider({ children }) {
  const [banners, setBanners] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch("/api/banners")
      .then((r) => r.json())
      .then((data) => {
        setBanners(data);
        syncToLocalStorage(data); // sync ครั้งแรกตอน load เพื่อให้ homepage ตรงกับ DB
      })
      .catch(console.error)
      .finally(() => setReady(true));
  }, []);

  const addBanner = useCallback(async (b) => {
    const res = await fetch("/api/banners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(b),
    });
    const created = await res.json();
    setBanners((prev) => {
      const next = [...prev, created];
      syncToLocalStorage(next);
      return next;
    });
    return created;
  }, []);

  const updateBanner = useCallback(async (id, data) => {
    const res = await fetch(`/api/banners/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const updated = await res.json();
    setBanners((prev) => {
      const next = prev.map((b) => (b.id === id ? updated : b));
      syncToLocalStorage(next);
      return next;
    });
    return updated;
  }, []);

  const deleteBanner = useCallback(async (id) => {
    await fetch(`/api/banners/${id}`, { method: "DELETE" });
    setBanners((prev) => {
      const next = prev.filter((b) => b.id !== id);
      syncToLocalStorage(next);
      return next;
    });
  }, []);

  const reorder = useCallback(async (ordered) => {
    setBanners(ordered);
    syncToLocalStorage(ordered);
    await fetch("/api/banners/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: ordered.map((b) => b.id) }),
    });
  }, []);

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
