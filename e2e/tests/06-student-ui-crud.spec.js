/**
 * 06-student-ui-crud.spec.js — ทดสอบ UI CRUD นักเรียน
 * ─────────────────────────────────────────────────────────────
 * ทดสอบผ่าน browser จริง (storageState session ของ admin)
 * ตรวจ form interaction + create / search / edit / delete
 *
 * หมายเหตุ:
 * - university ใช้ ASCII (KMUTT-{ts}) เพื่อค้นหาใน list ได้ชัดเจน
 * - ใช้ waitForResponse + Promise.all ดัก POST/PUT/DELETE ก่อน assert
 * - Edit ใช้ note textarea (ไม่มี character filter, ASCII ได้)
 * - Student list search: live filter ผ่าน searchInput (ไม่ต้อง Enter)
 */

import { test, expect } from "../fixtures/base.fixture.js";

const LIST_URL = "/admin/students/list";
const NEW_URL  = "/admin/students/new";

// ── Helpers ───────────────────────────────────────────────────

function makeStudentData() {
  const ts = Date.now().toString().slice(-6);
  return {
    name:       "ทดสอบ",
    lastname:   "ระบบ",
    university: `KMUTT-${ts}`,   // ASCII → searchable + unique
    tel:        `08${ts}`,
    email:      `ui${ts}@test.th`,
    ts,
  };
}

/** กรอกฟอร์ม /new ด้วยข้อมูลจาก makeStudentData() */
async function fillStudentForm(page, d) {
  await page.getByPlaceholder("สมชาย").fill(d.name);
  await page.getByPlaceholder("ประเสริฐ").fill(d.lastname);
  await page.getByPlaceholder("ชื่อมหาวิทยาลัย...").fill(d.university);
  await page.getByPlaceholder("081-234-5678").fill(d.tel);
  await page.getByPlaceholder("student@kosen.ac.th").fill(d.email);
}

/**
 * สร้างนักเรียนผ่าน UI แล้วรอ POST /api/students
 * คืน created student object (มี id)
 */
async function createStudentViaUI(page, d) {
  await page.goto(NEW_URL);
  await fillStudentForm(page, d);

  const [response] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes("/api/students") && r.request().method() === "POST",
      { timeout: 15_000 },
    ),
    page.getByRole("button", { name: "บันทึกข้อมูล" }).click(),
  ]);
  expect(response.status()).toBe(201);
  await expect(page.getByText("เพิ่มนักเรียนสำเร็จ!")).toBeVisible({ timeout: 10_000 });
  return response.json();
}

/**
 * ค้นหานักเรียนใน list ด้วย university (ASCII)
 * คืน row แรกที่ match
 */
async function searchAndGetStudentRow(page, university) {
  await page.goto(LIST_URL);
  await page.waitForLoadState("networkidle");

  const searchInput = page.getByPlaceholder(
    "ชื่อ นามสกุล มหาวิทยาลัย สาขา (Enter เพื่อค้นหา)"
  );
  await searchInput.fill(university);   // live filter — ไม่ต้อง Enter

  const row = page.getByRole("row").filter({ hasText: university });
  await expect(row.first()).toBeVisible({ timeout: 10_000 });
  return row.first();
}

// ── Tests: Create form ─────────────────────────────────────────

test("หน้า /admin/students/new โหลดได้และแสดงฟอร์ม", async ({ page }) => {
  await page.goto(NEW_URL);
  await expect(page.getByPlaceholder("สมชาย")).toBeVisible();
  await expect(page.getByPlaceholder("ประเสริฐ")).toBeVisible();
  await expect(page.getByPlaceholder("ชื่อมหาวิทยาลัย...")).toBeVisible();
  await expect(page.getByRole("button", { name: "บันทึกข้อมูล" })).toBeVisible();
});

test("ปุ่มบันทึกถูก disable เมื่อฟอร์มยังไม่ครบ", async ({ page }) => {
  await page.goto(NEW_URL);
  // กรอกแค่ name ยังไม่ครบ required
  await page.getByPlaceholder("สมชาย").fill("ทดสอบ");
  await expect(page.getByRole("button", { name: "บันทึกข้อมูล" })).toBeDisabled();
});

