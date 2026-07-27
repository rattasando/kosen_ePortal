"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ALUMNI } from "@/lib/data/alumniData";

const STORAGE_KEY = "kosen_alumni";
const SEED_VERSION_KEY = "kosen_alumni_seed_version";
const SEED_VERSION = `v${ALUMNI.length}r3`;

const AlumniContext = createContext(null);

export function AlumniProvider({ children }) {
  const [alumni, setAlumni] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let initial = ALUMNI;
    try {
      const savedVersion = localStorage.getItem(SEED_VERSION_KEY);
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored || savedVersion !== SEED_VERSION) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ALUMNI));
        localStorage.setItem(SEED_VERSION_KEY, SEED_VERSION);
      } else {
        initial = JSON.parse(stored);
      }
    } catch { /* use default */ }
    setAlumni(initial);
    setReady(true);
  }, []);

  const updateAlumni = useCallback((id, data) => {
    setAlumni((prev) => {
      const next = prev.map((a) => (a.id === id ? { ...a, ...data } : a));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const deleteAlumni = useCallback((id) => {
    setAlumni((prev) => {
      const next = prev.filter((a) => a.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const getAlumni = useCallback((id) => alumni.find((a) => a.id === id) ?? null, [alumni]);

  const addAlumni = useCallback((data) => {
    setAlumni((prev) => {
      const next = [...prev, data];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const replaceAll = useCallback((list) => {
    setAlumni(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      return list;
    });
  }, []);

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
