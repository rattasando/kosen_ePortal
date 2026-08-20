"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

const AlumniHistoryContext = createContext(null);

export function AlumniHistoryProvider({ children }) {
  const [events, setEvents] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch("/api/alumni-history")
      .then((r) => r.json())
      .then(setEvents)
      .catch(console.error)
      .finally(() => setReady(true));
  }, []);

  const addEvent = useCallback(async ({ alumniId, type, before, after, changes, summary, by }) => {
    const res = await fetch("/api/alumni-history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alumniId, type, before, after, changes, summary, by }),
    });
    const event = await res.json();
    setEvents((prev) => [event, ...prev].slice(0, 500));
    return event;
  }, []);

  const getAlumniHistory = useCallback(
    (alumniId) => events.filter((e) => e.alumniId === alumniId),
    [events]
  );

  const clearAlumniHistory = useCallback(async (alumniId) => {
    await fetch(`/api/alumni-history?alumniId=${alumniId}`, { method: "DELETE" });
    setEvents((prev) => prev.filter((e) => e.alumniId !== alumniId));
  }, []);

  return (
    <AlumniHistoryContext.Provider value={{ events, ready, addEvent, getAlumniHistory, clearAlumniHistory }}>
      {children}
    </AlumniHistoryContext.Provider>
  );
}

export function useAlumniHistory() {
  const ctx = useContext(AlumniHistoryContext);
  if (!ctx) throw new Error("useAlumniHistory must be used inside <AlumniHistoryProvider>");
  return ctx;
}
