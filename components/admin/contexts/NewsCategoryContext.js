"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

const NewsCategoryContext = createContext(null);

export function NewsCategoryProvider({ children }) {
  const [categories, setCategories] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch("/api/news-categories")
      .then((r) => r.json())
      .then(setCategories)
      .catch(console.error)
      .finally(() => setReady(true));
  }, []);

  const addCategory = useCallback(async (data) => {
    const res = await fetch("/api/news-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const created = await res.json();
    setCategories((prev) => [...prev, created]);
    return created;
  }, []);

  const updateCategory = useCallback(async (id, data) => {
    const res = await fetch(`/api/news-categories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const updated = await res.json();
    setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
    return updated;
  }, []);

  const deleteCategory = useCallback(async (id) => {
    await fetch(`/api/news-categories/${id}`, { method: "DELETE" });
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }, []);

  // helper: หาสีจากชื่อหมวดหมู่
  const getCategoryColor = useCallback(
    (name) => categories.find((c) => c.name === name)?.color ?? "bg-gray-100 text-gray-600",
    [categories]
  );

  return (
    <NewsCategoryContext.Provider
      value={{ categories, ready, addCategory, updateCategory, deleteCategory, getCategoryColor }}
    >
      {children}
    </NewsCategoryContext.Provider>
  );
}

export function useNewsCategory() {
  const ctx = useContext(NewsCategoryContext);
  if (!ctx) throw new Error("useNewsCategory must be used inside <NewsCategoryProvider>");
  return ctx;
}
