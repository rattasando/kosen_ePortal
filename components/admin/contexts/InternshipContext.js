"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { DEFAULT_INTERNSHIPS } from "@/lib/data/internshipData";

const STORAGE_KEY      = "kosen_internships";
const SEED_VERSION_KEY = "kosen_internships_seed_version";
const SEED_VERSION     = `v${DEFAULT_INTERNSHIPS.length}r1`;

const InternshipContext = createContext(null);

export function InternshipProvider({ children }) {
  const [internships, setInternships] = useState([]);
  const [ready, setReady]             = useState(false);

  useEffect(() => {
    let initial = DEFAULT_INTERNSHIPS;
    try {
      const savedVersion = localStorage.getItem(SEED_VERSION_KEY);
      const stored       = localStorage.getItem(STORAGE_KEY);
      const needsReset   = !stored || savedVersion !== SEED_VERSION;
      if (needsReset) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_INTERNSHIPS));
        localStorage.setItem(SEED_VERSION_KEY, SEED_VERSION);
      } else {
        initial = JSON.parse(stored);
      }
    } catch { /* use DEFAULT_INTERNSHIPS */ }
    setInternships(initial);
    setReady(true);
  }, []);

  const persist = useCallback((next) => {
    setInternships(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const addInternship = useCallback((item) => {
    setInternships((prev) => {
      const next = [...prev, item];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const updateInternship = useCallback((id, data) => {
    setInternships((prev) => {
      const next = prev.map((m) => (m.id === id ? { ...m, ...data } : m));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const deleteInternship = useCallback((id) => {
    setInternships((prev) => {
      const next = prev.filter((m) => m.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const getInternship = useCallback(
    (id) => internships.find((m) => m.id === id) ?? null,
    [internships]
  );

  const replaceAll = useCallback((list) => {
    persist(list);
  }, [persist]);

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
