/**
 * 07-faq-ui-crud.spec.js — ทดสอบ UI CRUD ของ FAQ
 * ─────────────────────────────────────────────────────────────
 * FAQ ใช้ modal inline (ไม่ใช่หน้าแยก):
 *   - "+ เพิ่ม FAQ" → FaqModal (overlay fixed inset-0)
 *   - กรอก question / answer → กด "เพิ่ม FAQ" ใน modal
 *   - edit: กดปุ่ม title="แก้ไข" ใน row → modal → "บันทึกการแก้ไข"
 *   - delete: กดปุ่ม title="ลบ" ใน row → ConfirmDeleteModal → "ลบ FAQ"
 *
 * หมายเหตุ: ใช้ search เพื่อหา FAQ ที่สร้างใหม่ (เพราะรายการอาจอยู่หน้า 2+)
 */

import { test, expect } from "../fixtures/base.fixture.js";

const PAGE_URL = "/admin/information/faq";

// ── helpers ───────────────────────────────────────────────────

function makeQ() {
  const ts = Date.now().toString().slice(-8); // 8-digit timestamp suffix — ASCII digits สำหรับ search
  return {
    question: `FAQ-UI-TEST-${ts}`,   // ASCII เท่านั้น → fill() ทำงานได้
    answer:   `ANS-UI-TEST-${ts}`,   // ASCII เท่านั้น
    ts,
  };
}

/**
 * locator ของ overlay modal (container div ที่เป็น fixed inset-0)
 * ใช้เพื่อ scope button selectors ให้ไม่ชนกับปุ่มใน list
 */
const faqModal = (page) => page.locator(".fixed.inset-0.z-50").last();

/** สร้าง FAQ ผ่าน modal — รอ API response จาก POST /api/faq ก่อน return */
async function createFaqViaUI(page, { question, answer }) {
  await page.getByRole("button", { name: "+ เพิ่ม FAQ" }).click();

  const modal = faqModal(page);
  await expect(modal.getByText("เพิ่ม FAQ ใหม่")).toBeVisible({ timeout: 5_000 });

  await page.getByPlaceholder("คำถามที่พบบ่อย...").fill(question);
  await page.getByPlaceholder("คำตอบอธิบาย...").fill(answer);

  // รอ API response พร้อมกับคลิกปุ่ม — ป้องกัน race condition
  // (addFaq ใน FaqListClient ไม่ await → modal ปิดก่อน API ตอบ)
  const [response] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes("/api/faq") && r.request().method() === "POST",
      { timeout: 10_000 }
    ),
    modal.getByRole("button", { name: "เพิ่ม FAQ" }).click(),
  ]);

  // ตรวจ status — ถ้า API fail ให้ test fail ชัดเจน
  expect(response.status()).toBe(201);

  // modal ปิด
  await expect(modal.getByText("เพิ่ม FAQ ใหม่")).not.toBeVisible({ timeout: 5_000 });
}

/**
 * ค้นหา FAQ ด้วย ASCII search term แล้ว return row
 * หมายเหตุ: fill() กับ Thai text ทำให้ page hang ใน Chromium;
 * searchTerm ต้องเป็น ASCII เท่านั้น
 */
async function searchAndGetRow(page, searchTerm, rowHasText) {
  const searchInput = page.getByPlaceholder("คำถาม คำตอบ หมวดหมู่ (Enter เพื่อค้นหา)");
  await searchInput.fill(searchTerm);  // searchTerm ต้องเป็น ASCII

  const row = page.getByRole("row").filter({ hasText: rowHasText ?? searchTerm });
  await expect(row).toBeVisible({ timeout: 10_000 });
  return row;
}

// ── tests ─────────────────────────────────────────────────────

test("หน้า FAQ โหลดและแสดงปุ่ม '+ เพิ่ม FAQ'", async ({ page }) => {
  await page.goto(PAGE_URL);
  await expect(page.getByRole("button", { name: "+ เพิ่ม FAQ" })).toBeVisible();
});

