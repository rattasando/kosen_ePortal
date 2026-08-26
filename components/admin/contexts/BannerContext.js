"use client";

import { createResourceContext } from "@/lib/utils/createResourceContext";
import { BANNER_STORAGE_KEY, BANNER_SEED_KEY, BANNER_SEED_VER } from "@/lib/data/bannerData";

// sync ข้อมูล banners ลง localStorage ให้ BannerSlider (หน้าหลัก) อ่านได้ทันที
function syncToLocalStorage(banners) {
  try {
    localStorage.setItem(BANNER_STORAGE_KEY, JSON.stringify(banners));
    localStorage.setItem(BANNER_SEED_KEY, BANNER_SEED_VER);
  } catch { /* ignore — SSR / private mode */ }
}

const { Provider: _BannerProvider, useResource: _useBanners } = createResourceContext(
  "/api/banners",
  {
    reorderEndpoint: "/api/banners/reorder",
    onAfterLoad: syncToLocalStorage,
    onAfterMutate: syncToLocalStorage,
  }
);

export function BannerProvider({ children }) {
  return <_BannerProvider>{children}</_BannerProvider>;
}

export function useBanners() {
  const { items: banners, ready, add, update, remove, reorder } = _useBanners();

  return {
    banners,
    ready,
    addBanner: add,
    updateBanner: update,
    deleteBanner: remove,
    reorder,
  };
}
