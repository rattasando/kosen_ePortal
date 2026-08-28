/**
 * 36-internships-api.spec.js — ทดสอบ Internships API
 * ─────────────────────────────────────────────────────────────
 * GET    /api/internships              → list (+ ?studentId filter)
 * POST   /api/internships              → สร้างใหม่ (ต้องมี studentId จริง)
 * GET    /api/internships/:id          → รายละเอียด
 * PUT    /api/internships/:id          → อัปเดต
 * DELETE /api/internships/:id          → ลบ
 */

import { test, expect } from "../fixtures/base.fixture.js";

let internshipId = "";
let studentId    = "";

test.beforeAll(async ({ apiRequest }) => {
  const ts = Date.now().toString().slice(-8);

  // สร้าง student จริงก่อน (internship ต้องมี studentId ที่อยู่ใน DB)
  const stuRes = await apiRequest.post("/api/students", {
    data: {
      name:     "InternStu",
      lastname: `Test${ts}`,
      status:   "กำลังศึกษา",
    },
  });
  expect(stuRes.status()).toBe(201);
  studentId = (await stuRes.json()).id;

  // สร้าง internship
  const res = await apiRequest.post("/api/internships", {
    data: {
      id:             `INT-T-${ts}`,
      studentId,
      hoursCompleted: 0,
      hoursRequired:  480,
      status:         "กำลังฝึกงาน",
    },
  });
  expect(res.status()).toBe(201);
  internshipId = (await res.json()).id;
});

test.afterAll(async ({ apiRequest }) => {
  await apiRequest.delete(`/api/internships/${internshipId}`).catch(() => {});
  await apiRequest.delete(`/api/students/${studentId}`).catch(() => {});
});

test("Internships API — GET list → 200 + array", async ({ apiRequest }) => {
  const res = await apiRequest.get("/api/internships");
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(Array.isArray(body)).toBe(true);
});

test("Internships API — GET ?studentId= → เฉพาะ studentId นั้น", async ({ apiRequest }) => {
  const res = await apiRequest.get(`/api/internships?studentId=${studentId}`);
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(Array.isArray(body)).toBe(true);
  expect(body.length).toBeGreaterThanOrEqual(1);
  body.forEach((i) => expect(i.studentId).toBe(studentId));
});

test("Internships API — GET :id → 200 + ข้อมูลถูกต้อง", async ({ apiRequest }) => {
  const res = await apiRequest.get(`/api/internships/${internshipId}`);
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.id).toBe(internshipId);
  expect(body.studentId).toBe(studentId);
  expect(body.status).toBe("กำลังฝึกงาน");
});

test("Internships API — GET :id ที่ไม่มี → 404", async ({ apiRequest }) => {
  const res = await apiRequest.get("/api/internships/INT-NOTEXIST");
  expect(res.status()).toBe(404);
});

test("Internships API — PUT :id อัปเดต hoursCompleted → 200", async ({ apiRequest }) => {
  const res = await apiRequest.put(`/api/internships/${internshipId}`, {
    data: { hoursCompleted: 240, status: "กำลังฝึกงาน" },
  });
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.hoursCompleted).toBe(240);
});

test("Internships API — DELETE :id → 200 แล้ว GET → 404", async ({ apiRequest }) => {
  const ts = Date.now().toString().slice(-8);
  const create = await apiRequest.post("/api/internships", {
    data: { id: `INT-DEL-${ts}`, studentId, hoursRequired: 100 },
  });
  expect(create.status()).toBe(201);
  const delId = (await create.json()).id;

  const res = await apiRequest.delete(`/api/internships/${delId}`);
  expect(res.status()).toBe(200);

  const check = await apiRequest.get(`/api/internships/${delId}`);
  expect(check.status()).toBe(404);
});
