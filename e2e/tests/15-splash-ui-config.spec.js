/**
 * 15-splash-ui-config.spec.js — ทดสอบ UI ของ Splash Config
 * ─────────────────────────────────────────────────────────────
 * Splash เป็น config page เดียว (ไม่มี CRUD list) — ทำงานผ่าน PUT /api/splash
 *
 * Flow:
 *   โหลดหน้า → form ปรากฏ → แก้ไข title/body → กด "บันทึก"
 *   → PUT /api/splash → button เปลี่ยนเป็น "บันทึกแล้ว" (2.5 วิ)
 *
 * หมายเหตุ:
 * - updateConfig(form) ไม่ await ใน handleSave → ใช้ waitForResponse(PUT /api/splash)
 * - form โหลดจาก API ใน useEffect → รอ form ปรากฏก่อน interact (waitForLoadState networkidle)
 * - "บันทึก" เปลี่ยนเป็น "บันทึกแล้ว" หลัง save → assert text นั้น
 * - enabled toggle: ถ้า disabled → form opacity-40 → แต่ยังทดสอบ save ได้
 */

import { test, expect } from "../fixtures/base.fixture.js";

const CONFIG_URL = "/admin/information/splash";

// ── Tests: Smoke ──────────────────────────────────────────────

test("หน้า Splash Config โหลดได้", async ({ page }) => {
  await page.goto(CONFIG_URL);
  await expect(page.getByRole("main")).toBeVisible();
});

test("ปุ่ม 'บันทึก' ปรากฏ", async ({ page }) => {
  await page.goto(CONFIG_URL);
  await page.waitForLoadState("networkidle");
  await expect(
    page.getByRole("button", { name: "บันทึก" })
  ).toBeVisible({ timeout: 8_000 });
});

test("form มี input ชื่อ Splash (title) และ body textarea", async ({ page }) => {
  await page.goto(CONFIG_URL);
  await page.waitForLoadState("networkidle");
  // title input
  await expect(
    page.getByPlaceholder("เช่น ประกาศสำคัญ, ยินดีต้อนรับ")
  ).toBeVisible({ timeout: 8_000 });
  // body textarea
  await expect(
    page.getByPlaceholder("ข้อความเพิ่มเติม...")
  ).toBeVisible({ timeout: 5_000 });
});

test("มี toggle สำหรับเปิด/ปิด Splash", async ({ page }) => {
  await page.goto(CONFIG_URL);
  await page.waitForLoadState("networkidle");
  // Toggle อยู่ใน row ที่มีข้อความเกี่ยวกับ Splash enabled
  await expect(
    page.getByText(/Splash จะแสดงเมื่อผู้เยี่ยมชม|ปิดอยู่/)
  ).toBeVisible({ timeout: 8_000 });
});

// ── Tests: Save ───────────────────────────────────────────────

test("กด 'บันทึก' → PUT /api/splash สำเร็จ → button แสดง 'บันทึกแล้ว'", async ({ page }) => {
  await page.goto(CONFIG_URL);
  await page.waitForLoadState("networkidle");

  // รอปุ่ม "บันทึก" พร้อม
  const saveBtn = page.getByRole("button", { name: "บันทึก" });
  await expect(saveBtn).toBeVisible({ timeout: 8_000 });

  // updateConfig() ไม่ await ใน handleSave → ใช้ waitForResponse
  const [putResp] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes("/api/splash") && r.request().method() === "PUT",
      { timeout: 10_000 },
    ),
    saveBtn.click(),
  ]);
  expect(putResp.ok()).toBeTruthy();

  // หลัง save — button เปลี่ยนเป็น "บันทึกแล้ว" (2.5 วิ)
  await expect(
    page.getByRole("button", { name: "บันทึกแล้ว" })
  ).toBeVisible({ timeout: 5_000 });
});

test("แก้ไข title แล้ว save → API รับค่าใหม่", async ({ page }) => {
  await page.goto(CONFIG_URL);
  await page.waitForLoadState("networkidle");

  const titleInput = page.getByPlaceholder("เช่น ประกาศสำคัญ, ยินดีต้อนรับ");
  await expect(titleInput).toBeVisible({ timeout: 8_000 });

  const newTitle = `Splash Test ${Date.now().toString().slice(-6)}`;
  await titleInput.fill(newTitle);

  const [putResp] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes("/api/splash") && r.request().method() === "PUT",
      { timeout: 10_000 },
    ),
    page.getByRole("button", { name: "บันทึก" }).click(),
  ]);
  expect(putResp.ok()).toBeTruthy();

  const body = await putResp.json();
  expect(body.title).toBe(newTitle);
});

test("รีโหลดหน้า → title ที่บันทึกไว้ยังอยู่", async ({ page }) => {
  await page.goto(CONFIG_URL);
  await page.waitForLoadState("networkidle");

  // บันทึก title ใหม่
  const titleInput = page.getByPlaceholder("เช่น ประกาศสำคัญ, ยินดีต้อนรับ");
  await expect(titleInput).toBeVisible({ timeout: 8_000 });
  const newTitle = `Persist Test ${Date.now().toString().slice(-6)}`;
  await titleInput.fill(newTitle);

  await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes("/api/splash") && r.request().method() === "PUT",
      { timeout: 10_000 },
    ),
    page.getByRole("button", { name: "บันทึก" }).click(),
  ]);

  // รีโหลดหน้า
  await page.reload();
  await page.waitForLoadState("networkidle");

  // title ควรยังอยู่
  await expect(
    page.getByPlaceholder("เช่น ประกาศสำคัญ, ยินดีต้อนรับ")
  ).toHaveValue(newTitle, { timeout: 8_000 });
});
