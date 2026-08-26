/**
 * 05-news-api.spec.js — ทดสอบ News API ด้วย BVA
 * ─────────────────────────────────────────────────────────────
 * News id: VarChar(20) — client-generated (ไม่มี @default)
 * Field limits จาก schema:
 *   id:       VarChar(20)
 *   title:    String (Text — ไม่มี VarChar limit)
 *   category: VarChar(100)
 *   slug:     VarChar(300)
 *
 * หมายเหตุ: title เป็น Text → ไม่มี server-side limit
 * ทดสอบ boundary ของ category (VarChar 100) แทน
 */

import { test, expect } from "../fixtures/base.fixture.js";
import { str, bvaStr } from "../data/bva.js";

// ── BVA sets ─────────────────────────────────────────────────

const CATEGORY_BVA = bvaStr(100);

// ── ID helper (≤ 20 ตัว) ────────────────────────────────────

let _seq = 0;
const makeNewsId = () => `NT${Date.now().toString().slice(-8)}${String(++_seq).padStart(2,"0")}`;

function makeNews(overrides = {}) {
  return {
    id:       makeNewsId(),
    title:    "ข่าวทดสอบ E2E",
    category: "ทั่วไป",
    status:   "draft",
    blocks:   [],
    ...overrides,
  };
}

async function deleteNews(request, id) {
  await request.delete(`/api/news/${id}`).catch(() => {});
}

// ── CRUD พื้นฐาน ──────────────────────────────────────────────

test("POST /api/news — สร้างข่าวใหม่สำเร็จ", async ({ apiRequest }) => {
  const payload = makeNews();
  const res = await apiRequest.post("/api/news", { data: payload });
  expect(res.status()).toBe(201);

  const body = await res.json();
  expect(body.title).toBe("ข่าวทดสอบ E2E");
  expect(body.id).toBe(payload.id);

  await deleteNews(apiRequest, body.id);
});

test("GET /api/news — ดึงรายการทั้งหมดสำเร็จ", async ({ apiRequest }) => {
  const res = await apiRequest.get("/api/news");
  expect(res.status()).toBe(200);
  expect(Array.isArray(await res.json())).toBe(true);
});

test("GET /api/news/:id ที่ไม่มี → 404", async ({ apiRequest }) => {
  const res = await apiRequest.get("/api/news/NOTEXIST9999");
  expect(res.status()).toBe(404);
});

test("PUT /api/news/:id — อัปเดต title สำเร็จ", async ({ apiRequest }) => {
  const payload = makeNews();
  await apiRequest.post("/api/news", { data: payload });

  const res = await apiRequest.put(`/api/news/${payload.id}`, {
    data: { title: "ชื่อข่าวที่อัปเดต", blocks: [] },
  });
  expect(res.status()).toBe(200);
  expect((await res.json()).title).toBe("ชื่อข่าวที่อัปเดต");

  await deleteNews(apiRequest, payload.id);
});

test("DELETE /api/news/:id — ลบข่าวสำเร็จ", async ({ apiRequest }) => {
  const payload = makeNews();
  await apiRequest.post("/api/news", { data: payload });

  expect((await apiRequest.delete(`/api/news/${payload.id}`)).status()).toBe(200);
  expect((await apiRequest.get(`/api/news/${payload.id}`)).status()).toBe(404);
});

// ── BVA: title (Text — ไม่มี VarChar limit) ─────────────────

test.describe("BVA — title field (Text — ไม่มี server-side VarChar limit)", () => {
  const cases = [
    { label: "title ว่าง (Text — Prisma รับ empty string → 201)", value: "", expectOk: true },
    { label: "title ยาว 1 ตัว (min+1)",                    value: str(1),    expectOk: true  },
    { label: "title ยาว 200 ตัว",                           value: str(200),  expectOk: true  },
    { label: "title ยาว 500 ตัว (Text — รับได้ไม่จำกัด)",  value: str(500),  expectOk: true  },
    { label: "title ยาว 1000 ตัว (Text — รับได้ไม่จำกัด)", value: str(1000), expectOk: true  },
  ];

  for (const c of cases) {
    test(c.label, async ({ apiRequest }) => {
      const payload = makeNews({ title: c.value });
      const res = await apiRequest.post("/api/news", { data: payload });

      if (c.expectOk) {
        expect(res.status()).toBe(201);
        await deleteNews(apiRequest, payload.id);
      } else {
        // title ว่าง — Prisma ไม่รับเพราะ required (ไม่มี @default)
        expect(res.status()).not.toBe(201);
      }
    });
  }
});

// ── BVA: category (VarChar 100) ───────────────────────────────

test.describe("BVA — category field (VarChar 100)", () => {
  const cases = [
    { label: "category ว่าง (optional)",           value: "",                     expectedStatus: 201 },
    { label: "category ยาว 1 ตัว (min+1)",         value: CATEGORY_BVA.min1,      expectedStatus: 201 },
    { label: "category ยาว 99 ตัว (max-1)",        value: CATEGORY_BVA.belowMax,  expectedStatus: 201 },
    { label: "category ยาว 100 ตัว (on-point)",    value: CATEGORY_BVA.onMax,     expectedStatus: 201 },
    { label: "category ยาว 101 ตัว (off-point)",   value: CATEGORY_BVA.aboveMax,  expectedStatus: 400 },
  ];

  for (const c of cases) {
    test(c.label, async ({ apiRequest }) => {
      const payload = makeNews({ category: c.value || undefined });
      const res = await apiRequest.post("/api/news", { data: payload });

      expect(res.status()).toBe(c.expectedStatus);

      if (c.expectedStatus === 201) {
        await deleteNews(apiRequest, payload.id);
      }
    });
  }
});

// ── News with blocks ──────────────────────────────────────────

test("POST /api/news — สร้างพร้อม blocks สำเร็จ", async ({ apiRequest }) => {
  const payload = makeNews({
    blocks: [
      { type: "paragraph", content: "เนื้อหาบล็อกทดสอบ", order: 1 },
      { type: "paragraph", content: "บล็อกที่สอง",       order: 2 },
    ],
  });
  const res = await apiRequest.post("/api/news", { data: payload });
  expect(res.status()).toBe(201);

  const body = await res.json();
  expect(body.blocks).toHaveLength(2);

  await deleteNews(apiRequest, body.id);
});

test("PUT /api/news/:id — อัปเดต blocks (delete + recreate)", async ({ apiRequest }) => {
  const payload = makeNews({
    blocks: [{ type: "paragraph", content: "เดิม", order: 1 }],
  });
  await apiRequest.post("/api/news", { data: payload });

  const res = await apiRequest.put(`/api/news/${payload.id}`, {
    data: { title: "ชื่อเดิม", blocks: [{ type: "paragraph", content: "ใหม่", order: 1 }] },
  });
  expect(res.status()).toBe(200);
  expect((await res.json()).blocks[0].content).toBe("ใหม่");

  await deleteNews(apiRequest, payload.id);
});
