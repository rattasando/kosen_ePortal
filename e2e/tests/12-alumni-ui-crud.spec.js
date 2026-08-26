/**
 * 12-alumni-ui-crud.spec.js — ทดสอบ UI CRUD ของ Alumni
 * ─────────────────────────────────────────────────────────────
 * Alumni flow:
 *   Create: /admin/students/alumni/new → "เพิ่มศิษย์เก่าสำเร็จ!"
 *   List:   /admin/students/alumni — search ด้วย university (ASCII)
 *   Edit:   /admin/students/alumni/[id] — ปุ่ม "แก้ไข" → form → ปุ่ม "บันทึก"
 *   Delete: list → title="ลบ" → DeleteModal "ยืนยันการลบข้อมูล" → "ลบข้อมูล"
 *
 * หมายเหตุ:
 * - university และ major ใช้ ASCII เพื่อเป็น unique search key
 * - name/lastname เป็น Thai สั้น (fill() ทำงานได้กับ input ที่ไม่มี character filter)
 * - addAlumni() ใน /new ไม่ await → ใช้ waitForResponse(POST /api/alumni) ใน Promise.all
 * - Alumni list search: live filter ผ่าน searchInput (ไม่ต้อง Enter)
 * - Edit remark: textarea ตัวเดียวใน form (ไม่มี character filter, ASCII ได้)
 */

import { test, expect } from "../fixtures/base.fixture.js";

const LIST_URL = "/admin/students/alumni";
const NEW_URL  = "/admin/students/alumni/new";

// ── Helpers ───────────────────────────────────────────────────

function makeAlumniData() {
  const ts = Date.now().toString().slice(-8);
  return {
    name:        "สมชาย",           // Thai, short — fill() ได้
    lastname:    "ทดสอบ",           // Thai, short
    university:  `UNI-TEST-${ts}`,  // ASCII → unique search key
    major:       `MAJOR-${ts}`,     // ASCII
    graduatedYear: "2566",
    ts,
  };
}

/**
 * กรอกฟอร์ม alumni /new ด้วยข้อมูลขั้นต่ำ (required fields)
 * required: name, lastname, major, university, graduatedYear
 */
async function fillAlumniForm(page, d) {
  await page.getByPlaceholder("สมชาย").fill(d.name);
  await page.getByPlaceholder("ประเสริฐ").fill(d.lastname);
  await page.getByPlaceholder("KMITL").fill(d.university);
  await page.getByPlaceholder("วิศวกรรมหุ่นยนต์").fill(d.major);
  await page.getByPlaceholder("2565", { exact: true }).fill(d.graduatedYear);
}

/**
 * สร้าง Alumni ผ่าน UI พร้อมดัก POST /api/alumni
 * คืน created alumni object (มี id)
 * หมายเหตุ: addAlumni() ใน /new ไม่ await → POST fire แบบ async
 */
async function createAlumniViaUI(page, d) {
  await page.goto(NEW_URL);
  await fillAlumniForm(page, d);

  const [response] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes("/api/alumni") && r.request().method() === "POST",
      { timeout: 15_000 },
    ),
    page.getByRole("button", { name: "บันทึกข้อมูล" }).click(),
  ]);
  expect(response.status()).toBe(201);
  await expect(page.getByText("เพิ่มศิษย์เก่าสำเร็จ!")).toBeVisible({ timeout: 10_000 });
  return response.json();
}

/**
 * ค้นหา Alumni ใน list ด้วย university (ASCII)
 * Alumni list ใช้ live filter ผ่าน searchInput (ไม่ต้อง Enter)
 * คืน row แรกที่ match
 */
async function searchAndGetAlumniRow(page, university) {
  await page.goto(LIST_URL);
  await page.waitForLoadState("networkidle");

  const searchInput = page.getByPlaceholder(
    "ชื่อ นามสกุล บริษัท มหาวิทยาลัย (Enter เพื่อค้นหา)"
  );
  await searchInput.fill(university);   // live filter

  const row = page.getByRole("row").filter({ hasText: university });
  await expect(row.first()).toBeVisible({ timeout: 10_000 });
  return row.first();
}

