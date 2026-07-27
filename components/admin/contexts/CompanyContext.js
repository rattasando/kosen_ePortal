"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { DEFAULT_COMPANIES } from "@/lib/data/companyData";

const STORAGE_KEY = "kosen_companies";
const SEED_VERSION_KEY = "kosen_companies_seed_version";
const SEED_VERSION = `v${DEFAULT_COMPANIES.length}r2`;

const CompanyContext = createContext(null);

export function CompanyProvider({ children }) {
  const [companies, setCompanies] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let initial = DEFAULT_COMPANIES;
    try {
      const savedVersion = localStorage.getItem(SEED_VERSION_KEY);
      const stored = localStorage.getItem(STORAGE_KEY);
      const needsReset = !stored || savedVersion !== SEED_VERSION;
      if (needsReset) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_COMPANIES));
        localStorage.setItem(SEED_VERSION_KEY, SEED_VERSION);
      } else {
        initial = JSON.parse(stored);
      }
    } catch {
      /* use DEFAULT_COMPANIES */
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCompanies(initial);
    setReady(true);
  }, []);

  const persist = useCallback((next) => {
    setCompanies(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const addCompany = useCallback((company) => {
    setCompanies((prev) => {
      const next = [...prev, company];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const updateCompany = useCallback((id, data) => {
    setCompanies((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, ...data } : c));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const deleteCompany = useCallback((id) => {
    setCompanies((prev) => {
      const next = prev.filter((c) => c.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const replaceAll = useCallback((list) => {
    setCompanies(list);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    localStorage.setItem(SEED_VERSION_KEY, `custom-${list.length}`);
  }, []);

  const getCompany = useCallback(
    (id) => companies.find((c) => c.id === id) ?? null,
    [companies]
  );

  return (
    <CompanyContext.Provider
      value={{ companies, ready, addCompany, updateCompany, deleteCompany, getCompany, replaceAll }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompanies() {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error("useCompanies must be used inside <CompanyProvider>");
  return ctx;
}
