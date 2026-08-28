/**
 * 33-activities-api.spec.js — ทดสอบ Activities API
 * ─────────────────────────────────────────────────────────────
 * GET    /api/activities              → list (+ ?status filter)
 * POST   /api/activities              → สร้างใหม่ (พร้อม blocks)
 * GET    /api/activities/:id          → รายละเอียด
 * PUT    /api/activities/:id          → อัปเดต (delete+create blocks)
 * DELETE /api/activities/:id          → ลบ
 */

import { test, expect } from "../fixtures/base.fixture.js";

let activityId = "";

test.beforeAll(async ({ apiRequest }) => {
  const ts = Date.now().toString().slice(-8);
  const res = await apiRequest.post("/api/activities", {
    data: {
      id:       `ACT-T-${ts}`,
      title:    `Test Activity ${ts}`,
      date:     "2025-01-15",
      status:   "published",
      featured: false,
      blocks: [
        { type: "paragraph", content: "Test content block", order: 1 },
      ],
    },
  });
  expect(res.status()).toBe(201);
  activityId = (await res.json()).id;
});

test.afterAll(async ({ apiRequest }) => {
  await apiRequest.delete(`/api/activities/${activityId}`).catch(() => {});
});

test("Activities API — GET list → 200 + array", async ({ apiRequest }) => {
  const res = await apiRequest.get("/api/activities");
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(Array.isArray(body)).toBe(true);
});

test("Activities API — GET :id → 200 + blocks included", async ({ apiRequest }) => {
  const res = await apiRequest.get(`/api/activities/${activityId}`);
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.id).toBe(activityId);
  expect(Array.isArray(body.blocks)).toBe(true);
  expect(body.blocks.length).toBe(1);
  expect(body.blocks[0].content).toBe("Test content block");
});

test("Activities API — GET :id ที่ไม่มี → 404", async ({ apiRequest }) => {
  const res = await apiRequest.get("/api/activities/ACT-NOTEXIST");
  expect(res.status()).toBe(404);
});

test("Activities API — GET ?status=published → เฉพาะ published", async ({ apiRequest }) => {
  const res = await apiRequest.get("/api/activities?status=published");
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(Array.isArray(body)).toBe(true);
  // ทุก record ต้องเป็น published
  body.forEach((a) => expect(a.status).toBe("published"));
});

test("Activities API — PUT :id → 200 + blocks ถูก replace", async ({ apiRequest }) => {
  const res = await apiRequest.put(`/api/activities/${activityId}`, {
    data: {
      title:  "Updated Activity",
      status: "published",
      blocks: [
        { type: "paragraph", content: "Updated block 1", order: 1 },
        { type: "paragraph", content: "Updated block 2", order: 2 },
      ],
    },
  });
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.title).toBe("Updated Activity");
  expect(body.blocks.length).toBe(2);
});

test("Activities API — DELETE :id → 200 แล้ว GET → 404", async ({ apiRequest }) => {
  const ts = Date.now().toString().slice(-8);
  const create = await apiRequest.post("/api/activities", {
    data: { id: `ACT-DEL-${ts}`, title: `Del Activity ${ts}`, status: "draft" },
  });
  expect(create.status()).toBe(201);
  const delId = (await create.json()).id;

  const res = await apiRequest.delete(`/api/activities/${delId}`);
  expect(res.status()).toBe(200);

  const check = await apiRequest.get(`/api/activities/${delId}`);
  expect(check.status()).toBe(404);
});