// ── Tests: List / New page ─────────────────────────────────────

test("หน้า Alumni List โหลดและแสดงลิงก์ 'เพิ่มศิษย์เก่า'", async ({ page }) => {
  await page.goto(LIST_URL);
  await expect(
    page.getByRole("link", { name: /เพิ่มศิษย์เก่า/ })
  ).toBeVisible({ timeout: 8_000 });
});

test("หน้า /new โหลดได้และแสดงฟอร์ม", async ({ page }) => {
  await page.goto(NEW_URL);
  await expect(page.getByPlaceholder("สมชาย")).toBeVisible();
  await expect(page.getByPlaceholder("KMITL")).toBeVisible();
  await expect(page.getByPlaceholder("2565", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "บันทึกข้อมูล" })).toBeVisible();
});

test("ปุ่มบันทึกถูก disable เมื่อฟอร์มยังไม่ครบ", async ({ page }) => {
  await page.goto(NEW_URL);
  // กรอกแค่ name — ยังขาด lastname, university, major, graduatedYear
  await page.getByPlaceholder("สมชาย").fill("สมชาย");
  await expect(page.getByRole("button", { name: "บันทึกข้อมูล" })).toBeDisabled();
});

// ── Tests: Create ──────────────────────────────────────────────

test("สร้าง Alumni ใหม่สำเร็จ → แสดง success state", async ({ page }) => {
  const d = makeAlumniData();
  await createAlumniViaUI(page, d);
});

test("Alumni ที่สร้างใหม่ค้นหาเจอในรายการ", async ({ page }) => {
  const d = makeAlumniData();
  await createAlumniViaUI(page, d);

  // ค้นหาด้วย university (ASCII)
  await searchAndGetAlumniRow(page, d.university);
});

// ── Tests: Edit ────────────────────────────────────────────────

test("แก้ไข Alumni — บันทึก remark → API ยืนยัน", async ({ page }) => {
  const d = makeAlumniData();
  const alumni = await createAlumniViaUI(page, d);

  // navigate ตรงไปที่ detail page
  await page.goto(`/admin/students/alumni/${alumni.id}`);
  await page.waitForLoadState("networkidle");

  // กดปุ่ม "แก้ไข" (text button ไม่มี title=)
  await page.getByRole("button", { name: "แก้ไข" }).click();

  // remark textarea — textarea ตัวเดียวใน alumni detail form
  const remarkText = `REMARK-${d.ts}`;
  const remarkArea = page.locator("textarea").last();
  await expect(remarkArea).toBeVisible({ timeout: 5_000 });
  await remarkArea.fill(remarkText);

  // รอ PUT response + คลิก "บันทึก"
  const [putResp] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes("/api/alumni/") && r.request().method() === "PUT",
      { timeout: 15_000 },
    ),
    page.getByRole("button", { name: "บันทึก" }).click(),
  ]);
  expect(putResp.ok()).toBeTruthy();

  // ตรวจ response body
  const body = await putResp.json();
  expect(body.remark).toBe(remarkText);
});

// ── Tests: Delete ──────────────────────────────────────────────

test("ลบ Alumni → หายจากรายการ", async ({ page }) => {
  const d = makeAlumniData();
  await createAlumniViaUI(page, d);

  // ไปที่ list แล้วค้นหา
  const row = await searchAndGetAlumniRow(page, d.university);
  await row.getByTitle("ลบ").click();

  // DeleteModal
  await expect(page.getByText("ยืนยันการลบข้อมูล")).toBeVisible({ timeout: 5_000 });

  // รอ DELETE + confirm
  const [delResp] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes("/api/alumni/") && r.request().method() === "DELETE",
      { timeout: 10_000 },
    ),
    page.getByRole("button", { name: "ลบข้อมูล" }).click(),
  ]);
  expect(delResp.ok()).toBeTruthy();

  // modal ปิด + row หาย (search input ยังมีค่าอยู่)
  await expect(page.getByText("ยืนยันการลบข้อมูล")).not.toBeVisible({ timeout: 5_000 });
  await expect(
    page.getByRole("row").filter({ hasText: d.university })
  ).not.toBeVisible({ timeout: 5_000 });
});
