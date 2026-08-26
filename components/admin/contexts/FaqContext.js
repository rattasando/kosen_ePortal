"use client";

import { createResourceContext } from "@/lib/utils/createResourceContext";

const { Provider: _FaqProvider, useResource: _useFaq } = createResourceContext(
  "/api/faq",
  { reorderEndpoint: "/api/faq/reorder" }
);

export function FaqProvider({ children }) {
  return <_FaqProvider>{children}</_FaqProvider>;
}

export function useFaq() {
  const { items: faqs, ready, add, update, remove, reorder } = _useFaq();

  return {
    faqs,
    ready,
    addFaq: add,
    updateFaq: update,
    deleteFaq: remove,
    reorder,
  };
}
