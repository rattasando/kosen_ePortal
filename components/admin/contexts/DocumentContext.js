"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

const DocumentContext = createContext(null);

export function DocumentProvider({ children }) {
  const [documents, setDocuments] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch("/api/documents")
      .then((r) => r.json())
      .then(setDocuments)
      .catch(console.error)
      .finally(() => setReady(true));
  }, []);

  const addDocument = useCallback(async (doc) => {
    const res = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(doc),
    });
    const created = await res.json();
    setDocuments((prev) => [...prev, created]);
    return created;
  }, []);

  const updateDocument = useCallback(async (id, data) => {
    const res = await fetch(`/api/documents/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const updated = await res.json();
    setDocuments((prev) => prev.map((d) => (d.id === id ? updated : d)));
    return updated;
  }, []);

  const deleteDocument = useCallback(async (id) => {
    await fetch(`/api/documents/${id}`, { method: "DELETE" });
    setDocuments((prev) => prev.filter((d) => d.id !== id));
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
