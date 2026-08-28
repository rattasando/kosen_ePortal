/**
 * 31-news-categories-api.spec.js — ทดสอบ News Categories API
 * ─────────────────────────────────────────────────────────────
 * GET /api/news-categories    → list ทั้งหมด
 * POST /api/news-categories   → สร้างใหม่ (auto id: CAT-NNN)
 * หมายเหตุ: ไม่มี [id] route (GET/PUT/DELETE รายตัวยังไม่มี)
 */

import { test, expect } from "../fixtures/base.fixture.js";

test("News Categories API — GET /api/news-categories → 200 + array", async ({ apiRequest }) => {
  const res = await apiRequest.get("/api/news-categories");
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(Array.isArray(body)).toBe(true);
});

test("News Categories API — POST สร้าง category ใหม่ → 201 + id CAT-NNN", async ({ apiRequest }) => {
  const ts = Date.now().toString().slice(-8);
  const res = await apiRequest.post("/api/news-categories", {
    data: { name: `Test Category ${ts}`, color: "blue" },
  });
  expect(res.status()).toBe(201);
  const body = await res.json();
  expect(body.id).toMatch(/^CAT-\d{3}$/);
  expect(body.name).toContain(`Test Category ${ts}`);
});

test("News Categories API — POST category ซ้ำชื่อ → 500 (unique constraint)", async ({ apiRequest }) => {
  const ts = Date.now().toString().slice(-8);
  const name = `DupCat ${ts}`;
  await apiRequest.post("/api/news-categories", { data: { name, color: "red" } });
  const res2 = await apiRequest.post("/api/news-categories", { data: { name, color: "green" } });
  // ไม่มี withErrorHandler → 500 (P2002 ไม่ถูก map เป็น 409)
  expect(res2.status()).toBeGreaterThanOrEqual(400);
});

test("News Categories API — GET หลัง POST → เห็น category ใหม่ในรายการ", async ({ apiRequest }) => {
  const ts = Date.now().toString().slice(-8);
  const name = `ListCheck ${ts}`;
  await apiRequest.post("/api/news-categories", { data: { name, color: "purple" } });

  const res = await apiRequest.get("/api/news-categories");
  const body = await res.json();
  expect(body.some((c) => c.name === name)).toBe(true);
});
