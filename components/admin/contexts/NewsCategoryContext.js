"use client";

import { useCallback } from "react";
import { createResourceContext } from "@/lib/utils/createResourceContext";

const { Provider: _NewsCategoryProvider, useResource: _useNewsCategory } =
  createResourceContext("/api/news-categories");

export function NewsCategoryProvider({ children }) {
  return <_NewsCategoryProvider>{children}</_NewsCategoryProvider>;
}

export function useNewsCategory() {
  const { items: categories, ready, add, update, remove } = _useNewsCategory();

  // helper: หาสีจากชื่อหมวดหมู่
  const getCategoryColor = useCallback(
    (name) =>
      categories.find((c) => c.name === name)?.color ?? "bg-gray-100 text-gray-600",
    [categories]
  );

  return {
    categories,
    ready,
    addCategory: add,
    updateCategory: update,
    deleteCategory: remove,
    getCategoryColor,
  };
}
