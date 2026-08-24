"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

const H = { "Content-Type": "application/json" };

const MappingContext = createContext(null);

export function MappingProvider({ children }) {
  const [mappings, setMappings] = useState([]);
  const [ready, setReady]       = useState(false);

  const refetch = useCallback(async () => {
    const data = await fetch("/api/mappings").then((r) => r.json());
    setMappings(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    fetch("/api/mappings")
      .then((r) => r.json())
      .then((data) => { setMappings(Array.isArray(data) ? data : []); })
      .catch(() => setMappings([]))
      .finally(() => setReady(true));
  }, []);

  const addMapping = useCallback(async (mapping) => {
    const res = await fetch("/api/mappings", {
      method: "POST", headers: H, body: JSON.stringify(mapping),
    });
    const created = await res.json();
    if (!res.ok) throw new Error(created.error ?? "เพิ่ม mapping ไม่สำเร็จ");
    setMappings((prev) => [...prev, created]);
    return created;
  }, []);

  const updateMapping = useCallback(async (id, data) => {
    const res = await fetch(`/api/mappings/${id}`, {
      method: "PUT", headers: H, body: JSON.stringify(data),
    });
    const updated = await res.json();
    if (!res.ok) throw new Error(updated.error ?? "แก้ไข mapping ไม่สำเร็จ");
    setMappings((prev) => prev.map((m) => (m.id === id ? updated : m)));
    return updated;
  }, []);

  const deleteMapping = useCallback(async (id) => {
    const res = await fetch(`/api/mappings/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json();
      throw new Error(body.error ?? "ลบ mapping ไม่สำเร็จ");
    }
    setMappings((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const getMapping = useCallback(
    (id) => mappings.find((m) => m.id === id) ?? null,
    [mappings]
  );

  // bulk replace — POST ทีละรายการ (ใช้ใน import CSV)
  const replaceAll = useCallback(async (list) => {
    // ลบทั้งหมดก่อน
    await Promise.all(mappings.map((m) => fetch(`/api/mappings/${m.id}`, { method: "DELETE" })));
    // สร้างใหม่ทีละรายการ
    const created = [];
    for (const item of list) {
      const res = await fetch("/api/mappings", {
        method: "POST", headers: H, body: JSON.stringify(item),
      });
      if (res.ok) created.push(await res.json());
    }
    setMappings(created);
  }, [mappings]);

  return (
    <MappingContext.Provider value={{ mappings, ready, addMapping, updateMapping, deleteMapping, getMapping, replaceAll, refetch }}>
      {children}
    </MappingContext.Provider>
  );
}

export function useMappings() {
  const ctx = useContext(MappingContext);
  if (!ctx) throw new Error("useMappings must be used inside <MappingProvider>");
  return ctx;
}
