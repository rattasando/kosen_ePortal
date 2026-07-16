"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const CREDENTIALS = { username: "admin", password: "kosen" };

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "", remember: false });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("kosen_remember_user");
    const savedPass = localStorage.getItem("kosen_remember_pass");
    if (savedUser && savedPass) {
      setForm({ username: savedUser, password: savedPass, remember: true });
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    await new Promise((r) => setTimeout(r, 500));

    if (
      form.username.trim() === CREDENTIALS.username &&
      form.password === CREDENTIALS.password
    ) {
      localStorage.setItem("kosen_auth", "1");
      if (form.remember) {
        localStorage.setItem("kosen_remember_user", form.username.trim());
        localStorage.setItem("kosen_remember_pass", form.password);
      } else {
        localStorage.removeItem("kosen_remember_user");
        localStorage.removeItem("kosen_remember_pass");
      }
      router.push("/admin");
    } else {
      setError("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="card w-full max-w-md p-8">
        {/* Logo */}
        <div className="text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl gradient-hero text-xl font-bold text-white">
            K
          </span>
          <h1 className="mt-4 text-2xl font-bold text-foreground">
            เข้าสู่ระบบ
          </h1>
          <p className="mt-1 text-sm text-muted">KOSEN Admin Portal</p>
        </div>

        {/* Demo hint */}
        <div className="mt-6 rounded-xl border border-accent bg-sky-50 px-4 py-3 text-xs text-accent">
          <span className="font-semibold">Demo:</span> username{" "}
          <span className="font-mono font-bold">admin</span> / password{" "}
          <span className="font-mono font-bold">kosen</span>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && (
            <div className="rounded-xl border border-danger bg-red-50 px-4 py-3 text-sm font-medium text-danger">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              ชื่อผู้ใช้
            </label>
            <input
              type="text"
              value={form.username}
              onChange={(e) =>
                setForm((p) => ({ ...p, username: e.target.value }))
              }
              placeholder="admin"
              autoComplete="username"
              required
              className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-accent-soft"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              รหัสผ่าน
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) =>
                setForm((p) => ({ ...p, password: e.target.value }))
              }
              placeholder="••••••••"
              autoComplete="current-password"
              required
              className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-accent-soft"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex cursor-pointer items-center gap-2 select-none">
              <input
                type="checkbox"
                checked={form.remember}
                onChange={(e) => setForm((p) => ({ ...p, remember: e.target.checked }))}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              <span className="text-sm text-muted">จดจำฉันไว้</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || !form.username || !form.password}
            className="btn-primary mt-2 w-full py-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                กำลังตรวจสอบ...
              </span>
            ) : (
              "เข้าสู่ระบบ"
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-muted">
          สำหรับเจ้าหน้าที่และผู้ดูแลระบบเท่านั้น
        </p>
      </div>
    </div>
  );
}
