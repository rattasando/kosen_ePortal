"use client";

import { useCallback } from "react";
import { createResourceContext } from "@/lib/utils/createResourceContext";

const { Provider: _ScholarshipTypesProvider, useResource: _useScholarshipTypes } =
  createResourceContext("/api/scholarship-types");

export function ScholarshipTypesProvider({ children }) {
  return <_ScholarshipTypesProvider>{children}</_ScholarshipTypesProvider>;
}

export function useScholarshipTypes() {
  const { items: scholarshipTypes, ready, add, update, remove, refresh } =
    _useScholarshipTypes();

  const getScholarshipType = useCallback(
    (id) => scholarshipTypes.find((s) => s.id === id) ?? null,
    [scholarshipTypes]
  );

  return {
    scholarshipTypes,
    ready,
    addScholarshipType: add,
    updateScholarshipType: update,
    deleteScholarshipType: remove,
    getScholarshipType,
    persist: refresh,
  };
}
