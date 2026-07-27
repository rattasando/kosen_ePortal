"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

const HistoryContext = createContext(null);

export function StudentHistoryProvider({ children }) {
  const [events, setEvents] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch("/api/student-history")
      .then((r) => r.json())
      .then(setEvents)
      .catch(console.error)
      .finally(() => setReady(true));
  }, []);

  const addEvent = useCallback(async ({ studentId, type, before, after, changes, summary, by }) => {
    const res = await fetch("/api/student-history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, type, before, after, changes, summary, by }),
    });
    const event = await res.json();
    setEvents((prev) => [event, ...prev].slice(0, 500));
    return event;
  }, []);

  const getStudentHistory = useCallback(
    (studentId) => events.filter((e) => e.studentId === studentId),
    [events]
  );

  const clearStudentHistory = useCallback(async (studentId) => {
    await fetch(`/api/student-history?studentId=${studentId}`, { method: "DELETE" });
    setEvents((prev) => prev.filter((e) => e.studentId !== studentId));
  }, []);

  return (
    <HistoryContext.Provider value={{ events, ready, addEvent, getStudentHistory, clearStudentHistory }}>
      {children}
    </HistoryContext.Provider>
  );
}

export function useStudentHistory() {
  const ctx = useContext(HistoryContext);
  if (!ctx) throw new Error("useStudentHistory must be used inside <StudentHistoryProvider>");
  return ctx;
}
