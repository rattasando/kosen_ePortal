"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

const ActivitiesContext = createContext(null);

export function ActivitiesProvider({ children }) {
  const [activities, setActivities] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch("/api/activities")
      .then((r) => r.json())
      .then(setActivities)
      .catch(console.error)
      .finally(() => setReady(true));
  }, []);

  const addActivity = useCallback(async (item) => {
    const res = await fetch("/api/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    const created = await res.json();
    setActivities((prev) => [...prev, created]);
    return created;
  }, []);

  const updateActivity = useCallback(async (id, data) => {
    const res = await fetch(`/api/activities/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const updated = await res.json();
    setActivities((prev) => prev.map((a) => (a.id === id ? updated : a)));
    return updated;
  }, []);

  const deleteActivity = useCallback(async (id) => {
    await fetch(`/api/activities/${id}`, { method: "DELETE" });
    setActivities((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const getActivity = useCallback(
    (id) => activities.find((a) => a.id === id) ?? null,
    [activities]
  );

  const persist = useCallback(async () => {
    const res = await fetch("/api/activities");
    setActivities(await res.json());
  }, []);

  return (
    <ActivitiesContext.Provider value={{ activities, ready, addActivity, updateActivity, deleteActivity, getActivity, persist }}>
      {children}
    </ActivitiesContext.Provider>
  );
}

export function useActivities() {
  const ctx = useContext(ActivitiesContext);
  if (!ctx) throw new Error("useActivities must be used inside <ActivitiesProvider>");
  return ctx;
}
