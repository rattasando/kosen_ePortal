/**
 * 40-contact-apis.spec.js — ทดสอบ Contact APIs (3 กลุ่ม)
 * ─────────────────────────────────────────────────────────────
 * /api/contact-info        GET, POST, PUT/:id, DELETE/:id, PATCH reorder
 * /api/contact-social      GET, POST, PUT/:id, DELETE/:id, PATCH reorder
 * /api/contact-universities GET, POST, PUT/:id, DELETE/:id, PATCH reorder
 *
 * id เป็น VarChar(10) — ต้องกำหนดเอง (ไม่ auto-generate)
 */

import { test, expect } from "../fixtures/base.fixture.js";

// ── contact-info ────────────────────────────────────────────────────────────

test.describe("Contact Info API", () => {
  let itemId = "";

  test.beforeAll(async ({ apiRequest }) => {
    const ts = Date.now().toString().slice(-6);
    itemId = `CI${ts}`;
    const res = await apiRequest.post("/api/contact-info", {
      data: { id: itemId, label: `Test Info ${ts}`, lines: ["line1"], order: 99 },
    });
    expect(res.status()).toBe(201);
  });

  test.afterAll(async ({ apiRequest }) => {
    await apiRequest.delete(`/api/contact-info/${itemId}`).catch(() => {});
  });

  test("GET /api/contact-info → 200 + array", async ({ apiRequest }) => {
    const res = await apiRequest.get("/api/contact-info");
    expect(res.status()).toBe(200);
    expect(Array.isArray(await res.json())).toBe(true);
  });

  test("GET หลัง POST → เห็น item ใหม่ในรายการ", async ({ apiRequest }) => {
    const res = await apiRequest.get("/api/contact-info");
    const body = await res.json();
    expect(body.some((i) => i.id === itemId)).toBe(true);
  });

  test("PUT /api/contact-info/:id → 200 + label อัปเดต", async ({ apiRequest }) => {
    const res = await apiRequest.put(`/api/contact-info/${itemId}`, {
      data: { label: "Updated Label", lines: ["updated line"], order: 99 },
    });
    expect(res.status()).toBe(200);
    expect((await res.json()).label).toBe("Updated Label");
  });

  test("PATCH /api/contact-info/reorder → 200", async ({ apiRequest }) => {
    const list = await (await apiRequest.get("/api/contact-info")).json();
    const ids  = list.map((i) => i.id);
    if (ids.length < 2) { test.skip(); return; }
    const res = await apiRequest.fetch("/api/contact-info/reorder", {
      method: "PATCH",
      data: { ids: [...ids].reverse() },
    });
    expect(res.status()).toBe(200);
  });

  test("DELETE /api/contact-info/:id → 200", async ({ apiRequest }) => {
    const ts  = Date.now().toString().slice(-6);
    const id  = `CDL${ts}`;
    await apiRequest.post("/api/contact-info", { data: { id, label: "Del", lines: [] } });
    const res = await apiRequest.delete(`/api/contact-info/${id}`);
    expect(res.status()).toBe(200);
  });
});

// ── contact-social ───────────────────────────────────────────────────────────

