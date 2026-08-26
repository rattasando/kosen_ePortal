"use client";

import { useCallback } from "react";
import { createResourceContext } from "@/lib/utils/createResourceContext";

const { Provider: _CompanyProvider, useResource: _useCompanies } =
  createResourceContext("/api/companies");

export function CompanyProvider({ children }) {
  return <_CompanyProvider>{children}</_CompanyProvider>;
}

export function useCompanies() {
  const { items: companies, ready, add, update, remove, refresh } = _useCompanies();

  const getCompany = useCallback(
    (id) => companies.find((c) => c.id === id) ?? null,
    [companies]
  );

  /**
   * replaceAll — upsert รายการทั้งหมดในครั้งเดียว (ใช้ใน import CSV)
   * PUT สำหรับ id ที่มีอยู่แล้ว, POST สำหรับ id ใหม่
   */
  const replaceAll = useCallback(
    async (list) => {
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
      await refresh();
    },
    [companies, refresh]
  );

  return {
    companies,
    ready,
    addCompany: add,
    updateCompany: update,
    deleteCompany: remove,
    getCompany,
    replaceAll,
  };
}
