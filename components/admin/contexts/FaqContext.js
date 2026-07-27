"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

const FaqContext = createContext(null);

export function FaqProvider({ children }) {
  const [faqs, setFaqs] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch("/api/faq")
      .then((r) => r.json())
      .then(setFaqs)
      .catch(console.error)
      .finally(() => setReady(true));
  }, []);

  const addFaq = useCallback(async (f) => {
    const res = await fetch("/api/faq", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(f),
    });
    const created = await res.json();
    setFaqs((prev) => [...prev, created]);
    return created;
  }, []);

  const updateFaq = useCallback(async (id, data) => {
    const res = await fetch(`/api/faq/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const updated = await res.json();
    setFaqs((prev) => prev.map((f) => (f.id === id ? updated : f)));
    return updated;
  }, []);

  const deleteFaq = useCallback(async (id) => {
    await fetch(`/api/faq/${id}`, { method: "DELETE" });
    setFaqs((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const reorder = useCallback(async (ordered) => {
    setFaqs(ordered);
    await fetch("/api/faq/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: ordered.map((f) => f.id) }),
    });
  }, []);

  return (
    <FaqContext.Provider value={{ faqs, ready, addFaq, updateFaq, deleteFaq, reorder }}>
      {children}
    </FaqContext.Provider>
  );
}

export function useFaq() {
  const ctx = useContext(FaqContext);
  if (!ctx) throw new Error("useFaq must be used inside <FaqProvider>");
  return ctx;
}
