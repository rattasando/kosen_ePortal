"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { DEFAULT_DOCUMENTS } from "@/lib/data/documentsData";

const STORAGE_KEY = "kosen_documents";
const SEED_VERSION_KEY = "kosen_documents_seed_version";
const SEED_VERSION = `v${DEFAULT_DOCUMENTS.length}r2`;

const DocumentContext = createContext(null);

export function DocumentProvider({ children }) {
  const [documents, setDocuments] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let initial = DEFAULT_DOCUMENTS;
    try {
      const savedVersion = localStorage.getItem(SEED_VERSION_KEY);
      const stored = localStorage.getItem(STORAGE_KEY);
      const needsReset = !stored || savedVersion !== SEED_VERSION;
      if (needsReset) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DOCUMENTS));
        localStorage.setItem(SEED_VERSION_KEY, SEED_VERSION);
      } else {
        initial = JSON.parse(stored);
      }
    } catch { /* use DEFAULT_DOCUMENTS */ }
    setDocuments(initial);
    setReady(true);
  }, []);

  const persist = useCallback((next) => {
    setDocuments(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const addDocument = useCallback((doc) => {
    setDocuments((prev) => {
      const next = [...prev, doc];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const updateDocument = useCallback((id, data) => {
    setDocuments((prev) => {
      const next = prev.map((d) => (d.id === id ? { ...d, ...data } : d));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const deleteDocument = useCallback((id) => {
    setDocuments((prev) => {
      const next = prev.filter((d) => d.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <DocumentContext.Provider value={{ documents, ready, addDocument, updateDocument, deleteDocument }}>
      {children}
    </DocumentContext.Provider>
  );
}

export function useDocuments() {
  const ctx = useContext(DocumentContext);
  if (!ctx) throw new Error("useDocuments must be used inside <DocumentProvider>");
  return ctx;
}
