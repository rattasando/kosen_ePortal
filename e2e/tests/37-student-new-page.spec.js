/**
 * 37-student-new-page.spec.js — ทดสอบ Student New Page (/admin/students/new)
 * ─────────────────────────────────────────────────────────────
 * - navigate → โหลดได้
 * - submit disabled เมื่อฟอร์มว่าง
 * - กรอกครบ required → submit enabled → POST → success
 * - [id]/edit redirect → /admin/students/:id?edit=1
 *
 * หมายเหตุ: name/lastname ใช้ onlyThai filter — ต้องส่งข้อความไทย
 * (เหมือน 06-student-ui-crud ที่ใช้ fill() กับ Thai text ได้ปกติ)
 */

import { test, expect } from "../fixtures/base.fixture.js";

let createdStudentId = "";

test.afterAll(async ({ apiRequest }) => {
  if (createdStudentId) {
    await apiRequest.delete(`/api/students/${createdStudentId}`).catch(() => {});
  }
});

test("Student new page — navigate → โหลดได้, มีฟอร์ม", async ({ page }) => {
  await page.goto("/admin/students/new");
  // หัวข้อหน้า
  await expect(page.getByText(/เพิ่มนักเรียนใหม่/)).toBeVisible({ timeout: 10_000 });
  // submit button มีอยู่
  await expect(page.getByRole("button", { name: /บันทึกข้อมูล/ })).toBeVisible();
});

test("Student new page — submit disabled เมื่อฟอร์มว่าง", async ({ page }) => {
  await page.goto("/admin/students/new");
  const submitBtn = page.getByRole("button", { name: /บันทึกข้อมูล/ });
  await expect(submitBtn).toBeVisible({ timeout: 10_000 });
  await expect(submitBtn).toBeDisabled();
});

test("Student new page — กรอกครบ required fields → submit enabled → POST → แสดง success", async ({ page }) => {
  await page.goto("/admin/students/new");
  await expect(page.getByPlaceholder("สมชาย")).toBeVisible({ timeout: 10_000 });

  // name + lastname (onlyThai filter)
  await page.getByPlaceholder("สมชาย").fill("ทดสอบ");
  await page.getByPlaceholder("ประเสริฐ").fill("ระบบ");

  // university (ไม่มี filter)
  await page.getByPlaceholder("ชื่อมหาวิทยาลัย...").fill("KOSEN-KMUTT");

  // tel
  await page.getByPlaceholder("081-234-5678").fill("0812345678");

  // email — ใช้ first() เพราะอาจมี email input หลายตัวในหน้า
  await page.getByPlaceholder(/email|student@/).first().fill("teststu@example.com");

  const submitBtn = page.getByRole("button", { name: /บันทึกข้อมูล/ });
  await expect(submitBtn).toBeEnabled({ timeout: 5_000 });

  const [res] = await Promise.all([
    page.waitForResponse((r) => r.url().includes("/api/students") && r.request().method() === "POST"),
    submitBtn.click(),
  ]);
  expect(res.status()).toBe(201);
  createdStudentId = (await res.json()).id;

  // แสดง success message (อาจปรากฏ 2 ครั้ง — title + body)
  await expect(page.getByText(/เพิ่มนักเรียนสำเร็จ/).first()).toBeVisible({ timeout: 10_000 });
});

test("Student [id]/edit — redirect ไปยัง ?edit=1 อัตโนมัติ", async ({ apiRequest, page }) => {
  // สร้าง student ชั่วคราว
  const ts = Date.now().toString().slice(-8);
  const res = await apiRequest.post("/api/students", {
    data: { name: "RedirectStu", lastname: `Test${ts}`, status: "กำลังศึกษา" },
  });
  expect(res.status()).toBe(201);
  const id = (await res.json()).id;

  await page.goto(`/admin/students/${id}/edit`);
  // หน้า edit redirect ไปที่ /admin/students/:id?edit=1
  await page.waitForURL((url) => url.pathname === `/admin/students/${id}` && url.searchParams.has("edit"), { timeout: 10_000 });
  await expect(page.getByRole("button", { name: "บันทึก" })).toBeVisible({ timeout: 10_000 });

  await apiRequest.delete(`/api/students/${id}`).catch(() => {});
});
