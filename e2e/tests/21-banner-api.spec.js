/**
 * 21-banner-api.spec.js — ทดสอบ Banner API (CRUD)
 * ─────────────────────────────────────────────────────────────
 * POST /api/banners    — ต้องส่ง id เอง (String @id VarChar 20)
 * GET  /api/banners
 * GET  /api/banners/:id
 * PUT  /api/banners/:id
 * DELETE /api/banners/:id
 *
 * required: id (VarChar 20)
 * optional: layout (enum, default "hero"), headline, ctaLabel, ctaHref,
 *           newsId, activityId (ต้องเป็น null ถ้าว่าง — ไม่ใช่ "")
 *
 * หมายเหตุ: newsId/activityId = "" ทำให้ Prisma P2003 → 400
 *   ต้องส่งเป็น null หรือ undefined แทน (API normalize ให้แล้วหลัง fix)
 */

import { test, expect } from "../fixtures/base.fixture.js";

function makeBanner(overrides = {}) {
  const ts = Date.now().toString().slice(-8);
  return {
    id:       `BAN-T-${ts}`,      // ≤ 20 chars
    layout:   "hero",
    headline: `Banner Test ${ts}`,
    ctaLabel: "Read More",
    ctaHref:  "/test",
    status:   "active",
    order:    999,
    ...overrides,
  };
}

async function cleanup(apiRequest, id) {
  if (id) await apiRequest.delete(`/api/banners/${id}`).catch(() => {});
}

// ── CRUD พื้นฐาน ──────────────────────────────────────────────

test("POST /api/banners — สร้าง banner ใหม่ → 201", async ({ apiRequest }) => {
  const b = makeBanner();
  const res = await apiRequest.post("/api/banners", { data: b });
  expect(res.status()).toBe(201);

  const body = await res.json();
  expect(body.id).toBe(b.id);
  expect(body.headline).toBe(b.headline);

  await cleanup(apiRequest, b.id);
});

test("GET /api/banners — คืน array เรียงตาม order asc", async ({ apiRequest }) => {
  const res = await apiRequest.get("/api/banners");
  expect(res.status()).toBe(200);
  const list = await res.json();
  expect(Array.isArray(list)).toBe(true);
  // ตรวจ order ascending
  for (let i = 1; i < list.length; i++) {
    expect(list[i].order).toBeGreaterThanOrEqual(list[i - 1].order);
  }
});

test("GET /api/banners/:id — ดึง banner ที่มีอยู่ → 200", async ({ apiRequest }) => {
  const b = makeBanner();
  await apiRequest.post("/api/banners", { data: b });

  const res = await apiRequest.get(`/api/banners/${b.id}`);
  expect(res.status()).toBe(200);
  expect((await res.json()).id).toBe(b.id);

  await cleanup(apiRequest, b.id);
});

test("GET /api/banners/:id — id ไม่มี → 404", async ({ apiRequest }) => {
  const res = await apiRequest.get("/api/banners/BAN-NONEXIST-99");
  expect(res.status()).toBe(404);
});

test("PUT /api/banners/:id — อัปเดต headline สำเร็จ → 200", async ({ apiRequest }) => {
  const b = makeBanner();
  await apiRequest.post("/api/banners", { data: b });

  const newHeadline = `${b.headline} UPDATED`;
  const res = await apiRequest.put(`/api/banners/${b.id}`, {
    data: { headline: newHeadline },
  });
  expect(res.status()).toBe(200);
  expect((await res.json()).headline).toBe(newHeadline);

  await cleanup(apiRequest, b.id);
});

test("DELETE /api/banners/:id — ลบสำเร็จ + GET ซ้ำ → 404", async ({ apiRequest }) => {
  const b = makeBanner();
  await apiRequest.post("/api/banners", { data: b });

  expect((await apiRequest.delete(`/api/banners/${b.id}`)).status()).toBe(200);
  expect((await apiRequest.get(`/api/banners/${b.id}`)).status()).toBe(404);
});

test("POST /api/banners — id ซ้ำ → 409", async ({ apiRequest }) => {
  const b = makeBanner();
  await apiRequest.post("/api/banners", { data: b });

  const res = await apiRequest.post("/api/banners", { data: b });
  expect(res.status()).toBe(409);

  await cleanup(apiRequest, b.id);
});

test("POST /api/banners — newsId null → 201 (ไม่ P2003)", async ({ apiRequest }) => {
  const b = makeBanner({ newsId: null, activityId: null });
  const res = await apiRequest.post("/api/banners", { data: b });
  expect(res.status()).toBe(201);

  await cleanup(apiRequest, b.id);
});
