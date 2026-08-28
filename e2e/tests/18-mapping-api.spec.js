/**
 * 18-mapping-api.spec.js — ทดสอบ Applications/Mapping API (CRUD)
 * ─────────────────────────────────────────────────────────────
 * Mapping = JobApplication (table: job_applications)
 * POST /api/mappings    — auto-generate id (MAP-NNN), ต้องการ studentId + jobId
 * GET  /api/mappings
 * GET  /api/mappings/:id
 * PUT  /api/mappings/:id
 * DELETE /api/mappings/:id
 *
 * ต้องการ student + job ที่มีอยู่จริง → สร้างใน beforeAll / ลบใน afterAll
 */

import { test, expect } from "../fixtures/base.fixture.js";

let testStudentId = "";
let testJobId     = "";

test.beforeAll(async ({ apiRequest }) => {
  const ts = Date.now().toString().slice(-8);
  testJobId = `JOB-MAP-${ts}`;   // ≤ 20 chars

  // สร้าง student (auto-gen id)
  const stuRes = await apiRequest.post("/api/students", {
    data: { name: "MapAPI", lastname: "Test", status: "กำลังศึกษา" },
  });
  expect(stuRes.status()).toBe(201);
  testStudentId = (await stuRes.json()).id;

  // สร้าง job (id ต้องระบุ)
  const jobRes = await apiRequest.post("/api/jobs", {
    data: {
      id:          testJobId,
      title:       `Job for Mapping ${ts}`,
      companyName: `Co Map ${ts}`,
      type:        "ฝึกงาน",
      field:       "วิศวกรรมคอมพิวเตอร์",
      status:      "เปิดรับสมัคร",
    },
  });
  expect(jobRes.status()).toBe(201);
});

test.afterAll(async ({ apiRequest }) => {
  if (testStudentId) await apiRequest.delete(`/api/students/${testStudentId}`).catch(() => {});
  if (testJobId)     await apiRequest.delete(`/api/jobs/${testJobId}`).catch(() => {});
});

async function cleanup(apiRequest, id) {
  if (id) await apiRequest.delete(`/api/mappings/${id}`).catch(() => {});
}

// ── CRUD พื้นฐาน ──────────────────────────────────────────────

test("POST /api/mappings — สร้าง mapping ใหม่ → 201 + auto id MAP-NNN", async ({ apiRequest }) => {
  const res = await apiRequest.post("/api/mappings", {
    data: { studentId: testStudentId, jobId: testJobId, status: "สมัครแล้ว" },
  });
  expect(res.status()).toBe(201);

  const body = await res.json();
  expect(body.id).toMatch(/^MAP-\d{3}$/);
  expect(body.studentId).toBe(testStudentId);
  expect(body.jobId).toBe(testJobId);

  await cleanup(apiRequest, body.id);
});

test("GET /api/mappings — คืน array", async ({ apiRequest }) => {
  const res = await apiRequest.get("/api/mappings");
  expect(res.status()).toBe(200);
  expect(Array.isArray(await res.json())).toBe(true);
});

test("GET /api/mappings/:id — ดึง mapping ที่มีอยู่ → 200", async ({ apiRequest }) => {
  const created = await apiRequest.post("/api/mappings", {
    data: { studentId: testStudentId, jobId: testJobId, status: "สมัครแล้ว" },
  });
  const { id } = await created.json();

  const res = await apiRequest.get(`/api/mappings/${id}`);
  expect(res.status()).toBe(200);
  expect((await res.json()).id).toBe(id);

  await cleanup(apiRequest, id);
});

test("GET /api/mappings/:id — id ไม่มี → 404", async ({ apiRequest }) => {
  const res = await apiRequest.get("/api/mappings/MAP-999");
  expect(res.status()).toBe(404);
});

test("PUT /api/mappings/:id — อัปเดต status สำเร็จ → 200", async ({ apiRequest }) => {
  const created = await apiRequest.post("/api/mappings", {
    data: { studentId: testStudentId, jobId: testJobId, status: "สมัครแล้ว" },
  });
  const { id } = await created.json();

  const res = await apiRequest.put(`/api/mappings/${id}`, {
    data: { status: "ผ่านการคัดเลือก" },
  });
  expect(res.status()).toBe(200);
  expect((await res.json()).status).toBe("ผ่านการคัดเลือก");

  await cleanup(apiRequest, id);
});

test("DELETE /api/mappings/:id — ลบสำเร็จ + GET ซ้ำ → 404", async ({ apiRequest }) => {
  const created = await apiRequest.post("/api/mappings", {
    data: { studentId: testStudentId, jobId: testJobId, status: "สมัครแล้ว" },
  });
  const { id } = await created.json();

  expect((await apiRequest.delete(`/api/mappings/${id}`)).status()).toBe(200);
  expect((await apiRequest.get(`/api/mappings/${id}`)).status()).toBe(404);
});

test("POST /api/mappings — ขาด studentId → 400", async ({ apiRequest }) => {
  const res = await apiRequest.post("/api/mappings", {
    data: { jobId: testJobId },
  });
  expect(res.status()).toBe(400);
});

test("POST /api/mappings — ขาด jobId → 400", async ({ apiRequest }) => {
  const res = await apiRequest.post("/api/mappings", {
    data: { studentId: testStudentId },
  });
  expect(res.status()).toBe(400);
});
