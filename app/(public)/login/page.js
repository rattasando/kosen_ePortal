"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      username: form.username.trim(),
      password: form.password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
    } else {
      router.push("/admin");
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
              placeholder="username"
              autoComplete="username"
              required
              autoFocus
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
