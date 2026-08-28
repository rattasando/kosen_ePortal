/**
 * 17-job-api.spec.js — ทดสอบ Job Positions API (CRUD)
 * ─────────────────────────────────────────────────────────────
 * POST /api/jobs    — ต้องส่ง id เอง (String @id VarChar 20)
 * GET  /api/jobs
 * GET  /api/jobs/:id
 * PUT  /api/jobs/:id
 * DELETE /api/jobs/:id
 *
 * required: id, title (VarChar 200)
 * optional: field, companyName, type, status (enum), etc.
 */

import { test, expect } from "../fixtures/base.fixture.js";

function makeJob(overrides = {}) {
  const ts = Date.now().toString().slice(-8);
  return {
    id:          `JOB-T-${ts}`,        // ≤ 20 chars
    title:       `Job Test ${ts}`,
    companyName: `Co Test ${ts}`,
    type:        "ฝึกงาน",
    field:       "วิศวกรรมคอมพิวเตอร์",
    status:      "เปิดรับสมัคร",
    ...overrides,
  };
}

async function cleanup(apiRequest, id) {
  if (id) await apiRequest.delete(`/api/jobs/${id}`).catch(() => {});
}

// ── CRUD พื้นฐาน ──────────────────────────────────────────────

test("POST /api/jobs — สร้างตำแหน่งงานใหม่ → 201", async ({ apiRequest }) => {
  const j = makeJob();
  const res = await apiRequest.post("/api/jobs", { data: j });
  expect(res.status()).toBe(201);

  const body = await res.json();
  expect(body.id).toBe(j.id);
  expect(body.title).toBe(j.title);

  await cleanup(apiRequest, j.id);
});

test("GET /api/jobs — คืน array", async ({ apiRequest }) => {
  const res = await apiRequest.get("/api/jobs");
  expect(res.status()).toBe(200);
  expect(Array.isArray(await res.json())).toBe(true);
});

test("GET /api/jobs/:id — ดึงตำแหน่งงานที่มีอยู่ → 200", async ({ apiRequest }) => {
  const j = makeJob();
  await apiRequest.post("/api/jobs", { data: j });

  const res = await apiRequest.get(`/api/jobs/${j.id}`);
  expect(res.status()).toBe(200);
  expect((await res.json()).id).toBe(j.id);

  await cleanup(apiRequest, j.id);
});

test("GET /api/jobs/:id — id ไม่มี → 404", async ({ apiRequest }) => {
  const res = await apiRequest.get("/api/jobs/JOB-NONEXIST-99");
  expect(res.status()).toBe(404);
});

test("PUT /api/jobs/:id — อัปเดต title สำเร็จ → 200", async ({ apiRequest }) => {
  const j = makeJob();
  await apiRequest.post("/api/jobs", { data: j });

  const newTitle = `${j.title} UPDATED`;
  const res = await apiRequest.put(`/api/jobs/${j.id}`, {
    data: { title: newTitle },
  });
  expect(res.status()).toBe(200);
  expect((await res.json()).title).toBe(newTitle);

  await cleanup(apiRequest, j.id);
});

test("DELETE /api/jobs/:id — ลบสำเร็จ + GET ซ้ำ → 404", async ({ apiRequest }) => {
  const j = makeJob();
  await apiRequest.post("/api/jobs", { data: j });

  expect((await apiRequest.delete(`/api/jobs/${j.id}`)).status()).toBe(200);
  expect((await apiRequest.get(`/api/jobs/${j.id}`)).status()).toBe(404);
});

test("POST /api/jobs — id ซ้ำ → 409", async ({ apiRequest }) => {
  const j = makeJob();
  await apiRequest.post("/api/jobs", { data: j });

  const res = await apiRequest.post("/api/jobs", { data: j });
  expect(res.status()).toBe(409);

  await cleanup(apiRequest, j.id);
});

test("GET /api/jobs?status=เปิดรับสมัคร — กรองตาม status ได้", async ({ apiRequest }) => {
  const j = makeJob({ status: "เปิดรับสมัคร" });
  await apiRequest.post("/api/jobs", { data: j });

  const res = await apiRequest.get("/api/jobs?status=เปิดรับสมัคร");
  expect(res.status()).toBe(200);
  const list = await res.json();
  expect(list.every((x) => x.status === "เปิดรับสมัคร")).toBe(true);

  await cleanup(apiRequest, j.id);
});
