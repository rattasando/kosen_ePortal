"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

const ContactContext = createContext(null);

const H = { "Content-Type": "application/json" };

export function ContactProvider({ children }) {
  const [main, setMain] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [social, setSocial] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/contact-info").then((r) => r.json()),
      fetch("/api/contact-universities").then((r) => r.json()),
      fetch("/api/contact-social").then((r) => r.json()),
    ])
      .then(([m, u, s]) => { setMain(m); setUniversities(u); setSocial(s); })
      .catch(console.error)
      .finally(() => setReady(true));
  }, []);

  // ── Main office ──
  const updateMainItem = useCallback(async (id, data) => {
    const res = await fetch(`/api/contact-info/${id}`, { method: "PUT", headers: H, body: JSON.stringify(data) });
    const updated = await res.json();
    setMain((prev) => prev.map((i) => (i.id === id ? updated : i)));
    return updated;
  }, []);

  const addMainItem = useCallback(async (item) => {
    const res = await fetch("/api/contact-info", { method: "POST", headers: H, body: JSON.stringify(item) });
    const created = await res.json();
    setMain((prev) => [...prev, created]);
    return created;
  }, []);

  const deleteMainItem = useCallback(async (id) => {
    await fetch(`/api/contact-info/${id}`, { method: "DELETE" });
    setMain((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const reorderMain = useCallback(async (from, to) => {
    setMain((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      fetch("/api/contact-info/reorder", {
        method: "PATCH",
        headers: H,
        body: JSON.stringify({ ids: next.map((i) => i.id) }),
      });
      return next;
    });
  }, []);

  // ── Universities ──
  const updateUniversity = useCallback(async (id, data) => {
    const res = await fetch(`/api/contact-universities/${id}`, { method: "PUT", headers: H, body: JSON.stringify(data) });
    const updated = await res.json();
    setUniversities((prev) => prev.map((i) => (i.id === id ? updated : i)));
    return updated;
  }, []);

  const addUniversity = useCallback(async (item) => {
    const res = await fetch("/api/contact-universities", { method: "POST", headers: H, body: JSON.stringify(item) });
    const created = await res.json();
    setUniversities((prev) => [...prev, created]);
    return created;
  }, []);

  const deleteUniversity = useCallback(async (id) => {
    await fetch(`/api/contact-universities/${id}`, { method: "DELETE" });
    setUniversities((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const reorderUniversities = useCallback(async (from, to) => {
    setUniversities((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      fetch("/api/contact-universities/reorder", {
        method: "PATCH",
        headers: H,
        body: JSON.stringify({ ids: next.map((i) => i.id) }),
      });
      return next;
    });
  }, []);

  // ── Social ──
  const updateSocial = useCallback(async (id, data) => {
    const res = await fetch(`/api/contact-social/${id}`, { method: "PUT", headers: H, body: JSON.stringify(data) });
    const updated = await res.json();
    setSocial((prev) => prev.map((i) => (i.id === id ? updated : i)));
    return updated;
  }, []);

  const addSocial = useCallback(async (item) => {
    const res = await fetch("/api/contact-social", { method: "POST", headers: H, body: JSON.stringify(item) });
    const created = await res.json();
    setSocial((prev) => [...prev, created]);
    return created;
  }, []);

  const deleteSocial = useCallback(async (id) => {
    await fetch(`/api/contact-social/${id}`, { method: "DELETE" });
    setSocial((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const reorderSocial = useCallback(async (from, to) => {
    setSocial((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      fetch("/api/contact-social/reorder", {
        method: "PATCH",
        headers: H,
        body: JSON.stringify({ ids: next.map((i) => i.id) }),
      });
      return next;
    });
  }, []);

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
