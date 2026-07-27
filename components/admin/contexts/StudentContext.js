"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

const StudentContext = createContext(null);

async function apiFetch(url, opts) {
  const res = await fetch(url, opts);
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error ?? `API error ${res.status}`);
  return json;
}

export function StudentProvider({ children }) {
  const [students, setStudents] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch("/api/students")
      .then((r) => r.json())
      .then(setStudents)
      .catch(console.error)
      .finally(() => setReady(true));
  }, []);

  const addStudent = useCallback(async (student) => {
    const created = await apiFetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(student),
    });
    setStudents((prev) => [...prev, created]);
    return created.id;
  }, []);

  const updateStudent = useCallback(async (id, data) => {
    const updated = await apiFetch(`/api/students/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setStudents((prev) => prev.map((s) => (s.id === id ? updated : s)));
    return updated;
  }, []);

  const deleteStudent = useCallback(async (id) => {
    await fetch(`/api/students/${id}`, { method: "DELETE" });
    setStudents((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const getStudent = useCallback(
    (id) => students.find((s) => s.id === id) ?? null,
    [students]
  );

  const replaceAll = useCallback(async (list) => {
    const existingIds = new Set(students.map((s) => s.id));
    await Promise.all(
      list.map((item) => {
        const opts = {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        };
        return existingIds.has(item.id)
          ? fetch(`/api/students/${item.id}`, { method: "PUT", ...opts })
          : fetch("/api/students", { method: "POST", ...opts });
      })
    );
    const fresh = await fetch("/api/students").then((r) => r.json());
    setStudents(fresh);
  }, [students]);

  return (
    <StudentContext.Provider value={{ students, ready, addStudent, updateStudent, deleteStudent, getStudent, replaceAll }}>
      {children}
    </StudentContext.Provider>
  );
}

export function useStudents() {
  const ctx = useContext(StudentContext);
  if (!ctx) throw new Error("useStudents must be used inside <StudentProvider>");
  return ctx;
}
