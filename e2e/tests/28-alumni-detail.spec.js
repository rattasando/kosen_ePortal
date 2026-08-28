/**
 * 28-alumni-detail.spec.js — ทดสอบ Alumni detail page
 * ─────────────────────────────────────────────────────────────
 * /admin/students/alumni/:id — view + edit + save
 * ปุ่ม: "แก้ไข" → edit mode (ทั้งหน้า), "บันทึก" → PUT /api/alumni/:id, "ยกเลิก"
 * ส่วน history log อยู่ด้านล่างสุด
 */

import { test, expect } from "../fixtures/base.fixture.js";

let alumniId = "";

test.beforeAll(async ({ apiRequest }) => {
  const ts = Date.now().toString().slice(-8);
  alumniId = `ALU-DT-${ts}`;
  const res = await apiRequest.post("/api/alumni", {
    data: {
      id:       alumniId,
      name:     "AluDet",
      lastname: `Test${ts}`,
      major:    "ComputerEng",
      graduatedYear: 2566,
    },
  });
  expect(res.status()).toBe(201);
});

test.afterAll(async ({ apiRequest }) => {
  await apiRequest.delete(`/api/alumni/${alumniId}`).catch(() => {});
});

test("Alumni detail — navigate ไปยัง /admin/students/alumni/:id → โหลดได้", async ({ page }) => {
  await page.goto(`/admin/students/alumni/${alumniId}`);
  await expect(page.getByText(/AluDet/).first()).toBeVisible({ timeout: 10_000 });
});

test("Alumni detail — กด แก้ไข → เข้า edit mode", async ({ page }) => {
  await page.goto(`/admin/students/alumni/${alumniId}`);
  const editBtn = page.getByRole("button", { name: "แก้ไข" });
  await expect(editBtn).toBeVisible({ timeout: 10_000 });
  await editBtn.click();
  await expect(page.getByRole("button", { name: "บันทึก" })).toBeVisible();
  await expect(page.getByRole("button", { name: "ยกเลิก" })).toBeVisible();
});

test("Alumni detail — กด ยกเลิก → ออกจาก edit mode", async ({ page }) => {
  await page.goto(`/admin/students/alumni/${alumniId}`);
  await page.getByRole("button", { name: "แก้ไข" }).click();
  await page.getByRole("button", { name: "ยกเลิก" }).click();
  await expect(page.getByRole("button", { name: "แก้ไข" })).toBeVisible();
});

test("Alumni detail — แก้ไข remark แล้ว บันทึก → PUT :id → 200", async ({ page }) => {
  await page.goto(`/admin/students/alumni/${alumniId}`);
  await page.getByRole("button", { name: "แก้ไข" }).click();

  // แก้ไข remark textarea
  const remarkField = page.locator("textarea").last();
  if (await remarkField.isVisible()) {
    await remarkField.fill("Remark updated by test");
  }

  const [res] = await Promise.all([
    page.waitForResponse((r) => r.url().includes(`/api/alumni/${alumniId}`) && r.request().method() === "PUT"),
    page.getByRole("button", { name: "บันทึก" }).click(),
  ]);
  expect(res.status()).toBe(200);
  await expect(page.getByRole("button", { name: "แก้ไข" })).toBeVisible();
});

test("Alumni detail — section ประวัติการแก้ไข ปรากฏ", async ({ page }) => {
  await page.goto(`/admin/students/alumni/${alumniId}`);
  await expect(page.getByText("ประวัติการแก้ไข")).toBeVisible({ timeout: 10_000 });
});