test("กรอกฟอร์มครบแล้ว submit → แสดง success", async ({ page }) => {
  const d = makeStudentData();
  await page.goto(NEW_URL);
  await fillStudentForm(page, d);

  const submitBtn = page.getByRole("button", { name: "บันทึกข้อมูล" });
  await expect(submitBtn).toBeEnabled();
  await submitBtn.click();

  await expect(page.getByText("เพิ่มนักเรียนสำเร็จ!")).toBeVisible({ timeout: 10_000 });
});

test("หลัง submit สำเร็จ — มีปุ่ม 'เพิ่มนักเรียนคนต่อไป'", async ({ page }) => {
  const d = makeStudentData();
  await page.goto(NEW_URL);
  await fillStudentForm(page, d);
  await page.getByRole("button", { name: "บันทึกข้อมูล" }).click();

  await expect(page.getByText("เพิ่มนักเรียนสำเร็จ!")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole("button", { name: "เพิ่มนักเรียนคนต่อไป" })).toBeVisible();
});

test("กดปุ่ม 'เพิ่มนักเรียนคนต่อไป' → reset ฟอร์มใหม่", async ({ page }) => {
  const d = makeStudentData();
  await page.goto(NEW_URL);
  await fillStudentForm(page, d);
  await page.getByRole("button", { name: "บันทึกข้อมูล" }).click();

  await expect(page.getByText("เพิ่มนักเรียนสำเร็จ!")).toBeVisible({ timeout: 10_000 });
  await page.getByRole("button", { name: "เพิ่มนักเรียนคนต่อไป" }).click();

  // ฟอร์มว่างอีกครั้ง
  await expect(page.getByPlaceholder("สมชาย")).toHaveValue("");
});

// ── Tests: Search ──────────────────────────────────────────────

test("นักเรียนที่สร้างใหม่ค้นหาเจอในรายการ", async ({ page }) => {
  const d = makeStudentData();
  await createStudentViaUI(page, d);

  // ค้นหาด้วย university (ASCII) ใน list
  await searchAndGetStudentRow(page, d.university);
});

// ── Tests: Edit ────────────────────────────────────────────────

test("แก้ไขนักเรียน — บันทึก note → API ยืนยัน", async ({ page }) => {
  const d = makeStudentData();
  const student = await createStudentViaUI(page, d);

  // navigate ไปที่ detail page พร้อม ?edit=1
  await page.goto(`/admin/students/${student.id}?edit=1`);
  await page.waitForLoadState("networkidle");

  // note textarea เป็น textarea ตัวสุดท้าย (หมายเหตุ section ด้านล่าง)
  const noteText = `NOTE-${d.ts}`;
  const noteArea = page.locator("textarea").last();
  await expect(noteArea).toBeVisible({ timeout: 8_000 });
  await noteArea.fill(noteText);

  // รอ PUT response + คลิก "บันทึก"
  const [putResp] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes("/api/students/") && r.request().method() === "PUT",
      { timeout: 15_000 },
    ),
    page.getByRole("button", { name: "บันทึก" }).first().click(),
  ]);
  expect(putResp.ok()).toBeTruthy();

  // ตรวจ response body
  const body = await putResp.json();
  expect(body.note).toBe(noteText);
});

// ── Tests: Delete ──────────────────────────────────────────────

test("ลบนักเรียน → หายจากรายการ", async ({ page }) => {
  const d = makeStudentData();
  await createStudentViaUI(page, d);

  // ไปที่ list แล้วค้นหา
  const row = await searchAndGetStudentRow(page, d.university);
  await row.getByTitle("ลบ").click();

  // ConfirmDeleteModal
  await expect(page.getByText("ยืนยันการลบข้อมูล")).toBeVisible({ timeout: 5_000 });

  // รอ DELETE + confirm
  const [delResp] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes("/api/students/") && r.request().method() === "DELETE",
      { timeout: 10_000 },
    ),
    page.getByRole("button", { name: "ลบข้อมูล" }).click(),
  ]);
  expect(delResp.ok()).toBeTruthy();

  // modal ปิดและ row หาย
  await expect(page.getByText("ยืนยันการลบข้อมูล")).not.toBeVisible({ timeout: 5_000 });
  await expect(
    page.getByRole("row").filter({ hasText: d.university })
  ).not.toBeVisible({ timeout: 5_000 });
});
