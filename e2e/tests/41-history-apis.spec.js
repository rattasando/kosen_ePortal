/**
 * 41-history-apis.spec.js — ทดสอบ History APIs
 * ─────────────────────────────────────────────────────────────
 * /api/student-history  GET(?studentId), POST, DELETE(?studentId)
 * /api/alumni-history   GET(?alumniId),  POST, DELETE(?alumniId)
 *
 * ทั้งคู่ไม่มี [id] route (ไม่สามารถดึง/ลบ event รายตัวได้)
 * DELETE ลบทุก event ของ student/alumni นั้นพร้อมกัน
 */

import { test, expect } from "../fixtures/base.fixture.js";

// ── student-history ──────────────────────────────────────────────────────────

test.describe("Student History API", () => {
  let studentId = "";

  test.beforeAll(async ({ apiRequest }) => {
    const ts = Date.now().toString().slice(-8);
    const res = await apiRequest.post("/api/students", {
      data: { name: "HistStu", lastname: `Test${ts}`, status: "กำลังศึกษา" },
    });
    expect(res.status()).toBe(201);
    studentId = (await res.json()).id;
  });

  test.afterAll(async ({ apiRequest }) => {
    await apiRequest.delete(`/api/student-history?studentId=${studentId}`).catch(() => {});
    await apiRequest.delete(`/api/students/${studentId}`).catch(() => {});
  });

  test("GET /api/student-history → 200 + array", async ({ apiRequest }) => {
    const res = await apiRequest.get("/api/student-history");
    expect(res.status()).toBe(200);
    expect(Array.isArray(await res.json())).toBe(true);
  });

  test("POST /api/student-history → 201 + event object", async ({ apiRequest }) => {
    const res = await apiRequest.post("/api/student-history", {
      data: {
        studentId,
        type:    "update",
        before:  { name: "Old" },
        after:   { name: "New" },
        changes: [{ field: "name", before: "Old", after: "New" }],
        summary: "เปลี่ยนชื่อ",
        by:      null, // changedBy เป็น FK → User ต้องส่ง null หรือ user id จริงเท่านั้น
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.studentId).toBe(studentId);
    expect(body.type).toBe("update");
    expect(body.summary).toBe("เปลี่ยนชื่อ");
  });

  test("GET ?studentId= → เฉพาะ student นั้น", async ({ apiRequest }) => {
    const res = await apiRequest.get(`/api/student-history?studentId=${studentId}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThanOrEqual(1);
    body.forEach((e) => expect(e.studentId).toBe(studentId));
  });

  test("GET ?studentId= แต่ student ไม่มีประวัติ → [] array ว่าง", async ({ apiRequest }) => {
    const res = await apiRequest.get("/api/student-history?studentId=STU-GHOST-99");
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  test("DELETE ?studentId= → 200 แล้ว GET → []", async ({ apiRequest }) => {
    // สร้าง event ก่อน
    await apiRequest.post("/api/student-history", {
      data: { studentId, type: "create", summary: "สร้าง", by: null },
    });
    const del = await apiRequest.delete(`/api/student-history?studentId=${studentId}`);
    expect(del.status()).toBe(200);
    const check = await (await apiRequest.get(`/api/student-history?studentId=${studentId}`)).json();
    expect(check).toEqual([]);
  });
});

// ── alumni-history ───────────────────────────────────────────────────────────

test.describe("Alumni History API", () => {
  let alumniId = "";

  test.beforeAll(async ({ apiRequest }) => {
    const ts = Date.now().toString().slice(-8);
    alumniId = `ALU-H-${ts}`;
    const res = await apiRequest.post("/api/alumni", {
      data: { id: alumniId, name: "HistAlu", lastname: `Test${ts}`, major: "Eng", graduatedYear: 2566 },
    });
    expect(res.status()).toBe(201);
  });

  test.afterAll(async ({ apiRequest }) => {
    await apiRequest.delete(`/api/alumni-history?alumniId=${alumniId}`).catch(() => {});
    await apiRequest.delete(`/api/alumni/${alumniId}`).catch(() => {});
  });

  test("GET /api/alumni-history → 200 + array", async ({ apiRequest }) => {
    const res = await apiRequest.get("/api/alumni-history");
    expect(res.status()).toBe(200);
    expect(Array.isArray(await res.json())).toBe(true);
  });

  test("POST /api/alumni-history → 201 + event object", async ({ apiRequest }) => {
    const res = await apiRequest.post("/api/alumni-history", {
      data: {
        alumniId,
        type:    "update",
        before:  { name: "OldName" },
        after:   { name: "NewName" },
        changes: [{ field: "name", before: "OldName", after: "NewName" }],
        summary: "เปลี่ยนชื่อ",
        by:      "admin",
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.alumniId).toBe(alumniId);
    expect(body.type).toBe("update");
    expect(body.summary).toBe("เปลี่ยนชื่อ");
  });

  test("GET ?alumniId= → เฉพาะ alumni นั้น", async ({ apiRequest }) => {
    const res = await apiRequest.get(`/api/alumni-history?alumniId=${alumniId}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.length).toBeGreaterThanOrEqual(1);
    body.forEach((e) => expect(e.alumniId).toBe(alumniId));
  });

  test("GET ?alumniId= ที่ไม่มีประวัติ → [] array ว่าง", async ({ apiRequest }) => {
    const res = await apiRequest.get("/api/alumni-history?alumniId=ALU-GHOST-99");
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  test("DELETE ?alumniId= → 200 แล้ว GET → []", async ({ apiRequest }) => {
    await apiRequest.post("/api/alumni-history", {
      data: { alumniId, type: "create", summary: "สร้าง", by: "test" },
    });
    const del = await apiRequest.delete(`/api/alumni-history?alumniId=${alumniId}`);
    expect(del.status()).toBe(200);
    const check = await (await apiRequest.get(`/api/alumni-history?alumniId=${alumniId}`)).json();
    expect(check).toEqual([]);
  });
});
