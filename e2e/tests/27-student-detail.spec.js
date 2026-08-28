/**
 * 27-student-detail.spec.js — ทดสอบ Student detail page
 * ─────────────────────────────────────────────────────────────
 * /admin/students/:id — view + edit + save
 * ปุ่ม: "แก้ไข" → edit mode, "บันทึก" → PUT /api/students/:id, "ยกเลิก"
 */

import { test, expect } from "../fixtures/base.fixture.js";

let studentId = "";

test.beforeAll(async ({ apiRequest }) => {
  const ts = Date.now().toString().slice(-8);
  const res = await apiRequest.post("/api/students", {
    data: {
      name:     "StudDet",
      lastname: `Test${ts}`,
      status:   "กำลังศึกษา",
      nationalId: `9${ts}`,
    },
  });
  expect(res.status()).toBe(201);
  studentId = (await res.json()).id;
});

test.afterAll(async ({ apiRequest }) => {
  await apiRequest.delete(`/api/students/${studentId}`).catch(() => {});
});

test("Student detail — navigate ไปยัง /admin/students/:id → โหลดได้", async ({ page }) => {
  await page.goto(`/admin/students/${studentId}`);
  await expect(page.getByText(/StudDet/).first()).toBeVisible({ timeout: 10_000 });
});

test("Student detail — กด แก้ไข → เข้า edit mode", async ({ page }) => {
  await page.goto(`/admin/students/${studentId}`);
  const editBtn = page.getByRole("button", { name: "แก้ไข" });
  await expect(editBtn).toBeVisible({ timeout: 10_000 });
  await editBtn.click();
  await expect(page.getByRole("button", { name: "บันทึก" })).toBeVisible();
});

test("Student detail — กด ยกเลิก → ออกจาก edit mode", async ({ page }) => {
  await page.goto(`/admin/students/${studentId}`);
  await page.getByRole("button", { name: "แก้ไข" }).click();
  await page.getByRole("button", { name: "ยกเลิก" }).first().click();
  await expect(page.getByRole("button", { name: "แก้ไข" })).toBeVisible();
});

test("Student detail — แก้ไข note แล้ว บันทึก → PUT :id → 200", async ({ page }) => {
  await page.goto(`/admin/students/${studentId}?edit=1`);
  // รอ edit mode โหลด
  await expect(page.getByRole("button", { name: "บันทึก" })).toBeVisible({ timeout: 10_000 });

  // แก้ไข note field (textarea)
  const noteField = page.locator("textarea").last();
  if (await noteField.isVisible()) {
    await noteField.fill("Test note updated");
  }

  const [res] = await Promise.all([
    page.waitForResponse((r) => r.url().includes(`/api/students/${studentId}`) && r.request().method() === "PUT"),
    page.getByRole("button", { name: "บันทึก" }).last().click(),
  ]);
  expect(res.status()).toBe(200);
});

test("Student detail — URL ?edit=1 → เปิด edit mode อัตโนมัติ", async ({ page }) => {
  await page.goto(`/admin/students/${studentId}?edit=1`);
  await expect(page.getByRole("button", { name: "บันทึก" })).toBeVisible({ timeout: 10_000 });
});
