"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [users, setUsers] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then(setUsers)
      .catch(console.error)
      .finally(() => setReady(true));
  }, []);

  const addUser = useCallback(async (user) => {
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
    });
    const created = await res.json();
    setUsers((prev) => [...prev, created]);
    return created;
  }, []);

  const updateUser = useCallback(async (id, data) => {
    const res = await fetch(`/api/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const updated = await res.json();
    setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
    return updated;
  }, []);

  const deleteUser = useCallback(async (id) => {
    await fetch(`/api/users/${id}`, { method: "DELETE" });
    setUsers((prev) => prev.filter((u) => u.id !== id));
  }, []);

  const getUser = useCallback(
    (id) => users.find((u) => u.id === id) ?? null,
    [users]
  );

  const persist = useCallback(async () => {
    const res = await fetch("/api/users");
    setUsers(await res.json());
  }, []);

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
