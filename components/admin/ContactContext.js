"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  DEFAULT_CONTACT_MAIN,
  DEFAULT_CONTACT_UNIVERSITIES,
  DEFAULT_CONTACT_SOCIAL,
  CONTACT_STORAGE_KEY,
  CONTACT_SEED_KEY,
  CONTACT_SEED_VER,
} from "@/lib/contactData";

const ContactContext = createContext(null);

export function ContactProvider({ children }) {
  const [main, setMain]             = useState([]);
  const [universities, setUniversities] = useState([]);
  const [social, setSocial]         = useState([]);
  const [ready, setReady]           = useState(false);

  useEffect(() => {
    let data = { main: DEFAULT_CONTACT_MAIN, universities: DEFAULT_CONTACT_UNIVERSITIES, social: DEFAULT_CONTACT_SOCIAL };
    try {
      const savedVer = localStorage.getItem(CONTACT_SEED_KEY);
      const stored   = localStorage.getItem(CONTACT_STORAGE_KEY);
      if (stored && savedVer === CONTACT_SEED_VER) {
        data = JSON.parse(stored);
      } else {
        localStorage.setItem(CONTACT_STORAGE_KEY, JSON.stringify(data));
        localStorage.setItem(CONTACT_SEED_KEY, CONTACT_SEED_VER);
      }
    } catch { /* use defaults */ }
    setMain(data.main);
    setUniversities(data.universities);
    setSocial(data.social);
    setReady(true);
  }, []);

  const persist = useCallback((next) => {
    try { localStorage.setItem(CONTACT_STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  }, []);

  // ── Main office ──
  const updateMainItem  = useCallback((id, data) => {
    setMain((prev) => { const next = prev.map((i) => i.id === id ? { ...i, ...data } : i); persist({ main: next, universities, social }); return next; });
  }, [universities, social, persist]);
  const addMainItem     = useCallback((item) => {
    setMain((prev) => { const next = [...prev, item]; persist({ main: next, universities, social }); return next; });
  }, [universities, social, persist]);
  const deleteMainItem  = useCallback((id) => {
    setMain((prev) => { const next = prev.filter((i) => i.id !== id); persist({ main: next, universities, social }); return next; });
  }, [universities, social, persist]);
  const reorderMain     = useCallback((from, to) => {
    setMain((prev) => { const next = [...prev]; const [item] = next.splice(from, 1); next.splice(to, 0, item); persist({ main: next, universities, social }); return next; });
  }, [universities, social, persist]);

  // ── Universities ──
  const updateUniversity  = useCallback((id, data) => {
    setUniversities((prev) => { const next = prev.map((i) => i.id === id ? { ...i, ...data } : i); persist({ main, universities: next, social }); return next; });
  }, [main, social, persist]);
  const addUniversity     = useCallback((item) => {
    setUniversities((prev) => { const next = [...prev, item]; persist({ main, universities: next, social }); return next; });
  }, [main, social, persist]);
  const deleteUniversity  = useCallback((id) => {
    setUniversities((prev) => { const next = prev.filter((i) => i.id !== id); persist({ main, universities: next, social }); return next; });
  }, [main, social, persist]);
  const reorderUniversities = useCallback((from, to) => {
    setUniversities((prev) => { const next = [...prev]; const [item] = next.splice(from, 1); next.splice(to, 0, item); persist({ main, universities: next, social }); return next; });
  }, [main, social, persist]);

  // ── Social ──
  const updateSocial  = useCallback((id, data) => {
    setSocial((prev) => { const next = prev.map((i) => i.id === id ? { ...i, ...data } : i); persist({ main, universities, social: next }); return next; });
  }, [main, universities, persist]);
  const addSocial     = useCallback((item) => {
    setSocial((prev) => { const next = [...prev, item]; persist({ main, universities, social: next }); return next; });
  }, [main, universities, persist]);
  const deleteSocial  = useCallback((id) => {
    setSocial((prev) => { const next = prev.filter((i) => i.id !== id); persist({ main, universities, social: next }); return next; });
  }, [main, universities, persist]);
  const reorderSocial = useCallback((from, to) => {
    setSocial((prev) => { const next = [...prev]; const [item] = next.splice(from, 1); next.splice(to, 0, item); persist({ main, universities, social: next }); return next; });
  }, [main, universities, persist]);

  return (
    <ContactContext.Provider value={{
      main, universities, social, ready,
      updateMainItem, addMainItem, deleteMainItem, reorderMain,
      updateUniversity, addUniversity, deleteUniversity, reorderUniversities,
      updateSocial, addSocial, deleteSocial, reorderSocial,
    }}>
      {children}
    </ContactContext.Provider>
  );
}

export function useContact() {
  const ctx = useContext(ContactContext);
  if (!ctx) throw new Error("useContact must be used inside <ContactProvider>");
  return ctx;
}
