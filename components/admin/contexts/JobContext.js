"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

const JobContext = createContext(null);

export function JobProvider({ children }) {
  const [jobs, setJobs] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch("/api/jobs")
      .then((r) => r.json())
      .then(setJobs)
      .catch(console.error)
      .finally(() => setReady(true));
  }, []);

  const addJob = useCallback(async (job) => {
    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(job),
    });
    const created = await res.json();
    setJobs((prev) => [...prev, created]);
    return created;
  }, []);

  const updateJob = useCallback(async (id, data) => {
    const res = await fetch(`/api/jobs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const updated = await res.json();
    setJobs((prev) => prev.map((j) => (j.id === id ? updated : j)));
    return updated;
  }, []);

  const deleteJob = useCallback(async (id) => {
    await fetch(`/api/jobs/${id}`, { method: "DELETE" });
    setJobs((prev) => prev.filter((j) => j.id !== id));
  }, []);

  const getJob = useCallback(
    (id) => jobs.find((j) => j.id === id) ?? null,
    [jobs]
  );

  const replaceAll = useCallback(async (list) => {
    const existingIds = new Set(jobs.map((j) => j.id));
    await Promise.all(
      list.map((item) => {
        const opts = {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        };
        return existingIds.has(item.id)
          ? fetch(`/api/jobs/${item.id}`, { method: "PUT", ...opts })
          : fetch("/api/jobs", { method: "POST", ...opts });
      })
    );
    const fresh = await fetch("/api/jobs").then((r) => r.json());
    setJobs(fresh);
  }, [jobs]);

  return (
    <JobContext.Provider value={{ jobs, ready, addJob, updateJob, deleteJob, getJob, replaceAll }}>
      {children}
    </JobContext.Provider>
  );
}

export function useJobs() {
  const ctx = useContext(JobContext);
  if (!ctx) throw new Error("useJobs must be used inside <JobProvider>");
  return ctx;
}
