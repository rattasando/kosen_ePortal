"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

const BannerContext = createContext(null);

export function BannerProvider({ children }) {
  const [banners, setBanners] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch("/api/banners")
      .then((r) => r.json())
      .then(setBanners)
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
    setBanners((prev) => [...prev, created]);
    return created;
  }, []);

  const updateBanner = useCallback(async (id, data) => {
    const res = await fetch(`/api/banners/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const updated = await res.json();
    setBanners((prev) => prev.map((b) => (b.id === id ? updated : b)));
    return updated;
  }, []);

  const deleteBanner = useCallback(async (id) => {
    await fetch(`/api/banners/${id}`, { method: "DELETE" });
    setBanners((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const reorder = useCallback(async (ordered) => {
    setBanners(ordered);
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
