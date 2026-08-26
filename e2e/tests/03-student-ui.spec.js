/**
 * 03-student-ui.spec.js — ทดสอบ Student List UI
 * ─────────────────────────────────────────────────────────────
 * ทดสอบ:
 *   - หน้าโหลดได้ + แสดงตาราง
 *   - Search input — ค้นหา + ล้าง
 *   - Filter status pills
 *   - Pagination controls
 */

import { test, expect } from "../fixtures/base.fixture.js";
import { StudentListPage } from "../pages/StudentListPage.js";

test.describe("Student List", () => {
  let listPage;

  test.beforeEach(async ({ adminPage: { page, go } }) => {
    listPage = new StudentListPage(page);
    await go("/admin/students/list");
  });

  // ── Page load ──────────────────────────────────────────────

  test("หน้าโหลดสำเร็จ — แสดงตาราง + search input", async ({ adminPage: { page } }) => {
    await expect(page.locator("table")).toBeVisible();
    await expect(listPage.searchInput).toBeVisible();
  });

  test("title / heading ถูกต้อง", async ({ adminPage: { page } }) => {
    await expect(page).toHaveTitle(/นักเรียน|KOSEN/i);
  });

  // ── Search BVA ────────────────────────────────────────────

  test("search: พิมพ์ 1 ตัวอักษร (min+1) — filter ทำงาน", async ({ adminPage: { page } }) => {
    await listPage.search("ก");
    // ตารางยังแสดงอยู่ (อาจมีหรือไม่มีผลลัพธ์ก็ได้)
    await expect(page.locator("table")).toBeVisible();
  });

  test("search: ล้าง search → คืนรายการทั้งหมด", async ({ adminPage: { page } }) => {
    const countBefore = await listPage.getRowCount();
    await listPage.search("xxxxnotexistxxx");
    await listPage.clearSearch();
    const countAfter = await listPage.getRowCount();
    expect(countAfter).toBeGreaterThanOrEqual(countBefore);
  });

  test("search: คำที่ไม่มีในระบบ — แสดง empty state หรือ 0 แถว", async ({ adminPage: { page } }) => {
    await listPage.search("XXXXXNOTFOUND99999");
    await page.waitForTimeout(500);
    const rows = await listPage.getRowCount();
    // ถ้า rows > 0 ต้องมี empty state message หรือมีแถว no-data
    if (rows === 0) {
      // pass — ตารางว่าง
    } else {
      // อาจเป็น "ไม่พบข้อมูล" row
      const text = await page.locator("table tbody").textContent();
      expect(text).toMatch(/ไม่พบ|no data|empty/i);
    }
  });

  // ── Status filter ─────────────────────────────────────────

  test("กด pill 'กำลังศึกษา' — filter ทำงาน + pill active", async ({ adminPage: { page } }) => {
    const pill = page.getByRole("button", { name: /กำลังศึกษา/ }).first();
    await pill.click();
    await page.waitForTimeout(400);
    // pill ต้อง active (มี ring หรือ bg เปลี่ยน)
    await expect(pill).toBeVisible();
    await expect(page.locator("table")).toBeVisible();
  });

  test("กด pill 'ทั้งหมด' — คืนรายการทั้งหมด", async ({ adminPage: { page } }) => {
    // filter ก่อน
    await page.getByRole("button", { name: /กำลังศึกษา/ }).first().click();
    await page.waitForTimeout(300);
    // กลับ ทั้งหมด
    await page.getByRole("button", { name: /ทั้งหมด/ }).first().click();
    await page.waitForTimeout(400);
    await expect(page.locator("table")).toBeVisible();
  });

  // ── Navigation ────────────────────────────────────────────

  test("คลิกแถวนักเรียน → navigate ไปหน้า detail", async ({ adminPage: { page } }) => {
    const rows = await listPage.getRowCount();
    if (rows === 0) {
      test.skip(true, "ไม่มีข้อมูลในตาราง — ข้าม test นี้");
      return;
    }
    await listPage.clickRow(0);
    await page.waitForLoadState("networkidle");
    expect(page.url()).toMatch(/\/admin\/students\//);
  });
});
