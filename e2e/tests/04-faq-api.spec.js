/**
 * 04-faq-api.spec.js — ทดสอบ FAQ API ด้วย BVA
 * ─────────────────────────────────────────────────────────────
 * FAQ id รูปแบบ FAQ001 — client-generated (ไม่มี @default ใน schema)
 * VarChar limits:
 *   id:       VarChar(20) → "FAQxxxxxxx" ≤ 20 ตัว
 *   category: VarChar(100)
 *   question, answer: Text (ไม่มี limit)
 */

import { test, expect } from "../fixtures/base.fixture.js";
import {
  FAQ_VALID,
  QUESTION_CASES,
  CATEGORY_CASES,
} from "../data/faq.data.js";

// ── ID helper (≤ 20 ตัว) ────────────────────────────────────

let _seq = 0;
const makeFaqId = () => `FT${Date.now().toString().slice(-8)}${String(++_seq).padStart(2,"0")}`;

function makeFaq(overrides = {}) {
  return { id: makeFaqId(), ...FAQ_VALID, ...overrides };
}

async function deleteFaq(request, id) {
  await request.delete(`/api/faq/${id}`).catch(() => {});
}

// ── CRUD พื้นฐาน ──────────────────────────────────────────────

test("POST /api/faq — สร้าง FAQ ใหม่สำเร็จ", async ({ apiRequest }) => {
  const payload = makeFaq();
  const res = await apiRequest.post("/api/faq", { data: payload });
  expect(res.status()).toBe(201);

  const body = await res.json();
  expect(body.question).toBe(FAQ_VALID.question);
  expect(body.id).toBe(payload.id);

  await deleteFaq(apiRequest, body.id);
});

test("GET /api/faq — ดึงรายการทั้งหมดสำเร็จ", async ({ apiRequest }) => {
  const res = await apiRequest.get("/api/faq");
  expect(res.status()).toBe(200);
  expect(Array.isArray(await res.json())).toBe(true);
});

test("GET /api/faq?status=published — filter ตาม status", async ({ apiRequest }) => {
  const payload = makeFaq({ status: "published" });
  await apiRequest.post("/api/faq", { data: payload });

  const res = await apiRequest.get("/api/faq?status=published");
  expect(res.status()).toBe(200);

  const list = await res.json();
  expect(list.every((f) => f.status === "published")).toBe(true);

  await deleteFaq(apiRequest, payload.id);
});

test("GET /api/faq/:id — ดึง FAQ เดี่ยวสำเร็จ", async ({ apiRequest }) => {
  const payload = makeFaq();
  await apiRequest.post("/api/faq", { data: payload });

  const res = await apiRequest.get(`/api/faq/${payload.id}`);
  expect(res.status()).toBe(200);
  expect((await res.json()).id).toBe(payload.id);

  await deleteFaq(apiRequest, payload.id);
});

test("GET /api/faq/:id ที่ไม่มี → 404", async ({ apiRequest }) => {
  const res = await apiRequest.get("/api/faq/NONEXIST99999");
  expect(res.status()).toBe(404);
});

test("PUT /api/faq/:id — อัปเดตคำตอบสำเร็จ", async ({ apiRequest }) => {
  const payload = makeFaq();
  await apiRequest.post("/api/faq", { data: payload });

  const res = await apiRequest.put(`/api/faq/${payload.id}`, {
    data: { answer: "คำตอบที่อัปเดตแล้ว" },
  });
  expect(res.status()).toBe(200);
  expect((await res.json()).answer).toBe("คำตอบที่อัปเดตแล้ว");

  await deleteFaq(apiRequest, payload.id);
});

test("DELETE /api/faq/:id — ลบ FAQ สำเร็จ → GET ได้ 404", async ({ apiRequest }) => {
  const payload = makeFaq();
  await apiRequest.post("/api/faq", { data: payload });

  expect((await apiRequest.delete(`/api/faq/${payload.id}`)).status()).toBe(200);
  expect((await apiRequest.get(`/api/faq/${payload.id}`)).status()).toBe(404);
});

// ── BVA: question field (Text — ไม่มี limit) ─────────────────

test.describe("BVA — question field (required, Text)", () => {
  for (const c of QUESTION_CASES) {
    test(c.label, async ({ apiRequest }) => {
      const payload = makeFaq({ question: c.question });
      const res = await apiRequest.post("/api/faq", { data: payload });

      expect(res.status()).toBe(c.expectedStatus);

      if (c.expectedStatus === 201) {
        await deleteFaq(apiRequest, payload.id);
      }
    });
  }
});

// ── BVA: category field (VarChar 100) ─────────────────────────

test.describe("BVA — category field (VarChar 100)", () => {
  for (const c of CATEGORY_CASES) {
    test(c.label, async ({ apiRequest }) => {
      const payload = makeFaq({ category: c.category });
      const res = await apiRequest.post("/api/faq", { data: payload });

      expect(res.status()).toBe(c.expectedStatus);

      if (c.expectedStatus === 201) {
        await deleteFaq(apiRequest, payload.id);
      }
    });
  }
});

// ── Reorder ───────────────────────────────────────────────────

test("POST /api/faq/reorder — เรียงลำดับใหม่สำเร็จ", async ({ apiRequest }) => {
  const p1 = makeFaq({ question: "คำถาม A" });
  const p2 = makeFaq({ question: "คำถาม B" });
  await apiRequest.post("/api/faq", { data: p1 });
  await apiRequest.post("/api/faq", { data: p2 });

  // reorder ใช้ PATCH ไม่ใช่ POST
  const res = await apiRequest.patch("/api/faq/reorder", {
    data: { ids: [p2.id, p1.id] },
  });
  expect(res.status()).toBe(200);

  await deleteFaq(apiRequest, p1.id);
  await deleteFaq(apiRequest, p2.id);
});
