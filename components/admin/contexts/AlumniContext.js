"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

const AlumniContext = createContext(null);

export function AlumniProvider({ children }) {
  const [alumni, setAlumni] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch("/api/alumni")
      .then((r) => r.json())
      .then(setAlumni)
      .catch(console.error)
      .finally(() => setReady(true));
  }, []);

  const addAlumni = useCallback(async (data) => {
    const res = await fetch("/api/alumni", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const created = await res.json();
    setAlumni((prev) => [...prev, created]);
    return created;
  }, []);

  const updateAlumni = useCallback(async (id, data) => {
    const res = await fetch(`/api/alumni/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const updated = await res.json();
    setAlumni((prev) => prev.map((a) => (a.id === id ? updated : a)));
    return updated;
  }, []);

  const deleteAlumni = useCallback(async (id) => {
    await fetch(`/api/alumni/${id}`, { method: "DELETE" });
    setAlumni((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const getAlumni = useCallback((id) => alumni.find((a) => a.id === id) ?? null, [alumni]);

  const replaceAll = useCallback(async (list) => {
    const existingIds = new Set(alumni.map((a) => a.id));
    await Promise.all(
      list.map((item) => {
        const opts = {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        };
        return existingIds.has(item.id)
          ? fetch(`/api/alumni/${item.id}`, { method: "PUT", ...opts })
          : fetch("/api/alumni", { method: "POST", ...opts });
      })
    );
    const fresh = await fetch("/api/alumni").then((r) => r.json());
    setAlumni(fresh);
  }, [alumni]);

  return (
    <AlumniContext.Provider value={{ alumni, ready, updateAlumni, deleteAlumni, getAlumni, addAlumni, replaceAll }}>
      {children}
    </AlumniContext.Provider>
  );
}

export function useAlumni() {
  const ctx = useContext(AlumniContext);
  if (!ctx) throw new Error("useAlumni must be used inside <AlumniProvider>");
  return ctx;
}
