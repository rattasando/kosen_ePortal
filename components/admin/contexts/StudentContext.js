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

  // Returns [{ id, message }] for every row that failed (empty array = all succeeded)
  const replaceAll = useCallback(async (list) => {
    const existingIds = new Set(students.map((s) => s.id));
    const errors = [];
    await Promise.all(
      list.map(async (item) => {
        const opts = {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        };
        try {
          const res = existingIds.has(item.id)
            ? await fetch(`/api/students/${item.id}`, { method: "PUT", ...opts })
            : await fetch("/api/students", { method: "POST", ...opts });
          if (!res.ok) {
            const json = await res.json().catch(() => ({}));
            errors.push({ id: item.id, message: json?.error ?? `API error ${res.status}` });
          }
        } catch (err) {
          errors.push({ id: item.id, message: err.message });
        }
      })
    );
    const fresh = await fetch("/api/students").then((r) => r.json());
    setStudents(fresh);
    return errors;
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
