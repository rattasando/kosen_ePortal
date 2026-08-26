"use client";

import { createResourceContext } from "@/lib/utils/createResourceContext";

const { Provider: _DocumentProvider, useResource: _useDocuments } =
  createResourceContext("/api/documents");

export function DocumentProvider({ children }) {
  return <_DocumentProvider>{children}</_DocumentProvider>;
}

export function useDocuments() {
  const { items: documents, ready, add, update, remove } = _useDocuments();

  return {
    documents,
    ready,
    addDocument: add,
    updateDocument: update,
    deleteDocument: remove,
  };
}
