"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

const InternshipContext = createContext(null);

export function InternshipProvider({ children }) {
  const [internships, setInternships] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch("/api/internships")
      .then((r) => r.json())
      .then(setInternships)
      .catch(console.error)
      .finally(() => setReady(true));
  }, []);

  const addInternship = useCallback(async (item) => {
    const res = await fetch("/api/internships", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    const created = await res.json();
    setInternships((prev) => [...prev, created]);
    return created;
  }, []);

  const updateInternship = useCallback(async (id, data) => {
    const res = await fetch(`/api/internships/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const updated = await res.json();
    setInternships((prev) => prev.map((m) => (m.id === id ? updated : m)));
    return updated;
  }, []);

  const deleteInternship = useCallback(async (id) => {
    await fetch(`/api/internships/${id}`, { method: "DELETE" });
    setInternships((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const getInternship = useCallback(
    (id) => internships.find((m) => m.id === id) ?? null,
    [internships]
  );

  const replaceAll = useCallback(async (list) => {
    const existingIds = new Set(internships.map((m) => m.id));
    await Promise.all(
      list.map((item) => {
        const opts = {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        };
        return existingIds.has(item.id)
          ? fetch(`/api/internships/${item.id}`, { method: "PUT", ...opts })
          : fetch("/api/internships", { method: "POST", ...opts });
      })
    );
    const fresh = await fetch("/api/internships").then((r) => r.json());
    setInternships(fresh);
  }, [internships]);

  return (
    <InternshipContext.Provider value={{ internships, ready, addInternship, updateInternship, deleteInternship, getInternship, replaceAll }}>
      {children}
    </InternshipContext.Provider>
  );
}

export function useInternships() {
  const ctx = useContext(InternshipContext);
  if (!ctx) throw new Error("useInternships must be used inside <InternshipProvider>");
  return ctx;
}
