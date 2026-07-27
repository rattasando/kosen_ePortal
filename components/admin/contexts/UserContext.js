"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { DEFAULT_USERS } from "@/lib/data/userData";

const STORAGE_KEY = "kosen_users";
const SEED_VERSION_KEY = "kosen_users_seed_version";
const SEED_VERSION = `v${DEFAULT_USERS.length}r3`;

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [users, setUsers] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let initial = DEFAULT_USERS;
    try {
      const savedVersion = localStorage.getItem(SEED_VERSION_KEY);
      const stored = localStorage.getItem(STORAGE_KEY);
      const needsReset = !stored || savedVersion !== SEED_VERSION;
      if (needsReset) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
        localStorage.setItem(SEED_VERSION_KEY, SEED_VERSION);
      } else {
        initial = JSON.parse(stored);
      }
    } catch { /* use DEFAULT_USERS */ }
    setUsers(initial);
    setReady(true);
  }, []);

  const persist = useCallback((next) => {
    setUsers(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const addUser = useCallback((user) => {
    setUsers((prev) => {
      const next = [...prev, user];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const updateUser = useCallback((id, data) => {
    setUsers((prev) => {
      const next = prev.map((u) => (u.id === id ? { ...u, ...data } : u));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const deleteUser = useCallback((id) => {
    setUsers((prev) => {
      const next = prev.filter((u) => u.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const getUser = useCallback(
    (id) => users.find((u) => u.id === id) ?? null,
    [users]
  );

  return (
    <UserContext.Provider value={{ users, ready, addUser, updateUser, deleteUser, getUser, persist }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUsers() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUsers must be used inside <UserProvider>");
  return ctx;
}
