/**
 * 11-mapping-ui-crud.spec.js — ทดสอบ UI ของ Applications/Mapping
 * ─────────────────────────────────────────────────────────────
 * Mapping ใช้ modal inline:
 *   - "เพิ่มรายการ" → AddMappingModal
 *   - modal แสดง section เลือกนักเรียน + ตำแหน่งงาน
 *   - ConfirmDeleteModal ใช้ confirmLabel "ลบข้อมูล"
 *
 * หมายเหตุ: การสร้าง Mapping ต้องเลือกนักเรียนและตำแหน่งงาน
 * ผ่าน dynamic search — ทดสอบเฉพาะ smoke + modal lifecycle
 * ไม่ทดสอบ full form flow (ต้องการ seed data ที่แน่นอน)
 */

import { test, expect } from "../fixtures/base.fixture.js";

const LIST_URL = "/admin/marketplace/applications";

// ── tests ─────────────────────────────────────────────────────

test("หน้า Applications โหลดได้", async ({ page }) => {
  await page.goto(LIST_URL);
  // รอ page content โดย check main element
  await expect(page.getByRole("main")).toBeVisible();
});

test("ปุ่ม 'เพิ่มรายการ' ปรากฏ", async ({ page }) => {
  await page.goto(LIST_URL);
  await expect(
    page.getByRole("button", { name: "เพิ่มรายการ" })
  ).toBeVisible({ timeout: 8_000 });
});

test("กด 'เพิ่มรายการ' → AddMappingModal ขึ้น", async ({ page }) => {
  await page.goto(LIST_URL);
  await page.getByRole("button", { name: "เพิ่มรายการ" }).click();

  // Modal header
  await expect(page.getByText("เพิ่มรายการสมัครงาน")).toBeVisible({ timeout: 5_000 });
});

test("modal มี section นักเรียน และ ตำแหน่งงาน", async ({ page }) => {
  await page.goto(LIST_URL);
  await page.getByRole("button", { name: "เพิ่มรายการ" }).click();

  await expect(page.getByText("เพิ่มรายการสมัครงาน")).toBeVisible({ timeout: 5_000 });

  // ตรวจ search placeholders
  await expect(
    page.getByPlaceholder("พิมพ์ชื่อ, รหัส, หรือมหาวิทยาลัย...").first()
  ).toBeVisible();
  await expect(
    page.getByPlaceholder("พิมพ์ชื่อตำแหน่ง, บริษัท, หรือสาขา...").first()
  ).toBeVisible();
});

test("ปิด AddMappingModal ด้วย ESC", async ({ page }) => {
  await page.goto(LIST_URL);
  await page.getByRole("button", { name: "เพิ่มรายการ" }).click();
  await expect(page.getByText("เพิ่มรายการสมัครงาน")).toBeVisible({ timeout: 5_000 });

  await page.keyboard.press("Escape");
  await expect(page.getByText("เพิ่มรายการสมัครงาน")).not.toBeVisible({ timeout: 3_000 });
});

test("กด 'เพิ่มรายการ' โดยไม่เลือก → ปุ่มยืนยัน disabled", async ({ page }) => {
  await page.goto(LIST_URL);
  await page.getByRole("button", { name: "เพิ่มรายการ" }).click();
  await expect(page.getByText("เพิ่มรายการสมัครงาน")).toBeVisible({ timeout: 5_000 });

  // scope ปุ่ม confirm ใน modal overlay (ไม่ใช่ปุ่มใน list)
  const modal = page.locator(".fixed.inset-0.z-50").last();
  const confirmBtn = modal.getByRole("button", { name: "เพิ่มรายการ" });
  await expect(confirmBtn).toBeDisabled();
});