test.describe("Contact Social API", () => {
  let itemId = "";

  test.beforeAll(async ({ apiRequest }) => {
    const ts = Date.now().toString().slice(-6);
    itemId = `CS${ts}`;
    const res = await apiRequest.post("/api/contact-social", {
      data: { id: itemId, label: `Test Social ${ts}`, order: 99 },
    });
    expect(res.status()).toBe(201);
  });

  test.afterAll(async ({ apiRequest }) => {
    await apiRequest.delete(`/api/contact-social/${itemId}`).catch(() => {});
  });

  test("GET /api/contact-social → 200 + array", async ({ apiRequest }) => {
    const res = await apiRequest.get("/api/contact-social");
    expect(res.status()).toBe(200);
    expect(Array.isArray(await res.json())).toBe(true);
  });

  test("GET หลัง POST → เห็น item ใหม่", async ({ apiRequest }) => {
    const body = await (await apiRequest.get("/api/contact-social")).json();
    expect(body.some((i) => i.id === itemId)).toBe(true);
  });

  test("PUT /api/contact-social/:id → 200 + label อัปเดต", async ({ apiRequest }) => {
    const res = await apiRequest.put(`/api/contact-social/${itemId}`, {
      data: { label: "Updated Social", handle: "@test", order: 99 },
    });
    expect(res.status()).toBe(200);
    expect((await res.json()).label).toBe("Updated Social");
  });

  test("PATCH /api/contact-social/reorder → 200", async ({ apiRequest }) => {
    const list = await (await apiRequest.get("/api/contact-social")).json();
    const ids  = list.map((i) => i.id);
    if (ids.length < 2) { test.skip(); return; }
    const res = await apiRequest.fetch("/api/contact-social/reorder", {
      method: "PATCH",
      data: { ids: [...ids].reverse() },
    });
    expect(res.status()).toBe(200);
  });

  test("DELETE /api/contact-social/:id → 200", async ({ apiRequest }) => {
    const ts  = Date.now().toString().slice(-6);
    const id  = `SDL${ts}`;
    await apiRequest.post("/api/contact-social", { data: { id, label: "Del", order: 0 } });
    const res = await apiRequest.delete(`/api/contact-social/${id}`);
    expect(res.status()).toBe(200);
  });
});

// ── contact-universities ─────────────────────────────────────────────────────

test.describe("Contact Universities API", () => {
  let itemId = "";

  test.beforeAll(async ({ apiRequest }) => {
    const ts = Date.now().toString().slice(-6);
    itemId = `CU${ts}`;
    const res = await apiRequest.post("/api/contact-universities", {
      data: {
        id:       itemId,
        name:     `TestUni${ts}`,
        fullName: `Test University ${ts}`,
        order:    99,
      },
    });
    expect(res.status()).toBe(201);
  });

  test.afterAll(async ({ apiRequest }) => {
    await apiRequest.delete(`/api/contact-universities/${itemId}`).catch(() => {});
  });

  test("GET /api/contact-universities → 200 + array", async ({ apiRequest }) => {
    const res = await apiRequest.get("/api/contact-universities");
    expect(res.status()).toBe(200);
    expect(Array.isArray(await res.json())).toBe(true);
  });

  test("GET หลัง POST → เห็น university ใหม่", async ({ apiRequest }) => {
    const body = await (await apiRequest.get("/api/contact-universities")).json();
    expect(body.some((i) => i.id === itemId)).toBe(true);
  });

  test("PUT /api/contact-universities/:id → 200 + ข้อมูลอัปเดต", async ({ apiRequest }) => {
    const res = await apiRequest.put(`/api/contact-universities/${itemId}`, {
      data: { name: `TestUniUpd`, fullName: "Updated University", order: 99 },
    });
    expect(res.status()).toBe(200);
    expect((await res.json()).fullName).toBe("Updated University");
  });

  test("PATCH /api/contact-universities/reorder → 200", async ({ apiRequest }) => {
    const list = await (await apiRequest.get("/api/contact-universities")).json();
    const ids  = list.map((i) => i.id);
    if (ids.length < 2) { test.skip(); return; }
    const res = await apiRequest.fetch("/api/contact-universities/reorder", {
      method: "PATCH",
      data: { ids: [...ids].reverse() },
    });
    expect(res.status()).toBe(200);
  });

  test("DELETE /api/contact-universities/:id → 200", async ({ apiRequest }) => {
    const ts  = Date.now().toString().slice(-6);
    const id  = `UDL${ts}`;
    await apiRequest.post("/api/contact-universities", {
      data: { id, name: "DelUni", fullName: "Delete University", order: 0 },
    });
    const res = await apiRequest.delete(`/api/contact-universities/${id}`);
    expect(res.status()).toBe(200);
  });
});
