"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { DEFAULT_NEWS } from "@/lib/newsData";

const STORAGE_KEY = "kosen_news";
const SEED_VERSION_KEY = "kosen_news_seed_version";
const SEED_VERSION = `v${DEFAULT_NEWS.length}r9`;

const NewsContext = createContext(null);

export function NewsProvider({ children }) {
  const [news, setNews] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let initial = DEFAULT_NEWS;
    try {
      const savedVersion = localStorage.getItem(SEED_VERSION_KEY);
      const stored = localStorage.getItem(STORAGE_KEY);
      const needsReset = !stored || savedVersion !== SEED_VERSION;
      if (needsReset) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_NEWS));
        localStorage.setItem(SEED_VERSION_KEY, SEED_VERSION);
      } else {
        initial = JSON.parse(stored);
      }
    } catch { /* use DEFAULT_NEWS */ }
    setNews(initial);
    setReady(true);
  }, []);

  const persist = useCallback((next) => {
    setNews(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const addNews = useCallback((item) => {
    setNews((prev) => {
      const next = [...prev, item];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const updateNews = useCallback((id, data) => {
    setNews((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, ...data } : n));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const deleteNews = useCallback((id) => {
    setNews((prev) => {
      const next = prev.filter((n) => n.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const getNews = useCallback(
    (id) => news.find((n) => n.id === id) ?? null,
    [news]
  );

  return (
    <NewsContext.Provider value={{ news, ready, addNews, updateNews, deleteNews, getNews, persist }}>
      {children}
    </NewsContext.Provider>
  );
}

export function useNews() {
  const ctx = useContext(NewsContext);
  if (!ctx) throw new Error("useNews must be used inside <NewsProvider>");
  return ctx;
}
