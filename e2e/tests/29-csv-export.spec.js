/**
 * 29-csv-export.spec.js — ทดสอบ CSV export ทุกโมดูล
 * ─────────────────────────────────────────────────────────────
 * ใช้ page.waitForEvent("download") ดัก a.click() blob-download
 * แต่ละโมดูลมีปุ่ม "ส่งออก CSV" หรือ dropdown ที่มีตัวเลือก export
 *
 * Students — dropdown "ส่งออก CSV" → เลือก "ผลการกรอง (...)"
 * Companies — ปุ่ม "ส่งออก CSV" ตรง
 * FAQ       — ปุ่ม "ส่งออก CSV" ตรง
 * Documents — ปุ่ม "ส่งออก CSV" ตรง (ถ้ามี)
 * Jobs      — ปุ่ม "ส่งออก CSV" ตรง
 */

import { test, expect } from "../fixtures/base.fixture.js";

test("CSV Export — Students: เปิด dropdown + export ผลการกรอง → download เกิดขึ้น", async ({ page }) => {
  await page.goto("/admin/students/list");
  // รอหน้าโหลด
  await expect(page.getByRole("button", { name: /ส่งออก CSV/ })).toBeVisible({ timeout: 10_000 });

  // เปิด dropdown
  await page.getByRole("button", { name: /ส่งออก CSV/ }).click();
  await expect(page.getByText(/ผลการกรอง/)).toBeVisible();

  // ดัก download event แล้วคลิก
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByText(/ผลการกรอง/).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/students.*\.csv$/);
});

test("CSV Export — Companies: กด ส่งออก CSV → download เกิดขึ้น", async ({ page }) => {
  await page.goto("/admin/companies/list");
  await expect(page.getByRole("button", { name: "ส่งออก CSV" })).toBeVisible({ timeout: 10_000 });

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "ส่งออก CSV" }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/companies.*\.csv$/);
});

test("CSV Export — FAQ: กด ส่งออก CSV → download เกิดขึ้น", async ({ page }) => {
  await page.goto("/admin/information/faq");
  await expect(page.getByRole("button", { name: "ส่งออก CSV" })).toBeVisible({ timeout: 10_000 });

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "ส่งออก CSV" }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/faq.*\.csv$/);
});

test("CSV Export — Job Positions: กด ส่งออก CSV → download เกิดขึ้น", async ({ page }) => {
  await page.goto("/admin/marketplace/job-positions");
  await expect(page.getByRole("button", { name: "ส่งออก CSV" })).toBeVisible({ timeout: 10_000 });

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "ส่งออก CSV" }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/job.*\.csv$/);
});

test("CSV Export — Applications: กด ส่งออก CSV → download เกิดขึ้น", async ({ page }) => {
  await page.goto("/admin/marketplace/applications");
  await expect(page.getByRole("button", { name: "ส่งออก CSV" })).toBeVisible({ timeout: 10_000 });

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "ส่งออก CSV" }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/mapping.*\.csv$|application.*\.csv$/);
});