test("กด '+ เพิ่ม FAQ' → modal ปรากฏพร้อม textarea", async ({ page }) => {
  await page.goto(PAGE_URL);
  await page.getByRole("button", { name: "+ เพิ่ม FAQ" }).click();

  const modal = faqModal(page);
  await expect(modal.getByText("เพิ่ม FAQ ใหม่")).toBeVisible({ timeout: 5_000 });
  await expect(page.getByPlaceholder("คำถามที่พบบ่อย...")).toBeVisible();
  await expect(page.getByPlaceholder("คำตอบอธิบาย...")).toBeVisible();
});

test("submit FAQ ว่างไม่ได้ — แสดง error validation", async ({ page }) => {
  await page.goto(PAGE_URL);
  await page.getByRole("button", { name: "+ เพิ่ม FAQ" }).click();

  const modal = faqModal(page);
  await expect(modal.getByText("เพิ่ม FAQ ใหม่")).toBeVisible();

  // กดยืนยันโดยไม่กรอก
  await modal.getByRole("button", { name: "เพิ่ม FAQ" }).click();

  // modal ยังอยู่ และมี error
  await expect(modal.getByText("กรุณากรอกคำถาม")).toBeVisible();
});

test("สร้าง FAQ ใหม่สำเร็จ → ค้นหาเจอในตาราง", async ({ page }) => {
  const { question, answer } = makeQ();
  await page.goto(PAGE_URL);
  await createFaqViaUI(page, { question, answer });

  // ใช้ search เพื่อหา FAQ ที่เพิ่งสร้าง (อาจอยู่หน้า 2+)
  await searchAndGetRow(page, question);
});

test("แก้ไข FAQ — เปลี่ยนคำตอบ → บันทึกสำเร็จ", async ({ page }) => {
  const { question, answer } = makeQ();
  await page.goto(PAGE_URL);
  await createFaqViaUI(page, { question, answer });

  // ค้นหา row ที่มี question นั้น
  const row = await searchAndGetRow(page, question);
  await row.getByTitle("แก้ไข").click();

  const modal = faqModal(page);
  await expect(modal.getByText("แก้ไข FAQ")).toBeVisible({ timeout: 5_000 });

  // แก้ไขคำตอบ
  const newAnswer = `${answer} — แก้ไขแล้ว`;
  await page.getByPlaceholder("คำตอบอธิบาย...").fill(newAnswer);
  await modal.getByRole("button", { name: "บันทึกการแก้ไข" }).click();

  // modal ปิด
  await expect(modal.getByText("แก้ไข FAQ")).not.toBeVisible({ timeout: 5_000 });
});

test("ลบ FAQ → หายจากผลค้นหา", async ({ page }) => {
  const { question, answer } = makeQ();
  await page.goto(PAGE_URL);
  await createFaqViaUI(page, { question, answer });

  // ค้นหา row
  const row = await searchAndGetRow(page, question);
  await row.getByTitle("ลบ").click();

  // ConfirmDeleteModal ขึ้น
  await expect(page.getByText("ยืนยันการลบ FAQ")).toBeVisible({ timeout: 5_000 });
  await page.getByRole("button", { name: "ลบ FAQ" }).click();

  // modal ปิด
  await expect(page.getByText("ยืนยันการลบ FAQ")).not.toBeVisible({ timeout: 5_000 });

  // ค้นหาใหม่ — ควรไม่เจอ
  await expect(page.getByRole("row").filter({ hasText: question })).not.toBeVisible({ timeout: 5_000 });
});

test("ปิด modal ด้วย ESC → modal หายไป", async ({ page }) => {
  await page.goto(PAGE_URL);
  await page.getByRole("button", { name: "+ เพิ่ม FAQ" }).click();

  const modal = faqModal(page);
  await expect(modal.getByText("เพิ่ม FAQ ใหม่")).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(modal.getByText("เพิ่ม FAQ ใหม่")).not.toBeVisible({ timeout: 3_000 });
});
