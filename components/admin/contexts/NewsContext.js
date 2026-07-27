"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

const NewsContext = createContext(null);

export function NewsProvider({ children }) {
  const [news, setNews] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch("/api/news")
      .then((r) => r.json())
      .then(setNews)
      .catch(console.error)
      .finally(() => setReady(true));
  }, []);

  const addNews = useCallback(async (item) => {
    const res = await fetch("/api/news", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    const created = await res.json();
    setNews((prev) => [...prev, created]);
    return created;
  }, []);

  const updateNews = useCallback(async (id, data) => {
    const res = await fetch(`/api/news/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const updated = await res.json();
    setNews((prev) => prev.map((n) => (n.id === id ? updated : n)));
    return updated;
  }, []);

  const deleteNews = useCallback(async (id) => {
    await fetch(`/api/news/${id}`, { method: "DELETE" });
    setNews((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const getNews = useCallback((id) => news.find((n) => n.id === id) ?? null, [news]);

  const persist = useCallback(async (list) => {
    const res = await fetch("/api/news");
    const fresh = await res.json();
    setNews(fresh);
  }, []);

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
