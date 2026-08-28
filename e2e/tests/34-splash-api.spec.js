/**
 * 34-splash-api.spec.js — ทดสอบ Splash Config API
 * ─────────────────────────────────────────────────────────────
 * GET /api/splash  → ดึง config (สร้างใหม่ถ้ายังไม่มี)
 * PUT /api/splash  → อัปเดต fields (whitelist + radius mapping)
 *
 * หมายเหตุ: record เดียวในระบบ ไม่มี [id] route
 */

import { test, expect } from "../fixtures/base.fixture.js";

test("Splash API — GET /api/splash → 200 + มี field หลัก", async ({ apiRequest }) => {
  const res = await apiRequest.get("/api/splash");
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body).toHaveProperty("enabled");
  expect(body).toHaveProperty("delayMs");
  expect(body).toHaveProperty("radius");
});

test("Splash API — PUT enabled=false → 200 + enabled อัปเดต", async ({ apiRequest }) => {
  const res = await apiRequest.put("/api/splash", {
    data: { enabled: false },
  });
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.enabled).toBe(false);
});

test("Splash API — PUT enabled=true + delayMs → 200 + ค่าตรง", async ({ apiRequest }) => {
  const res = await apiRequest.put("/api/splash", {
    data: { enabled: true, delayMs: 1500 },
  });
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.enabled).toBe(true);
  expect(body.delayMs).toBe(1500);
});

test("Splash API — PUT radius '2xl' → response คืน '2xl' (RADIUS_FROM_PRISMA)", async ({ apiRequest }) => {
  const res = await apiRequest.put("/api/splash", {
    data: { radius: "2xl" },
  });
  expect(res.status()).toBe(200);
  const body = await res.json();
  // API แปลง r2xl → 2xl ก่อน return
  expect(body.radius).toBe("2xl");
});

test("Splash API — PUT field ที่ไม่อยู่ใน whitelist → 200 (ถูก ignore)", async ({ apiRequest }) => {
  // id, createdAt ไม่ควรทำให้ error — whitelist filter กรองออก
  const res = await apiRequest.put("/api/splash", {
    data: { enabled: true, id: "should-be-ignored", createdAt: "2000-01-01" },
  });
  expect(res.status()).toBe(200);
});
