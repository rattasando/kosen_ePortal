/**
 * 16-company-api.spec.js — ทดสอบ Company API (CRUD)
 * ─────────────────────────────────────────────────────────────
 * POST /api/companies    — ต้องส่ง id เอง (String @id, ไม่ auto-gen)
 * GET  /api/companies
 * GET  /api/companies/:id
 * PUT  /api/companies/:id
 * DELETE /api/companies/:id
 *
 * required fields: id (VarChar 20), name (VarChar 200)
 */

import { test, expect } from "../fixtures/base.fixture.js";

function makeCompany(overrides = {}) {
  const ts = Date.now().toString().slice(-8);
  return {
    id:   `COM-T-${ts}`,          // ≤ 20 chars
    name: `Company Test ${ts}`,
    ...overrides,
  };
}

async function cleanup(apiRequest, id) {
  if (id) await apiRequest.delete(`/api/companies/${id}`).catch(() => {});
}

// ── CRUD พื้นฐาน ──────────────────────────────────────────────

test("POST /api/companies — สร้างบริษัทใหม่สำเร็จ → 201", async ({ apiRequest }) => {
  const c = makeCompany();
  const res = await apiRequest.post("/api/companies", { data: c });
  expect(res.status()).toBe(201);

  const body = await res.json();
  expect(body.id).toBe(c.id);
  expect(body.name).toBe(c.name);

  await cleanup(apiRequest, c.id);
});

test("GET /api/companies — คืน array", async ({ apiRequest }) => {
  const res = await apiRequest.get("/api/companies");
  expect(res.status()).toBe(200);
  expect(Array.isArray(await res.json())).toBe(true);
});

test("GET /api/companies/:id — ดึงบริษัทที่มีอยู่ → 200", async ({ apiRequest }) => {
  const c = makeCompany();
  await apiRequest.post("/api/companies", { data: c });

  const res = await apiRequest.get(`/api/companies/${c.id}`);
  expect(res.status()).toBe(200);
  expect((await res.json()).id).toBe(c.id);

  await cleanup(apiRequest, c.id);
});

test("GET /api/companies/:id — id ไม่มี → 404", async ({ apiRequest }) => {
  const res = await apiRequest.get("/api/companies/COM-NONEXIST-99");
  expect(res.status()).toBe(404);
});

test("PUT /api/companies/:id — อัปเดต name สำเร็จ → 200", async ({ apiRequest }) => {
  const c = makeCompany();
  await apiRequest.post("/api/companies", { data: c });

  const newName = `Updated ${c.name}`;
  const res = await apiRequest.put(`/api/companies/${c.id}`, {
    data: { name: newName },
  });
  expect(res.status()).toBe(200);
  expect((await res.json()).name).toBe(newName);

  await cleanup(apiRequest, c.id);
});

test("DELETE /api/companies/:id — ลบสำเร็จ + GET ซ้ำ → 404", async ({ apiRequest }) => {
  const c = makeCompany();
  await apiRequest.post("/api/companies", { data: c });

  expect((await apiRequest.delete(`/api/companies/${c.id}`)).status()).toBe(200);
  expect((await apiRequest.get(`/api/companies/${c.id}`)).status()).toBe(404);
});

test("POST /api/companies — id ซ้ำ → 409", async ({ apiRequest }) => {
  const c = makeCompany();
  await apiRequest.post("/api/companies", { data: c });

  const res = await apiRequest.post("/api/companies", { data: c });
  expect(res.status()).toBe(409);

  await cleanup(apiRequest, c.id);
});
