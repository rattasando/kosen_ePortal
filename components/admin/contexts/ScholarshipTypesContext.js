"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

const ScholarshipTypesContext = createContext(null);

export function ScholarshipTypesProvider({ children }) {
  const [scholarshipTypes, setScholarshipTypes] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch("/api/scholarship-types")
      .then((r) => r.json())
      .then(setScholarshipTypes)
      .catch(console.error)
      .finally(() => setReady(true));
  }, []);

  const addScholarshipType = useCallback(async (item) => {
    const res = await fetch("/api/scholarship-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    const created = await res.json();
    setScholarshipTypes((prev) => [...prev, created]);
    return created;
  }, []);

  const updateScholarshipType = useCallback(async (id, data) => {
    const res = await fetch(`/api/scholarship-types/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const updated = await res.json();
    setScholarshipTypes((prev) => prev.map((s) => (s.id === id ? updated : s)));
    return updated;
  }, []);

  const deleteScholarshipType = useCallback(async (id) => {
    await fetch(`/api/scholarship-types/${id}`, { method: "DELETE" });
    setScholarshipTypes((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const getScholarshipType = useCallback(
    (id) => scholarshipTypes.find((s) => s.id === id) ?? null,
    [scholarshipTypes]
  );

  const persist = useCallback(async () => {
    const res = await fetch("/api/scholarship-types");
    setScholarshipTypes(await res.json());
  }, []);

  return (
    <ScholarshipTypesContext.Provider value={{ scholarshipTypes, ready, addScholarshipType, updateScholarshipType, deleteScholarshipType, getScholarshipType, persist }}>
      {children}
    </ScholarshipTypesContext.Provider>
  );
}

export function useScholarshipTypes() {
  const ctx = useContext(ScholarshipTypesContext);
  if (!ctx) throw new Error("useScholarshipTypes must be used inside <ScholarshipTypesProvider>");
  return ctx;
}
