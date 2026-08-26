"use client";

import { useCallback } from "react";
import { createResourceContext } from "@/lib/utils/createResourceContext";

const { Provider: _NewsProvider, useResource: _useNews } =
  createResourceContext("/api/news");

export function NewsProvider({ children }) {
  return <_NewsProvider>{children}</_NewsProvider>;
}

export function useNews() {
  const { items: news, ready, add, update, remove, refresh } = _useNews();

  // compat: getNews(id) — หา item จาก local state
  const getNews = useCallback(
    (id) => news.find((n) => n.id === id) ?? null,
    [news]
  );

  return {
    news,
    ready,
    addNews: add,
    updateNews: update,
    deleteNews: remove,
    getNews,
    /** ดึงข้อมูลล่าสุดจาก server (เดิมชื่อ persist) */
    persist: refresh,
  };
}
