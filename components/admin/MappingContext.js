"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { DEFAULT_MAPPINGS } from "@/lib/mappingData";

const STORAGE_KEY      = "kosen_mappings";
const SEED_VERSION_KEY = "kosen_mappings_seed_version";
const SEED_VERSION     = `v${DEFAULT_MAPPINGS.length}r1`;

const MappingContext = createContext(null);

export function MappingProvider({ children }) {
  const [mappings, setMappings] = useState([]);
  const [ready, setReady]       = useState(false);

  useEffect(() => {
    let initial = DEFAULT_MAPPINGS;
    try {
      const savedVersion = localStorage.getItem(SEED_VERSION_KEY);
      const stored       = localStorage.getItem(STORAGE_KEY);
      const needsReset   = !stored || savedVersion !== SEED_VERSION;
      if (needsReset) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_MAPPINGS));
        localStorage.setItem(SEED_VERSION_KEY, SEED_VERSION);
      } else {
        initial = JSON.parse(stored);
      }
    } catch { /* use DEFAULT_MAPPINGS */ }
    setMappings(initial);
    setReady(true);
  }, []);

  const persist = useCallback((next) => {
    setMappings(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const addMapping = useCallback((mapping) => {
    setMappings((prev) => {
      const next = [...prev, mapping];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const updateMapping = useCallback((id, data) => {
    setMappings((prev) => {
      const next = prev.map((m) => (m.id === id ? { ...m, ...data } : m));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const deleteMapping = useCallback((id) => {
    setMappings((prev) => {
      const next = prev.filter((m) => m.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const getMapping = useCallback(
    (id) => mappings.find((m) => m.id === id) ?? null,
    [mappings]
  );

  const replaceAll = useCallback((list) => {
    persist(list);
  }, [persist]);

  return (
    <MappingContext.Provider value={{ mappings, ready, addMapping, updateMapping, deleteMapping, getMapping, replaceAll }}>
      {children}
    </MappingContext.Provider>
  );
}

export function useMappings() {
  const ctx = useContext(MappingContext);
  if (!ctx) throw new Error("useMappings must be used inside <MappingProvider>");
  return ctx;
}
