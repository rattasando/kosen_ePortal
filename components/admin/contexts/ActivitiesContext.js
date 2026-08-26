"use client";

import { useCallback } from "react";
import { createResourceContext } from "@/lib/utils/createResourceContext";

const { Provider: _ActivitiesProvider, useResource: _useActivities } =
  createResourceContext("/api/activities");

export function ActivitiesProvider({ children }) {
  return <_ActivitiesProvider>{children}</_ActivitiesProvider>;
}

export function useActivities() {
  const { items: activities, ready, add, update, remove, refresh } = _useActivities();

  const getActivity = useCallback(
    (id) => activities.find((a) => a.id === id) ?? null,
    [activities]
  );

  return {
    activities,
    ready,
    addActivity: add,
    updateActivity: update,
    deleteActivity: remove,
    getActivity,
    persist: refresh,
  };
}
