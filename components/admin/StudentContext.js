"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { DEFAULT_STUDENTS } from "@/lib/studentData";

const STORAGE_KEY = "kosen_students";
const SEED_VERSION_KEY = "kosen_students_seed_version";
const SEED_VERSION = `v${DEFAULT_STUDENTS.length}r4`;

const StudentContext = createContext(null);

export function StudentProvider({ children }) {
  const [students, setStudents] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let initial = DEFAULT_STUDENTS;
    try {
      const savedVersion = localStorage.getItem(SEED_VERSION_KEY);
      const stored = localStorage.getItem(STORAGE_KEY);
      const needsReset = !stored || savedVersion !== SEED_VERSION;
      if (needsReset) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_STUDENTS));
        localStorage.setItem(SEED_VERSION_KEY, SEED_VERSION);
      } else {
        initial = JSON.parse(stored);
      }
    } catch {
      /* use DEFAULT_STUDENTS */
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStudents(initial);
    setReady(true);
  }, []);

  const persist = useCallback((next) => {
    setStudents(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const addStudent = useCallback((student) => {
    const withId = student.id ? student : { ...student, id: crypto.randomUUID() };
    setStudents((prev) => {
      const next = [...prev, withId];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    return withId.id;
  }, []);

  const updateStudent = useCallback((id, data) => {
    setStudents((prev) => {
      const next = prev.map((s) => (s.id === id ? { ...s, ...data } : s));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const deleteStudent = useCallback((id) => {
    setStudents((prev) => {
      const next = prev.filter((s) => s.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const replaceAll = useCallback((list) => {
    setStudents(list);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    localStorage.setItem(SEED_VERSION_KEY, `custom-${list.length}`);
  }, []);

  const getStudent = useCallback(
    (id) => students.find((s) => s.id === id) ?? null,
    [students]
  );

  return (
    <StudentContext.Provider
      value={{ students, ready, addStudent, updateStudent, deleteStudent, getStudent, replaceAll }}
    >
      {children}
    </StudentContext.Provider>
  );
}

export function useStudents() {
  const ctx = useContext(StudentContext);
  if (!ctx) throw new Error("useStudents must be used inside <StudentProvider>");
  return ctx;
}
