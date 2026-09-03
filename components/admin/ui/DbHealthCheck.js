"use client";

import { useEffect, useState } from "react";

export default function DbHealthCheck({ children }) {
  const [status, setStatus] = useState("checking"); // "checking" | "ok" | "error"
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setStatus("ok");
        } else {
          setErrorMsg(data.error ?? "ไม่สามารถเชื่อมต่อฐานข้อมูลได้");
          setStatus("error");
        }
      })
      .catch((err) => {
        setErrorMsg(err.message ?? "Network error");
        setStatus("error");
      });
  }, []);

  if (status === "checking") {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted">กำลังเชื่อมต่อฐานข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex h-screen items-center justify-center bg-background p-6">
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-surface p-8 text-center shadow-sm">
          {/* Icon */}
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 2.25v2.25m0 3.75v2.25M3.75 8.625v2.25m0 3.75v2.25" />
            </svg>
          </div>

          {/* Title */}
          <h1 className="mb-1 text-xl font-bold text-foreground">ไม่สามารถเชื่อมต่อฐานข้อมูลได้</h1>
          <p className="mb-5 text-sm text-muted">กรุณาตรวจสอบว่า PostgreSQL กำลังทำงานอยู่ แล้วลองใหม่อีกครั้ง</p>

          {/* Error detail */}
          {errorMsg && (
            <div className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-left">
              <p className="text-xs font-semibold text-red-600 mb-1">รายละเอียด</p>
              <p className="break-all font-mono text-xs text-red-500">{errorMsg}</p>
            </div>
          )}

          {/* Steps */}
          <div className="mb-6 rounded-lg border border-border bg-surface-muted px-4 py-3 text-left space-y-1.5">
            <p className="text-xs font-semibold text-foreground">วิธีแก้ไข</p>
            <ol className="list-decimal list-inside space-y-1 text-xs text-muted">
              <li>เปิด <span className="font-medium text-foreground">Postgres.app</span></li>
              <li>ตรวจสอบว่า Server แสดงสถานะ <span className="font-medium text-emerald-600">Running</span></li>
              <li>กดปุ่ม "ลองใหม่" ด้านล่าง</li>
            </ol>
          </div>

          {/* Retry button */}
          <button
            onClick={() => {
              setStatus("checking");
              setErrorMsg("");
              fetch("/api/health")
                .then((r) => r.json())
                .then((data) => {
                  if (data.ok) setStatus("ok");
                  else { setErrorMsg(data.error ?? ""); setStatus("error"); }
                })
                .catch((err) => { setErrorMsg(err.message ?? ""); setStatus("error"); });
            }}
            className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
          >
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }

  return children;
}
