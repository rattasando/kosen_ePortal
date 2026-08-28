/**
 * 22-faq-reorder.spec.js — ทดสอบ FAQ reorder ▲▼
 * ─────────────────────────────────────────────────────────────
 * isFirst/isLast คิดจาก sortedAll (ทั้งตาราง) ไม่ใช่จาก search filter
 * → ใช้ order 9990/9991 ให้อยู่ท้ายสุด และค้นหาด้วย unique prefix
 */

import { test, expect } from "../fixtures/base.fixture.js";

const PREFIX = "RDRFAQ";
let idA = "", idB = "";

test.beforeAll(async ({ apiRequest }) => {
  const ts = Date.now().toString().slice(-6);
  idA = `FAQ-RA-${ts}`;
  idB = `FAQ-RB-${ts}`;

  const resA = await apiRequest.post("/api/faq", {
    data: { id: idA, question: `${PREFIX}${ts} A`, answer: "answer A", status: "published", order: 9990 },
  });
  expect(resA.status()).toBe(201);

  const resB = await apiRequest.post("/api/faq", {
    data: { id: idB, question: `${PREFIX}${ts} B`, answer: "answer B", status: "published", order: 9991 },
  });
  expect(resB.status()).toBe(201);
});

test.afterAll(async ({ apiRequest }) => {
  await apiRequest.delete(`/api/faq/${idA}`).catch(() => {});
  await apiRequest.delete(`/api/faq/${idB}`).catch(() => {});
});

test("FAQ list — แสดงปุ่ม ▲▼ ในตาราง", async ({ page }) => {
  await page.goto("/admin/information/faq");
  await expect(page.locator("button").filter({ hasText: "▼" }).first()).toBeVisible({ timeout: 10_000 });
  await expect(page.locator("button").filter({ hasText: "▲" }).first()).toBeVisible();
});

test("FAQ reorder — กด ▼ บน item แรก → PATCH reorder → order สลับ", async ({ page }) => {
  await page.goto("/admin/information/faq");

  // รอ FAQ โหลด แล้ว search ด้วย PREFIX เพื่อเจอแค่ 2 rows
  const ts = idA.split("-").pop();
  const searchInput = page.getByPlaceholder(/ค้นหา/);
  await searchInput.fill(`${PREFIX}${ts}`);
  await page.waitForTimeout(400); // debounce

  // ตรวจว่ามี 2 rows
  const rows = page.locator("table tbody tr");
  await expect(rows).toHaveCount(2, { timeout: 5_000 });

  // row แรก = FAQ A (order 9990) → กด ▼
  const firstRow = rows.first();
  const downBtn = firstRow.locator("button").filter({ hasText: "▼" });
  await expect(downBtn).not.toBeDisabled();

  const [res] = await Promise.all([
    page.waitForResponse((r) => r.url().includes("/api/faq/reorder") && r.request().method() === "PATCH"),
    downBtn.click(),
  ]);
  expect(res.status()).toBe(200);

  // หลัง reorder: row แรกควรเป็น FAQ B (question มี " B")
  await page.waitForTimeout(300);
  const firstRowText = await rows.first().textContent();
  expect(firstRowText).toContain(`${PREFIX}${ts} B`);
});

test("FAQ reorder — กด ▲ เพื่อ restore กลับ → PATCH reorder", async ({ page }) => {
  await page.goto("/admin/information/faq");

  const ts = idA.split("-").pop();
  await page.getByPlaceholder(/ค้นหา/).fill(`${PREFIX}${ts}`);
  await page.waitForTimeout(400);

  const rows = page.locator("table tbody tr");
  await expect(rows).toHaveCount(2, { timeout: 5_000 });

  // กด ▲ บน row แรก (ซึ่งตอนนี้อาจเป็น B แล้ว หรือ A ก็ได้ — แค่ test ว่า PATCH เกิดขึ้น)
  const upBtn = rows.last().locator("button").filter({ hasText: "▲" });
  await expect(upBtn).not.toBeDisabled();

  const [res] = await Promise.all([
    page.waitForResponse((r) => r.url().includes("/api/faq/reorder") && r.request().method() === "PATCH"),
    upBtn.click(),
  ]);
  expect(res.status()).toBe(200);
});

test("FAQ reorder API — PATCH /api/faq/reorder ด้วย ids → success", async ({ apiRequest }) => {
  const res = await apiRequest.patch("/api/faq/reorder", {
    data: { ids: [idB, idA] }, // สลับ order
  });
  expect(res.status()).toBe(200);
  expect((await res.json()).success).toBe(true);

  // restore
  await apiRequest.patch("/api/faq/reorder", { data: { ids: [idA, idB] } });
});
