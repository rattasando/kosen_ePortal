"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

const CompanyContext = createContext(null);

export function CompanyProvider({ children }) {
  const [companies, setCompanies] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch("/api/companies")
      .then((r) => r.json())
      .then(setCompanies)
      .catch(console.error)
      .finally(() => setReady(true));
  }, []);

  const addCompany = useCallback(async (company) => {
    const res = await fetch("/api/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(company),
    });
    const created = await res.json();
    setCompanies((prev) => [...prev, created]);
    return created;
  }, []);

  const updateCompany = useCallback(async (id, data) => {
    const res = await fetch(`/api/companies/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const updated = await res.json();
    setCompanies((prev) => prev.map((c) => (c.id === id ? updated : c)));
    return updated;
  }, []);

  const deleteCompany = useCallback(async (id) => {
    await fetch(`/api/companies/${id}`, { method: "DELETE" });
    setCompanies((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const getCompany = useCallback(
    (id) => companies.find((c) => c.id === id) ?? null,
    [companies]
  );

  const replaceAll = useCallback(async (list) => {
    const existingIds = new Set(companies.map((c) => c.id));
    await Promise.all(
      list.map((item) => {
        const opts = {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        };
        return existingIds.has(item.id)
          ? fetch(`/api/companies/${item.id}`, { method: "PUT", ...opts })
          : fetch("/api/companies", { method: "POST", ...opts });
      })
    );
    const fresh = await fetch("/api/companies").then((r) => r.json());
    setCompanies(fresh);
  }, [companies]);

  return (
    <CompanyContext.Provider value={{ companies, ready, addCompany, updateCompany, deleteCompany, getCompany, replaceAll }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompanies() {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error("useCompanies must be used inside <CompanyProvider>");
  return ctx;
}
