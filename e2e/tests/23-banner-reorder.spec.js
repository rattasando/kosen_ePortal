/**
 * 23-banner-reorder.spec.js — ทดสอบ Banner reorder ↑↓
 * ─────────────────────────────────────────────────────────────
 * Banner card มีปุ่ม ↑ (ขึ้น) และ ↓ (ลง)
 * disabled เมื่อ index === 0 (↑) หรือ index === total-1 (↓)
 * reorder ยิง PATCH /api/banners/reorder
 */

import { test, expect } from "../fixtures/base.fixture.js";

let idA = "", idB = "";

test.beforeAll(async ({ apiRequest }) => {
  const ts = Date.now().toString().slice(-8);
  idA = `BAN-RA-${ts}`;
  idB = `BAN-RB-${ts}`;

  const resA = await apiRequest.post("/api/banners", {
    data: { id: idA, headline: `ReorderA ${ts}`, order: 9990, status: "inactive" },
  });
  expect(resA.status()).toBe(201);

  const resB = await apiRequest.post("/api/banners", {
    data: { id: idB, headline: `ReorderB ${ts}`, order: 9991, status: "inactive" },
  });
  expect(resB.status()).toBe(201);
});

test.afterAll(async ({ apiRequest }) => {
  await apiRequest.delete(`/api/banners/${idA}`).catch(() => {});
  await apiRequest.delete(`/api/banners/${idB}`).catch(() => {});
});

// helper: หา BannerCard ด้วย headline
function getBannerCard(page, headline) {
  return page
    .locator("div")
    .filter({ hasText: headline, has: page.getByRole("button", { name: "แก้ไข" }) })
    .last();
}

test("Banner page — แสดง ↑↓ buttons บน card", async ({ page }) => {
  await page.goto("/admin/information/banner");
  const ts = idA.split("-").pop();
  const cardA = getBannerCard(page, `ReorderA ${ts}`);
  await expect(cardA).toBeVisible({ timeout: 10_000 });
  // ↑ ของ card A (order 9990) — ถ้ามี banner อื่นก่อนหน้า ↑ จะ enabled; ↓ enabled เสมอ (มี B ตามหลัง)
  await expect(cardA.locator("button").filter({ hasText: "↓" })).toBeVisible();
});

test("Banner reorder — กด ↓ บน card A → PATCH reorder", async ({ page }) => {
  await page.goto("/admin/information/banner");
  const ts = idA.split("-").pop();
  const cardA = getBannerCard(page, `ReorderA ${ts}`);
  await expect(cardA).toBeVisible({ timeout: 10_000 });

  const downBtn = cardA.locator("button").filter({ hasText: "↓" });
  await expect(downBtn).not.toBeDisabled();

  const [res] = await Promise.all([
    page.waitForResponse((r) => r.url().includes("/api/banners/reorder") && r.request().method() === "PATCH"),
    downBtn.click(),
  ]);
  expect(res.status()).toBe(200);
});

test("Banner reorder — กด ↑ บน card B → PATCH reorder", async ({ page }) => {
  await page.goto("/admin/information/banner");
  const ts = idB.split("-").pop();
  const cardB = getBannerCard(page, `ReorderB ${ts}`);
  await expect(cardB).toBeVisible({ timeout: 10_000 });

  const upBtn = cardB.locator("button").filter({ hasText: "↑" });
  await expect(upBtn).not.toBeDisabled();

  const [res] = await Promise.all([
    page.waitForResponse((r) => r.url().includes("/api/banners/reorder") && r.request().method() === "PATCH"),
    upBtn.click(),
  ]);
  expect(res.status()).toBe(200);
});

test("Banner reorder API — PATCH /api/banners/reorder → success", async ({ apiRequest }) => {
  const res = await apiRequest.patch("/api/banners/reorder", {
    data: { ids: [idB, idA] },
  });
  expect(res.status()).toBe(200);
  expect((await res.json()).success).toBe(true);

  // restore
  await apiRequest.patch("/api/banners/reorder", { data: { ids: [idA, idB] } });
});
