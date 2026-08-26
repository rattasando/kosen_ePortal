"use client";

import { createElement, createContext, useContext, useState, useEffect, useCallback } from "react";

/**
 * createResourceContext — factory สร้าง React Context + Provider มาตรฐาน CRUD
 *
 * ลด boilerplate ที่ซ้ำกันใน context ทุกตัว (fetch on mount, add, update, remove)
 *
 * @param {string} endpoint  — base API path เช่น "/api/jobs"
 * @param {object} [options]
 * @param {(items: any[]) => void} [options.onAfterLoad]
 *   — side-effect เรียกครั้งเดียวหลัง fetch ครั้งแรก ได้รับ items ทั้งหมด
 * @param {(items: any[]) => void} [options.onAfterMutate]
 *   — side-effect เรียกทุกครั้งที่ state เปลี่ยน (add/update/remove/reorder) ได้รับ items ใหม่
 * @param {string} [options.reorderEndpoint]
 *   — เปิดใช้ reorder() และส่ง PATCH ไปที่ path นี้ พร้อม body { ids: string[] }
 *
 * @returns {{ Provider: React.FC, useResource: () => ResourceValue }}
 *
 * ResourceValue = { items, ready, add, update, remove, reorder? }
 *   - items   : any[]   — รายการทั้งหมด
 *   - ready   : boolean — fetch เสร็จแล้วหรือยัง
 *   - add(body)         → Promise<created>
 *   - update(id, body)  → Promise<updated>
 *   - remove(id)        → Promise<void>
 *   - reorder(ordered)  → Promise<void>  (มีเฉพาะถ้า reorderEndpoint ถูกกำหนด)
 *
 * @example
 * // lib/contexts/NewsContext.js
 * const { Provider: NewsProvider, useResource: useNews_base } =
 *   createResourceContext("/api/news");
 *
 * export { NewsProvider };
 * export function useNews() {
 *   const { items: news, ready, add, update, remove } = useNews_base();
 *   return { news, ready, addNews: add, updateNews: update, deleteNews: remove };
 * }
 */
export function createResourceContext(endpoint, options = {}) {
  const { onAfterLoad, onAfterMutate, reorderEndpoint } = options;

  const Ctx = createContext(null);

  function Provider({ children }) {
    const [items, setItems] = useState([]);
    const [ready, setReady] = useState(false);

    // ── initial fetch ──────────────────────────────────────────
    useEffect(() => {
      fetch(endpoint)
        .then((r) => r.json())
        .then((data) => {
          setItems(data);
          onAfterLoad?.(data);
        })
        .catch(console.error)
        .finally(() => setReady(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── refresh (re-fetch ทั้งหมดจาก server) ──────────────────
    const refresh = useCallback(async () => {
      const data = await fetch(endpoint).then((r) => r.json());
      setItems(data);
      onAfterMutate?.(data);
      return data;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── add ────────────────────────────────────────────────────
    const add = useCallback(async (body) => {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const created = await res.json();
      setItems((prev) => {
        const next = [...prev, created];
        onAfterMutate?.(next);
        return next;
      });
      return created;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── update ─────────────────────────────────────────────────
    const update = useCallback(async (id, body) => {
      const res = await fetch(`${endpoint}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const updated = await res.json();
      setItems((prev) => {
        const next = prev.map((item) => (item.id === id ? updated : item));
        onAfterMutate?.(next);
        return next;
      });
      return updated;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── remove ─────────────────────────────────────────────────
    const remove = useCallback(async (id) => {
      await fetch(`${endpoint}/${id}`, { method: "DELETE" });
      setItems((prev) => {
        const next = prev.filter((item) => item.id !== id);
        onAfterMutate?.(next);
        return next;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── reorder (optional) ─────────────────────────────────────
    const reorder = useCallback(async (ordered) => {
      if (!reorderEndpoint) return;
      setItems(ordered);
      onAfterMutate?.(ordered);
      await fetch(reorderEndpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: ordered.map((item) => item.id) }),
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const value = {
      items,
      ready,
      add,
      update,
      remove,
      refresh,
      ...(reorderEndpoint ? { reorder } : {}),
    };

    return createElement(Ctx.Provider, { value }, children);
  }

  function useResource() {
    const ctx = useContext(Ctx);
    if (!ctx) {
      throw new Error(
        `useResource must be used inside the matching Provider (endpoint: ${endpoint})`
      );
    }
    return ctx;
  }

  return { Provider, useResource };
}
