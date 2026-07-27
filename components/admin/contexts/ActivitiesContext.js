"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { DEFAULT_ACTIVITIES } from "@/lib/data/activitiesData";

const STORAGE_KEY = "kosen_activities_admin";
const SEED_VERSION_KEY = "kosen_activities_admin_seed_version";
const SEED_VERSION = `v${DEFAULT_ACTIVITIES.length}r3`;

const ActivitiesContext = createContext(null);

export function ActivitiesProvider({ children }) {
  const [activities, setActivities] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let initial = DEFAULT_ACTIVITIES;
    try {
      const savedVersion = localStorage.getItem(SEED_VERSION_KEY);
      const stored = localStorage.getItem(STORAGE_KEY);
      const needsReset = !stored || savedVersion !== SEED_VERSION;
      if (needsReset) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_ACTIVITIES));
        localStorage.setItem(SEED_VERSION_KEY, SEED_VERSION);
      } else {
        initial = JSON.parse(stored);
      }
    } catch { /* use DEFAULT_ACTIVITIES */ }
    setActivities(initial);
    setReady(true);
  }, []);

  const persist = useCallback((next) => {
    setActivities(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const addActivity = useCallback((item) => {
    setActivities((prev) => {
      const next = [...prev, item];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const updateActivity = useCallback((id, data) => {
    setActivities((prev) => {
      const next = prev.map((a) => (a.id === id ? { ...a, ...data } : a));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const deleteActivity = useCallback((id) => {
    setActivities((prev) => {
      const next = prev.filter((a) => a.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const getActivity = useCallback(
    (id) => activities.find((a) => a.id === id) ?? null,
    [activities]
  );

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
