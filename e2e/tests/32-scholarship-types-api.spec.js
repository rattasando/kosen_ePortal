/**
 * 32-scholarship-types-api.spec.js — ทดสอบ Scholarship Types API
 * ─────────────────────────────────────────────────────────────
 * GET    /api/scholarship-types         → list ทั้งหมด
 * POST   /api/scholarship-types         → สร้างใหม่
 * GET    /api/scholarship-types/:id     → รายละเอียด
 * PUT    /api/scholarship-types/:id     → อัปเดต
 * DELETE /api/scholarship-types/:id     → ลบ
 */

import { test, expect } from "../fixtures/base.fixture.js";

let typeId = "";

test.beforeAll(async ({ apiRequest }) => {
  const ts = Date.now().toString().slice(-8);
  const res = await apiRequest.post("/api/scholarship-types", {
    data: {
      id:   `SCH-T-${ts}`,
      slug: `test-scholarship-${ts}`,
      name: `Test Scholarship ${ts}`,
      status: "active",
      order: 99,
    },
  });
  expect(res.status()).toBe(201);
  typeId = (await res.json()).id;
});

test.afterAll(async ({ apiRequest }) => {
  await apiRequest.delete(`/api/scholarship-types/${typeId}`).catch(() => {});
});

test("Scholarship Types API — GET list → 200 + array", async ({ apiRequest }) => {
  const res = await apiRequest.get("/api/scholarship-types");
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(Array.isArray(body)).toBe(true);
});

test("Scholarship Types API — GET :id → 200 + ข้อมูลถูกต้อง", async ({ apiRequest }) => {
  const res = await apiRequest.get(`/api/scholarship-types/${typeId}`);
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.id).toBe(typeId);
  expect(body.name).toContain("Test Scholarship");
});

test("Scholarship Types API — GET :id ที่ไม่มี → 404", async ({ apiRequest }) => {
  const res = await apiRequest.get("/api/scholarship-types/SCH-NOTEXIST");
  expect(res.status()).toBe(404);
});

test("Scholarship Types API — PUT :id → 200 + ข้อมูลอัปเดต", async ({ apiRequest }) => {
  const res = await apiRequest.put(`/api/scholarship-types/${typeId}`, {
    data: { name: "Updated Scholarship Name" },
  });
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.name).toBe("Updated Scholarship Name");
});

test("Scholarship Types API — DELETE :id → 200", async ({ apiRequest }) => {
  const ts = Date.now().toString().slice(-8);
  const create = await apiRequest.post("/api/scholarship-types", {
    data: {
      id:   `SCH-DEL-${ts}`,
      slug: `del-scholarship-${ts}`,
      name: `Del Scholarship ${ts}`,
    },
  });
  expect(create.status()).toBe(201);
  const delId = (await create.json()).id;

  const res = await apiRequest.delete(`/api/scholarship-types/${delId}`);
  expect(res.status()).toBe(200);

  const check = await apiRequest.get(`/api/scholarship-types/${delId}`);
  expect(check.status()).toBe(404);
});
