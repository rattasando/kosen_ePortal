/**
 * 19-alumni-api.spec.js — ทดสอบ Alumni API (CRUD)
 * ─────────────────────────────────────────────────────────────
 * POST /api/alumni    — ต้องส่ง id เอง (String @id VarChar 20)
 * GET  /api/alumni
 * GET  /api/alumni/:id
 * PUT  /api/alumni/:id
 * DELETE /api/alumni/:id
 *
 * required: id, name (VarChar 100), lastname (VarChar 100)
 * optional: major, university, graduatedYear, employmentHistory[], etc.
 */

import { test, expect } from "../fixtures/base.fixture.js";

function makeAlumni(overrides = {}) {
  const ts = Date.now().toString().slice(-8);
  return {
    id:       `ALU-T-${ts}`,     // ≤ 20 chars
    name:     "Alumni",
    lastname: `Test-${ts}`,
    major:    "ComputerEng",
    university: `Uni-${ts}`,
    graduatedYear: 2566,
    ...overrides,
  };
}

async function cleanup(apiRequest, id) {
  if (id) await apiRequest.delete(`/api/alumni/${id}`).catch(() => {});
}

// ── CRUD พื้นฐาน ──────────────────────────────────────────────

test("POST /api/alumni — สร้าง alumni ใหม่ → 201", async ({ apiRequest }) => {
  const a = makeAlumni();
  const res = await apiRequest.post("/api/alumni", { data: a });
  expect(res.status()).toBe(201);

  const body = await res.json();
  expect(body.id).toBe(a.id);
  expect(body.name).toBe(a.name);
  expect(body.lastname).toBe(a.lastname);

  await cleanup(apiRequest, a.id);
});

test("GET /api/alumni — คืน array", async ({ apiRequest }) => {
  const res = await apiRequest.get("/api/alumni");
  expect(res.status()).toBe(200);
  expect(Array.isArray(await res.json())).toBe(true);
});

test("GET /api/alumni/:id — ดึง alumni ที่มีอยู่ → 200", async ({ apiRequest }) => {
  const a = makeAlumni();
  await apiRequest.post("/api/alumni", { data: a });

  const res = await apiRequest.get(`/api/alumni/${a.id}`);
  expect(res.status()).toBe(200);
  expect((await res.json()).id).toBe(a.id);

  await cleanup(apiRequest, a.id);
});

test("GET /api/alumni/:id — id ไม่มี → 404", async ({ apiRequest }) => {
  const res = await apiRequest.get("/api/alumni/ALU-NONEXIST-99");
  expect(res.status()).toBe(404);
});

test("PUT /api/alumni/:id — อัปเดต remark สำเร็จ → 200", async ({ apiRequest }) => {
  const a = makeAlumni();
  await apiRequest.post("/api/alumni", { data: a });

  const newRemark = `Updated remark ${a.id}`;
  const res = await apiRequest.put(`/api/alumni/${a.id}`, {
    data: { remark: newRemark },
  });
  expect(res.status()).toBe(200);
  expect((await res.json()).remark).toBe(newRemark);

  await cleanup(apiRequest, a.id);
});

test("DELETE /api/alumni/:id — ลบสำเร็จ + GET ซ้ำ → 404", async ({ apiRequest }) => {
  const a = makeAlumni();
  await apiRequest.post("/api/alumni", { data: a });

  expect((await apiRequest.delete(`/api/alumni/${a.id}`)).status()).toBe(200);
  expect((await apiRequest.get(`/api/alumni/${a.id}`)).status()).toBe(404);
});

test("POST /api/alumni — id ซ้ำ → 409", async ({ apiRequest }) => {
  const a = makeAlumni();
  await apiRequest.post("/api/alumni", { data: a });

  const res = await apiRequest.post("/api/alumni", { data: a });
  expect(res.status()).toBe(409);

  await cleanup(apiRequest, a.id);
});

test("POST /api/alumni — พร้อม employmentHistory → 201 + history ถูกสร้าง", async ({ apiRequest }) => {
  const a = makeAlumni();
  const res = await apiRequest.post("/api/alumni", {
    data: {
      ...a,
      employmentHistory: [
        { company: "Acme Corp", position: "Engineer", startDate: "2023-01-01" },
      ],
    },
  });
  expect(res.status()).toBe(201);

  const body = await res.json();
  expect(body.employmentHistory).toHaveLength(1);
  expect(body.employmentHistory[0].company).toBe("Acme Corp");

  await cleanup(apiRequest, a.id);
});
