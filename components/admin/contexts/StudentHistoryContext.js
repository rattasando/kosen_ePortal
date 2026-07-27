"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

const HISTORY_KEY      = "kosen_student_history";
const MAX_EVENTS       = 500; // cap เพื่อไม่ให้ localStorage ใหญ่เกินไป

const HistoryContext = createContext(null);

export function StudentHistoryProvider({ children }) {
  const [events, setEvents] = useState([]);
  const [ready, setReady]   = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) setEvents(JSON.parse(stored));
    } catch { /* use empty */ }
    setReady(true);
  }, []);

  const persist = useCallback((next) => {
    setEvents(next);
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  }, []);

  // เพิ่ม event ใหม่เข้า history
  const addEvent = useCallback(({ studentId, type, before, after, changes, summary }) => {
    setEvents((prev) => {
      const event = {
        id:        `HIST${Date.now()}`,
        studentId,
        at:        new Date().toISOString(),
        by:        "admin",
        type,      // "create" | "update" | "delete"
        before:    before ?? null,
        after:     after  ?? null,
        changes:   changes ?? [],  // [{ field, label, before, after }]
        summary:   summary ?? "",
      };
      const next = [event, ...prev].slice(0, MAX_EVENTS);
      try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  // ดึง history ของนักเรียน 1 คน เรียงล่าสุดก่อน
  const getStudentHistory = useCallback(
    (studentId) => events.filter((e) => e.studentId === studentId),
    [events]
  );

  // ลบ history ทั้งหมดของนักเรียน 1 คน (ใช้ตอนลบนักเรียน)
  const clearStudentHistory = useCallback((studentId) => {
    persist(events.filter((e) => e.studentId !== studentId));
  }, [events, persist]);

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
