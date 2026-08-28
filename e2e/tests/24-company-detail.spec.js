/**
 * 24-company-detail.spec.js — ทดสอบ Company detail page
 * ─────────────────────────────────────────────────────────────
 * CompanyDetailClient: edit mode toggle + PUT /api/companies/:id
 * ปุ่ม: "แก้ไข" → edit mode, "บันทึก" → save, "ยกเลิก" → cancel
 */

import { test, expect } from "../fixtures/base.fixture.js";

let companyId = "";

test.beforeAll(async ({ apiRequest }) => {
  const ts = Date.now().toString().slice(-8);
  companyId = `COM-DT-${ts}`;
  const res = await apiRequest.post("/api/companies", {
    data: { id: companyId, name: `Detail Co ${ts}`, status: "active" },
  });
  expect(res.status()).toBe(201);
});

test.afterAll(async ({ apiRequest }) => {
  await apiRequest.delete(`/api/companies/${companyId}`).catch(() => {});
});

test("Company detail — navigate ไปยัง /admin/companies/:id → โหลดได้", async ({ page }) => {
  await page.goto(`/admin/companies/${companyId}`);
  // sticky top bar + form heading — ใช้ first() เพราะชื่อปรากฏ 2 ครั้ง
  await expect(page.getByText(/Detail Co/).first()).toBeVisible({ timeout: 10_000 });
});

test("Company detail — กด แก้ไข → เข้า edit mode", async ({ page }) => {
  await page.goto(`/admin/companies/${companyId}`);
  const editBtn = page.getByRole("button", { name: "แก้ไข" });
  await expect(editBtn).toBeVisible({ timeout: 10_000 });
  await editBtn.click();
  // edit mode: ปุ่ม บันทึก + ยกเลิก ปรากฏ
  await expect(page.getByRole("button", { name: "บันทึก" })).toBeVisible();
  await expect(page.getByRole("button", { name: "ยกเลิก" })).toBeVisible();
});

test("Company detail — กด ยกเลิก → ออกจาก edit mode", async ({ page }) => {
  await page.goto(`/admin/companies/${companyId}`);
  await page.getByRole("button", { name: "แก้ไข" }).click();
  await page.getByRole("button", { name: "ยกเลิก" }).click();
  await expect(page.getByRole("button", { name: "แก้ไข" })).toBeVisible();
});

test("Company detail — แก้ไข note แล้ว บันทึก → PUT :id → 200", async ({ page }) => {
  await page.goto(`/admin/companies/${companyId}`);
  await page.getByRole("button", { name: "แก้ไข" }).click();

  // แก้ไข field note/remark (textarea หรือ input placeholder)
  const noteInput = page.locator("textarea, input[placeholder*='บันทึก']").first();
  if (await noteInput.isVisible()) {
    await noteInput.fill("Updated note from test");
  }

  const [res] = await Promise.all([
    page.waitForResponse((r) => r.url().includes(`/api/companies/${companyId}`) && r.request().method() === "PUT"),
    page.getByRole("button", { name: "บันทึก" }).click(),
  ]);
  expect(res.status()).toBe(200);
  // กลับสู่ view mode
  await expect(page.getByRole("button", { name: "แก้ไข" })).toBeVisible();
});

test("Company detail — URL ?edit=1 → เปิด edit mode อัตโนมัติ", async ({ page }) => {
  await page.goto(`/admin/companies/${companyId}?edit=1`);
  await expect(page.getByRole("button", { name: "บันทึก" })).toBeVisible({ timeout: 10_000 });
});
