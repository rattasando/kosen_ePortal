"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { DEFAULT_JOBS } from "@/lib/jobData";

const STORAGE_KEY = "kosen_jobs";
const SEED_VERSION_KEY = "kosen_jobs_seed_version";
const SEED_VERSION = `v${DEFAULT_JOBS.length}r8`;

const JobContext = createContext(null);

export function JobProvider({ children }) {
  const [jobs, setJobs] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let initial = DEFAULT_JOBS;
    try {
      const savedVersion = localStorage.getItem(SEED_VERSION_KEY);
      const stored = localStorage.getItem(STORAGE_KEY);
      const needsReset = !stored || savedVersion !== SEED_VERSION;
      if (needsReset) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_JOBS));
        localStorage.setItem(SEED_VERSION_KEY, SEED_VERSION);
      } else {
        initial = JSON.parse(stored);
      }
    } catch {
      /* use DEFAULT_JOBS */
    }
    setJobs(initial);
    setReady(true);
  }, []);

  const persist = useCallback((next) => {
    setJobs(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const addJob = useCallback((job) => {
    setJobs((prev) => {
      const next = [...prev, job];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const updateJob = useCallback((id, data) => {
    setJobs((prev) => {
      const next = prev.map((j) => (j.id === id ? { ...j, ...data } : j));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const deleteJob = useCallback((id) => {
    setJobs((prev) => {
      const next = prev.filter((j) => j.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const getJob = useCallback(
    (id) => jobs.find((j) => j.id === id) ?? null,
    [jobs]
  );

  const replaceAll = useCallback((list) => {
    setJobs(list);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    localStorage.setItem(SEED_VERSION_KEY, `custom-${list.length}`);
  }, []);

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
