"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { DEFAULT_FAQS, FAQ_STORAGE_KEY, FAQ_SEED_KEY, FAQ_SEED_VER } from "@/lib/faqData";

const FaqContext = createContext(null);

export function FaqProvider({ children }) {
  const [faqs, setFaqs] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let initial = DEFAULT_FAQS;
    try {
      const savedVer = localStorage.getItem(FAQ_SEED_KEY);
      const stored   = localStorage.getItem(FAQ_STORAGE_KEY);
      if (stored && savedVer === FAQ_SEED_VER) {
        initial = JSON.parse(stored);
      } else {
        localStorage.setItem(FAQ_STORAGE_KEY, JSON.stringify(DEFAULT_FAQS));
        localStorage.setItem(FAQ_SEED_KEY, FAQ_SEED_VER);
      }
    } catch { /* use defaults */ }
    setFaqs(initial);
    setReady(true);
  }, []);

  const save = useCallback((next) => {
    setFaqs(next);
    try { localStorage.setItem(FAQ_STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  }, []);

  const addFaq    = useCallback((f)        => save([...faqs, f]),                                [faqs, save]);
  const updateFaq = useCallback((id, data) => save(faqs.map((f) => f.id === id ? { ...f, ...data } : f)), [faqs, save]);
  const deleteFaq = useCallback((id)       => save(faqs.filter((f) => f.id !== id)),             [faqs, save]);
  const reorder   = useCallback((ordered)  => save(ordered),                                     [save]);

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
