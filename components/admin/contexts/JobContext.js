"use client";

import { useCallback } from "react";
import { createResourceContext } from "@/lib/utils/createResourceContext";

const { Provider: _JobProvider, useResource: _useJobs } =
  createResourceContext("/api/jobs");

export function JobProvider({ children }) {
  return <_JobProvider>{children}</_JobProvider>;
}

export function useJobs() {
  const { items: jobs, ready, add, update, remove, refresh } = _useJobs();

  const getJob = useCallback(
    (id) => jobs.find((j) => j.id === id) ?? null,
    [jobs]
  );

  /**
   * replaceAll — upsert รายการทั้งหมดในครั้งเดียว (ใช้ใน import CSV)
   * PUT สำหรับ id ที่มีอยู่แล้ว, POST สำหรับ id ใหม่
   */
  const replaceAll = useCallback(
    async (list) => {
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
      await refresh();
    },
    [jobs, refresh]
  );

  return { jobs, ready, addJob: add, updateJob: update, deleteJob: remove, getJob, replaceAll };
}
