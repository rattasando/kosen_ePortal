/**
 * 20-document-api.spec.js — ทดสอบ Documents API (CRUD)
 * ─────────────────────────────────────────────────────────────
 * POST /api/documents    — ต้องส่ง id เอง (String @id VarChar 20)
 * GET  /api/documents
 * GET  /api/documents/:id
 * PUT  /api/documents/:id
 * DELETE /api/documents/:id
 *
 * required: id (VarChar 20), title (VarChar 300)
 * optional: category, rawDate, fileType, fileSize, fileUrl, status (enum), etc.
 */

import { test, expect } from "../fixtures/base.fixture.js";

function makeDoc(overrides = {}) {
  const ts = Date.now().toString().slice(-8);
  return {
    id:     `D-T-${ts}`,         // ≤ 20 chars
    title:  `Doc Test ${ts}`,
    status: "published",
    rawDate: "2026-01-01",
    ...overrides,
  };
}

async function cleanup(apiRequest, id) {
  if (id) await apiRequest.delete(`/api/documents/${id}`).catch(() => {});
}

// ── CRUD พื้นฐาน ──────────────────────────────────────────────

test("POST /api/documents — สร้างเอกสารใหม่ → 201", async ({ apiRequest }) => {
  const d = makeDoc();
  const res = await apiRequest.post("/api/documents", { data: d });
  expect(res.status()).toBe(201);

  const body = await res.json();
  expect(body.id).toBe(d.id);
  expect(body.title).toBe(d.title);

  await cleanup(apiRequest, d.id);
});

test("GET /api/documents — คืน array", async ({ apiRequest }) => {
  const res = await apiRequest.get("/api/documents");
  expect(res.status()).toBe(200);
  expect(Array.isArray(await res.json())).toBe(true);
});

test("GET /api/documents/:id — ดึงเอกสารที่มีอยู่ → 200", async ({ apiRequest }) => {
  const d = makeDoc();
  await apiRequest.post("/api/documents", { data: d });

  const res = await apiRequest.get(`/api/documents/${d.id}`);
  expect(res.status()).toBe(200);
  expect((await res.json()).id).toBe(d.id);

  await cleanup(apiRequest, d.id);
});

test("GET /api/documents/:id — id ไม่มี → 404", async ({ apiRequest }) => {
  const res = await apiRequest.get("/api/documents/D-NONEXIST-99");
  expect(res.status()).toBe(404);
});

test("PUT /api/documents/:id — อัปเดต title สำเร็จ → 200", async ({ apiRequest }) => {
  const d = makeDoc();
  await apiRequest.post("/api/documents", { data: d });

  const newTitle = `${d.title} UPDATED`;
  const res = await apiRequest.put(`/api/documents/${d.id}`, {
    data: { title: newTitle },
  });
  expect(res.status()).toBe(200);
  expect((await res.json()).title).toBe(newTitle);

  await cleanup(apiRequest, d.id);
});

test("DELETE /api/documents/:id — ลบสำเร็จ + GET ซ้ำ → 404", async ({ apiRequest }) => {
  const d = makeDoc();
  await apiRequest.post("/api/documents", { data: d });

  expect((await apiRequest.delete(`/api/documents/${d.id}`)).status()).toBe(200);
  expect((await apiRequest.get(`/api/documents/${d.id}`)).status()).toBe(404);
});

test("POST /api/documents — id ซ้ำ → 409", async ({ apiRequest }) => {
  const d = makeDoc();
  await apiRequest.post("/api/documents", { data: d });

  const res = await apiRequest.post("/api/documents", { data: d });
  expect(res.status()).toBe(409);

  await cleanup(apiRequest, d.id);
});

test("GET /api/documents?status=published — กรองตาม status ได้", async ({ apiRequest }) => {
  const d = makeDoc({ status: "published" });
  await apiRequest.post("/api/documents", { data: d });

  const res = await apiRequest.get("/api/documents?status=published");
  expect(res.status()).toBe(200);
  const list = await res.json();
  expect(list.every((x) => x.status === "published")).toBe(true);

  await cleanup(apiRequest, d.id);
});
