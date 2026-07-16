"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { DEFAULT_SCHOLARSHIP_TYPES } from "@/lib/scholarshipTypesData";

const STORAGE_KEY = "kosen_scholarship_types";
const SEED_VERSION_KEY = "kosen_scholarship_types_seed_version";
const SEED_VERSION = `v${DEFAULT_SCHOLARSHIP_TYPES.length}r1`;

const ScholarshipTypesContext = createContext(null);

export function ScholarshipTypesProvider({ children }) {
  const [scholarshipTypes, setScholarshipTypes] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let initial = DEFAULT_SCHOLARSHIP_TYPES;
    try {
      const savedVersion = localStorage.getItem(SEED_VERSION_KEY);
      const stored = localStorage.getItem(STORAGE_KEY);
      const needsReset = !stored || savedVersion !== SEED_VERSION;
      if (needsReset) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SCHOLARSHIP_TYPES));
        localStorage.setItem(SEED_VERSION_KEY, SEED_VERSION);
      } else {
        initial = JSON.parse(stored);
      }
    } catch { /* use DEFAULT_SCHOLARSHIP_TYPES */ }
    setScholarshipTypes(initial);
    setReady(true);
  }, []);

  const persist = useCallback((next) => {
    setScholarshipTypes(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const addScholarshipType = useCallback((item) => {
    setScholarshipTypes((prev) => {
      const next = [...prev, item];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const updateScholarshipType = useCallback((id, data) => {
    setScholarshipTypes((prev) => {
      const next = prev.map((s) => (s.id === id ? { ...s, ...data } : s));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const deleteScholarshipType = useCallback((id) => {
    setScholarshipTypes((prev) => {
      const next = prev.filter((s) => s.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const getScholarshipType = useCallback(
    (id) => scholarshipTypes.find((s) => s.id === id) ?? null,
    [scholarshipTypes]
  );

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
