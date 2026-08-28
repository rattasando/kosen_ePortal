/**
 * 42-news-categories-id-api.spec.js — ทดสอบ News Categories [id] route
 * ─────────────────────────────────────────────────────────────
 * PUT    /api/news-categories/:id  → อัปเดต name/color/order
 * DELETE /api/news-categories/:id  → ลบ
 *
 * หมายเหตุ: ไม่มี GET/:id route (31 ทดสอบ list + create แล้ว)
 */

import { test, expect } from "../fixtures/base.fixture.js";

let categoryId = "";

test.beforeAll(async ({ apiRequest }) => {
  const ts = Date.now().toString().slice(-8);
  const res = await apiRequest.post("/api/news-categories", {
    data: { name: `IdTest Category ${ts}`, color: "bg-blue-100 text-blue-700" },
  });
  expect(res.status()).toBe(201);
  categoryId = (await res.json()).id;
});

test.afterAll(async ({ apiRequest }) => {
  // ถ้า test DELETE ผ่านแล้ว record อาจถูกลบไปแล้ว — catch error
  await apiRequest.delete(`/api/news-categories/${categoryId}`).catch(() => {});
});

test("News Categories [id] — PUT :id → 200 + name อัปเดต", async ({ apiRequest }) => {
  const res = await apiRequest.put(`/api/news-categories/${categoryId}`, {
    data: { name: "Updated Category Name", color: "bg-green-100 text-green-700", order: 10 },
  });
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.name).toBe("Updated Category Name");
  expect(body.color).toBe("bg-green-100 text-green-700");
});

test("News Categories [id] — PUT :id ที่ไม่มี → 500 (ไม่มี withErrorHandler → P2025 ไม่ map เป็น 404)", async ({ apiRequest }) => {
  const res = await apiRequest.put("/api/news-categories/CAT-NOTEXIST", {
    data: { name: "Ghost", color: "red" },
  });
  // route นี้ใช้ bare try/catch → 500 (ยังไม่ได้ใช้ withErrorHandler)
  expect(res.status()).toBeGreaterThanOrEqual(400);
});

test("News Categories [id] — GET list หลัง PUT → name ใหม่ปรากฏ", async ({ apiRequest }) => {
  const list = await (await apiRequest.get("/api/news-categories")).json();
  const found = list.find((c) => c.id === categoryId);
  expect(found).toBeTruthy();
  expect(found.name).toBe("Updated Category Name");
});

test("News Categories [id] — DELETE :id → 200 แล้วหายจาก list", async ({ apiRequest }) => {
  const ts  = Date.now().toString().slice(-8);
  // สร้างอันใหม่เพื่อลบ
  const create = await apiRequest.post("/api/news-categories", {
    data: { name: `Del Cat ${ts}`, color: "bg-red-100 text-red-700" },
  });
  expect(create.status()).toBe(201);
  const delId = (await create.json()).id;

  const res = await apiRequest.delete(`/api/news-categories/${delId}`);
  expect(res.status()).toBe(200);

  // ตรวจว่าหายจาก list แล้ว
  const list = await (await apiRequest.get("/api/news-categories")).json();
  expect(list.some((c) => c.id === delId)).toBe(false);
});
