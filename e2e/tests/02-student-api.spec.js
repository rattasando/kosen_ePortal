/**
 * 02-student-api.spec.js — ทดสอบ Student API ด้วย BVA
 * ─────────────────────────────────────────────────────────────
 * ทดสอบ POST /api/students พร้อม boundary value cases
 * ใช้ API call โดยตรง (ไม่ผ่าน UI) → เร็วและ deterministic
 *
 * ทุก test ที่สร้าง record จะ cleanup ตัวเองหลัง test เสร็จ
 *
 * Field limits (จาก lib/utils/studentFieldLimits.js):
 *   id:         VarChar(20)
 *   name:       VarChar(100)
 *   nationalId: VarChar(20)
 *   avatar:     VarChar(500)
 *   note:       Text — ไม่มี server-side limit
 */

import { test, expect } from "../fixtures/base.fixture.js";
import {
  makeId,
  STUDENT_MINIMAL,
  NAME_BOUNDARY_CASES,
  NATIONAL_ID_CASES,
  AVATAR_CASES,
  STUDENT_ID_CASES,
} from "../data/student.data.js";

// ── Helper ──────────────────────────────────────────────────

function makeStudent(overrides = {}) {
  const id = overrides.id !== undefined ? overrides.id : makeId();
  return { ...STUDENT_MINIMAL, ...overrides, id };
}

async function deleteStudent(request, id) {
  if (!id) return;
  await request.delete(`/api/students/${id}`).catch(() => {});
}

// ── CRUD พื้นฐาน ──────────────────────────────────────────────

test("POST /api/students — สร้าง student ใหม่สำเร็จ", async ({ apiRequest }) => {
  const id = makeId("P");
  const res = await apiRequest.post("/api/students", { data: makeStudent({ id }) });
  expect(res.status()).toBe(201);

  const body = await res.json();
  expect(body.id).toBe(id);
  expect(body.name).toBe(STUDENT_MINIMAL.name);

  await deleteStudent(apiRequest, id);
});

test("GET /api/students/:id — ดึงข้อมูล student ที่มีอยู่", async ({ apiRequest }) => {
  const id = makeId("G");
  await apiRequest.post("/api/students", { data: makeStudent({ id }) });

  const res = await apiRequest.get(`/api/students/${id}`);
  expect(res.status()).toBe(200);
  expect((await res.json()).id).toBe(id);

  await deleteStudent(apiRequest, id);
});

test("GET /api/students/:id — id ที่ไม่มีในระบบ → 404", async ({ apiRequest }) => {
  const res = await apiRequest.get("/api/students/NONEXIST9999");
  expect(res.status()).toBe(404);
});

test("PUT /api/students/:id — อัปเดต name สำเร็จ", async ({ apiRequest }) => {
  const id = makeId("U");
  await apiRequest.post("/api/students", { data: makeStudent({ id }) });

  const res = await apiRequest.put(`/api/students/${id}`, {
    data: { name: "ชื่อใหม่" },
  });
  expect(res.status()).toBe(200);
  expect((await res.json()).name).toBe("ชื่อใหม่");

  await deleteStudent(apiRequest, id);
});

test("DELETE /api/students/:id — ลบ student สำเร็จ", async ({ apiRequest }) => {
  const id = makeId("D");
  await apiRequest.post("/api/students", { data: makeStudent({ id }) });

  expect((await apiRequest.delete(`/api/students/${id}`)).status()).toBe(200);
  expect((await apiRequest.get(`/api/students/${id}`)).status()).toBe(404);
});

// ── BVA: name field (VarChar 100) ────────────────────────────

test.describe("BVA — name field (VarChar 100)", () => {
  for (const c of NAME_BOUNDARY_CASES) {
    test(c.label, async ({ apiRequest }) => {
      const id = makeId("N");
      const res = await apiRequest.post("/api/students", {
        data: makeStudent({ id, name: c.value }),
      });
      expect(res.status()).toBe(c.expectedStatus);

      if (c.expectedStatus === 201) await deleteStudent(apiRequest, id);
    });
  }
});

// ── BVA: nationalId field (VarChar 20) ───────────────────────

test.describe("BVA — nationalId field (VarChar 20)", () => {
  for (const c of NATIONAL_ID_CASES) {
    test(c.label, async ({ apiRequest }) => {
      const id = makeId("I");
      const res = await apiRequest.post("/api/students", {
        data: makeStudent({ id, nationalId: c.value || undefined }),
      });
      expect(res.status()).toBe(c.expectedStatus);

      if (c.expectedStatus === 201) await deleteStudent(apiRequest, id);
    });
  }
});

// ── BVA: avatar field (VarChar 500) ──────────────────────────
// note เป็น Text ไม่มี limit — ทดสอบ avatar (VarChar 500) แทน

test.describe("BVA — avatar field (VarChar 500)", () => {
  for (const c of AVATAR_CASES) {
    test(c.label, async ({ apiRequest }) => {
      const id = makeId("A");
      const res = await apiRequest.post("/api/students", {
        data: makeStudent({ id, avatar: c.value || undefined }),
      });
      expect(res.status()).toBe(c.expectedStatus);

      if (c.expectedStatus === 201) await deleteStudent(apiRequest, id);
    });
  }
});

// ── BVA: studentId (VarChar 20) ───────────────────────────────

test.describe("BVA — student id (VarChar 20)", () => {
  for (const c of STUDENT_ID_CASES) {
    test(c.label, async ({ apiRequest }) => {
      const res = await apiRequest.post("/api/students", {
        data: makeStudent({ id: c.value }),
      });
      expect(res.status()).toBe(c.expectedStatus);

      if (c.expectedStatus === 201) await deleteStudent(apiRequest, c.value);
    });
  }
});

// ── Duplicate ID → 409 ────────────────────────────────────────

test("POST /api/students — id ซ้ำ → 409 (unique constraint)", async ({ apiRequest }) => {
  const id = makeId("X");
  await apiRequest.post("/api/students", { data: makeStudent({ id }) });

  // POST ซ้ำ — Prisma P2002 → withErrorHandler แปลงเป็น 409
  const res = await apiRequest.post("/api/students", { data: makeStudent({ id }) });
  expect(res.status()).toBe(409);

  await deleteStudent(apiRequest, id);
});

// ── note field — Text ไม่มี limit ────────────────────────────

test("note field รับ text ยาวได้ไม่จำกัด (Text column)", async ({ apiRequest }) => {
  const id = makeId("T");
  const longNote = "ก".repeat(2000); // 2000 ตัว — เกินทุก VarChar limit แต่ Text รับได้
  const res = await apiRequest.post("/api/students", {
    data: makeStudent({ id, note: longNote }),
  });
  expect(res.status()).toBe(201);

  await deleteStudent(apiRequest, id);
});
